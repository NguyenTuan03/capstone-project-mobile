import CourseDetailModal from "@/components/learner/courses/CourseDetailModal";
import CourseList from "@/components/learner/courses/CourseList";
import CoursesHeader from "@/components/learner/courses/CoursesHeader";
import LocationFilter from "@/components/learner/courses/LocationFilter";
import LocationSelectionModal from "@/components/learner/courses/LocationSelectionModal";
import SearchBarWithFilter from "@/components/learner/courses/SearchBarWithFilter";
import styles from "@/components/learner/courses/styles";
import type { CoursesResponse, District, PaymentLinkResponse, Province } from "@/components/learner/courses/types";
import { get, post } from "@/services/http/httpService";
import { Course } from "@/types/course";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const getParams = (url: string) =>
  Object.fromEntries(new URL(url).searchParams.entries());

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const [processingPayment, setProcessingPayment] = useState<number | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
  const [coachRatings, setCoachRatings] = useState<Record<number, number>>({});
  const hasInitialized = useRef(false);

  const fetchProvinces = useCallback(async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      const provincesData = res.data || [];
      setProvinces(provincesData);
      return provincesData;
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (provinceId: number) => {
    try {
      setLoadingDistricts(true);
      const res = await get<District[]>(
        `/v1/provinces/${provinceId}/districts`
      );
      setDistricts(res.data || []);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadUserLocation = useCallback(async (provincesList: Province[]) => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;

      const userData = JSON.parse(userString);
      let learner = null;
      if (userData?.metadata?.user?.learner?.[0]) {
        learner = userData.metadata.user.learner[0];
      } else if (userData?.learner?.[0]) {
        learner = userData.learner[0];
      }

      if (learner?.province && learner?.district) {
        const userProvince = provincesList.find(
          (p) => p.id === learner.province.id
        );

        if (userProvince) {
          setSelectedProvince(userProvince);
          const districtsRes = await get<District[]>(
            `/v1/provinces/${userProvince.id}/districts`
          );
          const districtsList = districtsRes.data || [];
          const userDistrict = districtsList.find(
            (d) => d.id === learner.district.id
          );
          if (userDistrict) {
            setSelectedDistrict(userDistrict);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initializeData = async () => {
      const provincesRes = await fetchProvinces();
      if (mounted && provincesRes) {
        await loadUserLocation(provincesRes);
      }
    };
    initializeData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.id);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [fetchDistricts, selectedProvince]);

  const fetchCoachRating = useCallback(async (coachId: number) => {
    try {
      const res = await get<{
        statusCode: number;
        message: string;
        metadata: number;
      }>(`/v1/coaches/${coachId}/rating/overall`);
      const rating = res?.data?.metadata;
      return typeof rating === "number" && rating > 0 ? rating : null;
    } catch {
      return null;
    }
  }, []);

  const fetchUserCoachId = useCallback(async (userId: number) => {
    try {
      const res = await get<{
        id: number;
        coach?: { id: number }[] | null;
      }>(`/v1/users/${userId}`);
      if (res?.data?.coach && res.data.coach.length > 0) {
        return res.data.coach[0].id;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchCoachesRatings = useCallback(
    async (userIds: number[]) => {
      try {
        const uniqueUserIds = [...new Set(userIds)];
        const coachIdResults = await Promise.allSettled(
          uniqueUserIds.map((userId) =>
            fetchUserCoachId(userId).then((coachId) => ({ userId, coachId }))
          )
        );

        const userIdToCoachIdMap: Record<number, number> = {};
        const coachIds: number[] = [];

        coachIdResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value.coachId !== null) {
            userIdToCoachIdMap[result.value.userId] = result.value.coachId;
            coachIds.push(result.value.coachId);
          }
        });

        const ratingResults = await Promise.allSettled(
          coachIds.map((coachId) =>
            fetchCoachRating(coachId).then((rating) => ({ coachId, rating }))
          )
        );

        const coachIdToRatingMap: Record<number, number> = {};
        ratingResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value.rating !== null) {
            coachIdToRatingMap[result.value.coachId] = result.value.rating;
          }
        });

        const ratingsMap: Record<number, number> = {};
        Object.keys(userIdToCoachIdMap).forEach((userIdStr) => {
          const userId = Number(userIdStr);
          const coachId = userIdToCoachIdMap[userId];
          if (coachIdToRatingMap[coachId] !== undefined) {
            ratingsMap[userId] = coachIdToRatingMap[coachId];
          }
        });

        setCoachRatings((prev) => ({ ...prev, ...ratingsMap }));
      } catch {
        // ignore rating errors
      }
    },
    [fetchCoachRating, fetchUserCoachId]
  );

  const fetchCourses = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const provinceQuery = selectedProvince
          ? `&province=${selectedProvince.id}`
          : "";
        const districtQuery = selectedDistrict
          ? `&district=${selectedDistrict.id}`
          : "";
        const url = `/v1/courses/available?page=${pageNum}&size=${pageSize}${provinceQuery}${districtQuery}`;
        const res = await get<CoursesResponse>(url);

        const newCourses = res.data.items || [];
        if (append) {
          setCourses((prev) => [...prev, ...newCourses]);
        } else {
          setCourses(newCourses);
        }

        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);

        const userIds = newCourses
          .map((c) => c.createdBy?.id)
          .filter((id): id is number => id !== undefined);
        if (userIds.length > 0) {
          fetchCoachesRatings(userIds);
        }
      } catch {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải danh sách khóa học",
          position: "top",
          visibilityTime: 4000,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fetchCoachesRatings, pageSize, selectedDistrict, selectedProvince]
  );

  // Fetch courses khi location thay đổi
  useEffect(() => {
    if (hasInitialized.current) {
      fetchCourses(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince?.id, selectedDistrict?.id]);

  // Fetch lần đầu khi mount hoặc khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        fetchCourses(1, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && courses.length < total) {
      fetchCourses(page + 1, true);
    }
  }, [courses.length, fetchCourses, loadingMore, page, total]);

  const handleRegister = useCallback(
    async (courseId: number) => {
      setProcessingPayment(courseId);
      try {
        const res = await post<PaymentLinkResponse>(
          `/v1/payments/courses/${courseId}/link`,
          {}
        );
        const checkoutUrl = res?.data?.metadata?.checkoutUrl;
        if (!checkoutUrl) throw new Error("Không có checkoutUrl");

        const returnUri = Linking.createURL("courses/payments/return");

        const waitDeepLink = new Promise<string>((resolve) => {
          const sub = Linking.addEventListener("url", ({ url }) => {
            sub.remove();
            resolve(url);
          });
        });

        const auth = WebBrowser.openAuthSessionAsync(checkoutUrl, returnUri);
        const winner = (await Promise.race([auth, waitDeepLink])) as
          | { type: "success" | "cancel"; url?: string }
          | string;

        const callbackUrl = typeof winner === "string" ? winner : winner.url;
        if (!callbackUrl) {
          return;
        }

        const { status = "", cancel = "", orderCode } = getParams(callbackUrl);
        const paid =
          status.toUpperCase() === "PAID" && cancel.toLowerCase() !== "true";

        if (paid) {
          Toast.show({
            type: "success",
            text1: "Thành công",
            text2: `Mã đơn: ${orderCode || "N/A"}`,
            position: "top",
            visibilityTime: 4000,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Đã hủy",
            text2: "Thanh toán không thành công.",
            position: "top",
            visibilityTime: 4000,
          });
        }
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: e?.Message ?? "Có lỗi khi thanh toán.",
          position: "top",
          visibilityTime: 4000,
        });
      } finally {
        setProcessingPayment(null);
      }
    },
    []
  );

  const handleCourseRegister = useCallback(
    (courseId: number) => {
      handleRegister(courseId);
      setShowCourseDetailModal(false);
    },
    [handleRegister]
  );

  return (
    <View style={styles.safe}>
      <CoursesHeader />

      <ScrollView contentContainerStyle={styles.container}>
        <SearchBarWithFilter
          value={searchKeyword}
          onChange={setSearchKeyword}
        />

        <LocationFilter
          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          onSelectProvince={() => setShowProvinceModal(true)}
          onSelectDistrict={() =>
            selectedProvince && setShowDistrictModal(true)
          }
          onClear={() => {
            setSelectedProvince(null);
            setSelectedDistrict(null);
          }}
        />

        <CourseList
          courses={courses}
          loading={loading}
          loadingMore={loadingMore}
          total={total}
          coachRatings={coachRatings}
          onLoadMore={loadMore}
          onSelectCourse={(course) => {
            setSelectedCourse(course);
            setShowCourseDetailModal(true);
          }}
        />
      </ScrollView>

      <CourseDetailModal
        visible={showCourseDetailModal}
        course={selectedCourse}
        coachRatings={coachRatings}
        processingPaymentId={processingPayment}
        onClose={() => setShowCourseDetailModal(false)}
        onRegister={handleCourseRegister}
        bottomInset={insets.bottom}
      />

      <LocationSelectionModal
        title="Chọn tỉnh/thành phố"
        items={provinces}
        visible={showProvinceModal}
        loading={loadingProvinces}
        selectedItem={selectedProvince}
        onSelect={(province) => {
          setSelectedProvince(province);
          setSelectedDistrict(null);
          setShowProvinceModal(false);
        }}
        onClose={() => setShowProvinceModal(false)}
        bottomInset={insets.bottom}
      />

      <LocationSelectionModal
        title="Chọn quận/huyện"
        items={districts}
        visible={showDistrictModal}
        loading={loadingDistricts}
        selectedItem={selectedDistrict}
        onSelect={(district) => {
          setSelectedDistrict(district);
          setShowDistrictModal(false);
        }}
        onClose={() => setShowDistrictModal(false)}
        bottomInset={insets.bottom}
      />
    </View>
  );
}
