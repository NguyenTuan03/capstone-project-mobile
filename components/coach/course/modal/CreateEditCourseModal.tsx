import CourtSelectionModal from "@/components/coach/course/modal/CourtSelectionModal";
import SubjectSelectionModal from "@/components/coach/course/modal/SubjectSelectionModal";
import { DAYS_OF_WEEK, DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import RangeSlider from "@/components/common/RangeSlider";
import configurationService from "@/services/configurationService";
import courtService from "@/services/court.service";
import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { LearningFormat, Schedule } from "@/types/course";
import { Court } from "@/types/court";
import { Subject } from "@/types/subject";
import { formatPrice } from "@/utils/priceFormat";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Province = {
  id: number;
  name: string;
};

type District = {
  id: number;
  name: string;
};

type CourseFormData = {
  subjectId: number | null;
  learningFormat: LearningFormat;
  minParticipants: string;
  maxParticipants: string;
  pricePerParticipant: string;
  startDate: string;
  address: string;
  province: Province | null;
  district: District | null;
  schedules: Schedule[];
  court: Court | null;
  publicUrl?: string | null;
  googleMeetLink?: string | null;
};

type SelectedCourseImage = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

type CreateEditCourseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subjectId: number;
    learningFormat: LearningFormat;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    court?: number | undefined;
    schedules?: Schedule[];
    courseImage?: SelectedCourseImage;
  }) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: Partial<CourseFormData>;
  subjectFilter?: string;
};

export default function CreateEditCourseModal({
  visible,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
  subjectFilter = "status_eq_PUBLISHED",
}: CreateEditCourseModalProps) {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    initialData?.subjectId || null
  );
  const [learningFormat, setLearningFormat] = useState<LearningFormat>(
    initialData?.learningFormat || "GROUP"
  );
  const [minParticipants, setMinParticipants] = useState(
    initialData?.minParticipants?.toString() || "2"
  );
  const [maxParticipants, setMaxParticipants] = useState(
    initialData?.maxParticipants?.toString() || "6"
  );
  const [pricePerParticipant, setPricePerParticipant] = useState(
    initialData?.pricePerParticipant || ""
  );
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    initialData?.province || null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    initialData?.district || null
  );
  const [schedules, setSchedules] = useState<Schedule[]>(
    initialData?.schedules || []
  );
  const [courseStartDateAfterDaysFromNow, setCourseStartDateAfterDaysFromNow] =
    useState<number>(7);
  const [maxParticipantsLimit, setMaxParticipantsLimit] = useState<number>(12);

  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [loadingAvailableSchedules, setLoadingAvailableSchedules] =
    useState(false);

  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedCourseImage, setSelectedCourseImage] =
    useState<SelectedCourseImage | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [googleMeetLink, setGoogleMeetLink] = useState(
    initialData?.googleMeetLink || ""
  );

  // UI states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<
    number | null
  >(null);
  const [tempSchedule, setTempSchedule] = useState<Schedule>({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "11:00",
    totalSessions: 1,
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<Date>(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState<Date>(new Date());

  const loadUserLocation = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const userData = JSON.parse(userString);

        if (userData?.province && userData?.district) {
          // Fetch provinces first if not already cached
          let provincesList = provinces;
          if (provincesList.length === 0) {
            const res = await get<Province[]>("/v1/provinces");
            provincesList = res.data || [];
          }

          const userProvince = provincesList.find(
            (p) => p.id === userData.province.id
          );
          if (userProvince) {
            setSelectedProvince(userProvince);
            // Fetch districts for this province
            const districtsRes = await get<District[]>(
              `/v1/provinces/${userProvince.id}/districts`
            );
            const districtsList = districtsRes.data || [];

            const userDistrict = districtsList.find(
              (d) => d.id === userData.district.id
            );
            if (userDistrict) {
              setSelectedDistrict(userDistrict);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user location:", error);
    }
  }, [provinces]);

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      fetchProvinces();
      if (initialData) {
        // Reset form with initial data
        setSelectedSubjectId(initialData.subjectId || null);
        setLearningFormat(initialData.learningFormat || "GROUP");
        setMinParticipants(initialData.minParticipants?.toString() || "2");
        setMaxParticipants(initialData.maxParticipants?.toString() || "6");
        setPricePerParticipant(
          initialData.pricePerParticipant?.toString() || ""
        );
        setStartDate(initialData.startDate || "");
        setSelectedProvince(initialData.province || null);
        setSelectedDistrict(initialData.district || null);
        setSchedules(initialData.schedules || []);
        setGoogleMeetLink(initialData.googleMeetLink || "");
      } else {
        // Reset form for create mode
        setSelectedSubjectId(null);
        setLearningFormat("GROUP");
        setMinParticipants("2");
        setMaxParticipants("6");
        setPricePerParticipant("");
        setStartDate("");
        setSelectedProvince(null);
        setSelectedDistrict(null);
        setSchedules([]);
        setGoogleMeetLink("");
        // Load user location as default for create mode
        loadUserLocation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialData, subjectFilter]);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.id);
      // Clear district and court when province changes
      setSelectedDistrict(null);
      setSelectedCourt(null);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setSelectedCourt(null);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (learningFormat === "INDIVIDUAL") {
      setMinParticipants("1");
      setMaxParticipants("1");
    }
  }, [learningFormat]);

  useEffect(() => {
    fetchCoachAvailableSchedules();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await configurationService.getConfiguration(
          "course_start_date_after_days_from_now"
        );
        // cfg shape may vary; treat as any to safely read possible locations
        const raw: any = cfg as any;
        let days: number = 7;
        if (raw == null) {
          days = 7;
        } else if (typeof raw === "number") {
          days = raw;
        } else if (typeof raw === "string") {
          const n = Number(raw);
          days = Number.isNaN(n) ? 7 : n;
        } else if (typeof raw === "object") {
          if (raw.value != null) days = Number(raw.value);
          else if (raw.metadata && raw.metadata.value != null)
            days = Number(raw.metadata.value);
          else if (raw.data && raw.data.value != null)
            days = Number(raw.data.value);
          else if (raw.valueRaw != null) days = Number(raw.valueRaw);
          if (Number.isNaN(days)) days = 7;
        }
        setCourseStartDateAfterDaysFromNow(days);

        // Also load max participants limit
        const maxPartCfg = await configurationService.getConfiguration(
          "max_participants_per_course"
        );
        const maxRaw: any = maxPartCfg as any;
        let maxParticipants: number = 12;
        if (maxRaw == null) {
          maxParticipants = 12;
        } else if (typeof maxRaw === "number") {
          maxParticipants = maxRaw;
        } else if (typeof maxRaw === "string") {
          const n = Number(maxRaw);
          maxParticipants = Number.isNaN(n) ? 12 : n;
        } else if (typeof maxRaw === "object") {
          if (maxRaw.value != null) maxParticipants = Number(maxRaw.value);
          else if (maxRaw.metadata && maxRaw.metadata.value != null)
            maxParticipants = Number(maxRaw.metadata.value);
          else if (maxRaw.data && maxRaw.data.value != null)
            maxParticipants = Number(maxRaw.data.value);
          else if (maxRaw.valueRaw != null)
            maxParticipants = Number(maxRaw.valueRaw);
          if (Number.isNaN(maxParticipants)) maxParticipants = 12;
        }
        setMaxParticipantsLimit(maxParticipants);
      } catch (err) {
        console.warn(
          "Failed to load configuration course_start_date_after_days_from_now",
          err
        );
        setCourseStartDateAfterDaysFromNow(7);
        setMaxParticipantsLimit(12);
      }
    };

    loadConfig();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const user = await storageService.getUser();
      const url = subjectFilter
        ? `/v1/subjects?filter=${subjectFilter},createdBy.id_eq_${user?.id}`
        : `/v1/subjects?filter=createdBy.id_eq_${user?.id}`;
      const res = await get<{ items: Subject[] }>(url);
      setSubjects(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách môn học:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      setLoadingDistricts(true);
      const res = await get<District[]>(
        `/v1/provinces/${provinceId}/districts`
      );
      setDistricts(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchCourtsByLocation = useCallback(
    async (
      provinceId?: number,
      districtId?: number,
      autoSelectFirst: boolean = false
    ) => {
      try {
        setLoadingCourts(true);
        const res = await courtService.getCourtsByLocation(
          provinceId,
          districtId
        );

        setCourts(res || []);

        // Auto-select first court if in create mode and no court is already selected
        if (autoSelectFirst && res && res.length > 0 && !selectedCourt) {
          setSelectedCourt(res[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách sân:", error);
      } finally {
        setLoadingCourts(false);
      }
    },
    [selectedCourt]
  );

  const fetchCoachAvailableSchedules = async () => {
    setLoadingAvailableSchedules(true);
    try {
      const res = await get<{ metadata: Schedule[] }>(
        "/v1/schedules/coaches/available"
      );
      setAvailableSchedules(res.data?.metadata || []);
    } catch (error) {
      console.error(
        "Lỗi khi tải lịch trình có sẵn của huấn luyện viên:",
        error
      );
    } finally {
      setLoadingAvailableSchedules(false);
    }
  };

  // Fetch courts when province or district changes
  useEffect(() => {
    if (selectedProvince || selectedDistrict) {
      // Auto-select first court only in create mode (when initialData is not provided)
      const isCreateMode = !initialData;
      fetchCourtsByLocation(
        selectedProvince?.id,
        selectedDistrict?.id,
        isCreateMode
      );
    } else {
      setCourts([]);
    }
    // Clear court when district changes (only in edit mode to preserve existing selection)
    if (initialData) {
      setSelectedCourt(null);
    }
  }, [selectedProvince, selectedDistrict, fetchCourtsByLocation, initialData]);

  const handleAddSchedule = () => {
    setTempSchedule({
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "11:00",
      totalSessions: 1,
    });
    setEditingScheduleIndex(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (index: number) => {
    setTempSchedule(schedules[index]);
    setEditingScheduleIndex(index);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    if (!tempSchedule.startTime || !tempSchedule.endTime) {
      return;
    }

    const formatTime = (time: string) => {
      if (time.length === 5) return `${time}:00`;
      return time;
    };

    const newSchedule: Schedule = {
      dayOfWeek: tempSchedule.dayOfWeek,
      startTime: formatTime(tempSchedule.startTime),
      endTime: formatTime(tempSchedule.endTime),
      totalSessions: tempSchedule.totalSessions ?? 1,
    };

    if (editingScheduleIndex !== null) {
      const updated = [...schedules];
      updated[editingScheduleIndex] = newSchedule;
      setSchedules(updated);
    } else {
      setSchedules([...schedules, newSchedule]);
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation with error messages
    if (!selectedSubjectId) {
      Alert.alert("Lỗi", "Vui lòng chọn tài liệu");
      return;
    }
    if (learningFormat === "GROUP") {
      if (!minParticipants || !maxParticipants) {
        Alert.alert(
          "Lỗi",
          "Vui lòng nhập số lượng học viên tối thiểu và tối đa"
        );
        return;
      }
      const minVal = parseInt(minParticipants);
      const maxVal = parseInt(maxParticipants);
      if (minVal > maxVal) {
        Alert.alert("Lỗi", "Số học viên tối thiểu không được lớn hơn tối đa");
        return;
      }
    }
    if (!pricePerParticipant) {
      Alert.alert("Lỗi", "Vui lòng nhập giá cho mỗi học viên");
      return;
    }
    if (!startDate) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày bắt đầu");
      return;
    }

    if (!selectedCourt) {
      Alert.alert("Lỗi", "Vui lòng chọn sân tập cho khóa học");
      return;
    }

    try {
      setSubmitting(true);

      // Ensure minParticipants and maxParticipants are valid numbers
      const minVal = parseInt(minParticipants) || 2;
      const maxVal = parseInt(maxParticipants) || 6;
      const priceVal = parseInt(pricePerParticipant.replace(/,/g, "")) || 0;

      const payload = {
        subjectId: selectedSubjectId,
        learningFormat,
        minParticipants: minVal,
        maxParticipants: maxVal,
        pricePerParticipant: priceVal,
        startDate: new Date(startDate).toISOString(),
        court: selectedCourt ? selectedCourt.id : undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
        courseImage: selectedCourseImage || undefined,
        googleMeetLink: googleMeetLink || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Không cần throw lại vì parent component đã xử lý error
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handlePickCourseImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện để chọn ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setSelectedCourseImage({
          uri: asset.uri,
          fileName: asset.fileName || asset.uri.split("/").pop() || undefined,
          mimeType: asset.mimeType || undefined,
        });
        setExistingImageUrl(null);
      }
    } catch (error) {
      console.error("Không thể chọn ảnh khóa học:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const handleRemoveCourseImage = () => {
    setSelectedCourseImage(null);
    setExistingImageUrl(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === "edit" ? "Chỉnh sửa khóa học" : "Tạo Khóa Học"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Subject Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Tài liệu <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.hintText}>
                Chỉ những tài liệu{" "}
                <Text style={styles.highlightedText}>ĐÃ XUẤT BẢN</Text> mới có
                thể sử dụng
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !selectedSubject && styles.placeholderText,
                  ]}
                >
                  {selectedSubject ? selectedSubject.name : "Chọn tài liêu"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Course Image */}
            <View style={styles.section}>
              <Text style={styles.label}>Ảnh khóa học (tùy chọn)</Text>
              {selectedCourseImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedCourseImage.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveCourseImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handlePickCourseImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={18} color="#059669" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                </View>
              ) : existingImageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: existingImageUrl }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handlePickCourseImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={18} color="#059669" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickCourseImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={32} color="#059669" />
                  <Text style={styles.imagePickerText}>
                    Chọn ảnh đại diện cho khóa học
                  </Text>
                  <Text style={styles.imagePickerHint}>
                    Gợi ý tỉ lệ 16:9, dung lượng &lt; 5MB
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Learning Format */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Hình thức học <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setLearningFormat("GROUP")}
                >
                  <View style={styles.radio}>
                    {learningFormat === "GROUP" && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Nhóm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setLearningFormat("INDIVIDUAL")}
                >
                  <View style={styles.radio}>
                    {learningFormat === "INDIVIDUAL" && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Cá nhân</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Participants */}
            {learningFormat === "GROUP" && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  Số lượng học viên <Text style={styles.required}>*</Text>
                </Text>
                <RangeSlider
                  min={1}
                  max={maxParticipantsLimit}
                  step={1}
                  minValue={parseInt(minParticipants) || 2}
                  maxValue={parseInt(maxParticipants) || 6}
                  onMinChange={(value: number) =>
                    setMinParticipants(value.toString())
                  }
                  onMaxChange={(value: number) =>
                    setMaxParticipants(value.toString())
                  }
                  minLabel="Tối thiểu"
                  maxLabel="Tối đa"
                />
              </View>
            )}

            {/* Province & District - MOVED HERE */}
            <View style={styles.section}>
              <View style={styles.labelWithAction}>
                <Text style={styles.label}>
                  Tỉnh/Thành phố & Quận/Huyện{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                {(selectedProvince || selectedDistrict || selectedCourt) && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setSelectedProvince(null);
                      setSelectedDistrict(null);
                      setSelectedCourt(null);
                      setCourts([]);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                    <Text style={styles.clearButtonText}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowProvinceModal(true)}
                    disabled={loadingProvinces}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedProvince && styles.placeholderText,
                      ]}
                    >
                      {selectedProvince
                        ? selectedProvince.name
                        : loadingProvinces
                        ? "Đang tải..."
                        : "Chọn"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Quận/Huyện</Text>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      !selectedProvince && styles.selectButtonDisabled,
                    ]}
                    onPress={() => {
                      if (selectedProvince) {
                        setShowDistrictModal(true);
                      }
                    }}
                    disabled={!selectedProvince || loadingDistricts}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedDistrict && styles.placeholderText,
                      ]}
                    >
                      {loadingDistricts
                        ? "Đang tải..."
                        : selectedDistrict
                        ? selectedDistrict.name
                        : "Chọn"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Court Selection - MOVED HERE */}
            {selectedProvince && selectedDistrict && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  Sân <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    loadingCourts && styles.selectButtonDisabled,
                  ]}
                  onPress={() => setShowCourtModal(true)}
                  disabled={loadingCourts || courts.length === 0}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedCourt && styles.placeholderText,
                      ]}
                    >
                      {loadingCourts
                        ? "Đang tải sân..."
                        : selectedCourt
                        ? selectedCourt.name
                        : courts.length === 0
                        ? "Không có sân nào"
                        : "Chọn sân"}
                    </Text>
                    {selectedCourt && (
                      <Text style={styles.courtPriceHighlight}>
                        {formatPrice(selectedCourt.pricePerHour)} VNĐ/giờ
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
                {selectedCourt && (
                  <View style={styles.courtInfo}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.courtInfoText}>
                      {selectedCourt.address}
                    </Text>
                  </View>
                )}
                {!loadingCourts && courts.length === 0 && (
                  <Text style={styles.hint}>
                    Không tìm thấy sân nào tại vị trí này
                  </Text>
                )}
              </View>
            )}

            {/* Google Meet Link */}
            <View style={styles.section}>
              <Text style={styles.label}>Link Google Meet</Text>
              <View style={styles.googleMeetInputContainer}>
                <Text style={styles.googleMeetPrefix}>
                  https://meet.google.com/
                </Text>
                <TextInput
                  style={styles.googleMeetInput}
                  placeholder="abc-defg-xyz"
                  value={googleMeetLink}
                  onChangeText={setGoogleMeetLink}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <Text style={styles.hintText}>
                Nhập mã cuộc họp Google Meet (ví dụ: abc-defg-xyz)
              </Text>
            </View>

            {/* Price */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Giá mỗi học viên (VNĐ) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    const currentValue =
                      parseInt(pricePerParticipant.replace(/,/g, "")) || 0;
                    const newValue = Math.max(0, currentValue - 500000);
                    setPricePerParticipant(newValue.toString());
                  }}
                >
                  <Ionicons name="remove" size={20} color="#059669" />
                </TouchableOpacity>
                <TextInput
                  style={styles.priceInput}
                  placeholder="2,000,000"
                  value={pricePerParticipant.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  )}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/,/g, "");
                    setPricePerParticipant(numericValue);
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    const currentValue =
                      parseInt(pricePerParticipant.replace(/,/g, "")) || 0;
                    const newValue = currentValue + 500000;
                    setPricePerParticipant(newValue.toString());
                  }}
                >
                  <Ionicons name="add" size={20} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Date */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Ngày bắt đầu <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.hintText}>
                Ngày bắt đầu phải cách it nhất{" "}
                <Text style={styles.highlightedText}>
                  {courseStartDateAfterDaysFromNow || ""} ngày
                </Text>{" "}
                từ hôm nay.
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  if (startDate) {
                    setSelectedDate(new Date(startDate));
                  } else {
                    setSelectedDate(new Date());
                  }
                  setShowDatePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !startDate && styles.placeholderText,
                  ]}
                >
                  {startDate
                    ? new Date(startDate).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "Chọn ngày bắt đầu"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#059669" />
              </TouchableOpacity>
              {Platform.OS === "ios" && showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          style={styles.datePickerCancelButton}
                        >
                          <Text style={styles.datePickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.datePickerTitle}>Chọn ngày</Text>
                        <TouchableOpacity
                          onPress={() => {
                            // Calculate minimum allowed date
                            const minAllowedDate = new Date(
                              new Date().getTime() +
                                (courseStartDateAfterDaysFromNow || 0) *
                                  24 *
                                  60 *
                                  60 *
                                  1000
                            );

                            // Validate selected date
                            if (selectedDate < minAllowedDate) {
                              Alert.alert(
                                "Ngày không hợp lệ",
                                `Ngày bắt đầu phải cách ít nhất ${courseStartDateAfterDaysFromNow} ngày từ hôm nay.`
                              );
                              return;
                            }

                            const formattedDate = selectedDate
                              .toISOString()
                              .split("T")[0];
                            setStartDate(formattedDate);
                            setShowDatePicker(false);
                          }}
                          style={styles.datePickerConfirmButton}
                        >
                          <Text style={styles.datePickerConfirmText}>
                            Xác nhận
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="inline"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                        minimumDate={
                          new Date(
                            new Date().getTime() +
                              (courseStartDateAfterDaysFromNow || 0) *
                                24 *
                                60 *
                                60 *
                                1000
                          )
                        }
                        textColor="#111827"
                        accentColor="#059669"
                        themeVariant="light"
                      />
                    </View>
                  </View>
                </Modal>
              )}
              {Platform.OS === "android" && showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setSelectedDate(date);
                      const formattedDate = date.toISOString().split("T")[0];
                      setStartDate(formattedDate);
                    }
                  }}
                  minimumDate={
                    new Date(
                      new Date().getTime() +
                        (courseStartDateAfterDaysFromNow || 0) *
                          24 *
                          60 *
                          60 *
                          1000
                    )
                  }
                />
              )}
            </View>

            {/* Schedules */}
            <View style={styles.section}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.label}>
                  Lịch học <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSchedule}
                >
                  <Ionicons name="add" size={20} color="#059669" />
                  <Text style={styles.addButtonText}>Thêm lịch</Text>
                </TouchableOpacity>
              </View>

              {schedules.map((schedule, index) => {
                const dayIndex = DAYS_OF_WEEK.indexOf(schedule.dayOfWeek);
                const dayName =
                  dayIndex >= 0
                    ? DAYS_OF_WEEK_VI[dayIndex]
                    : schedule.dayOfWeek;
                return (
                  <View key={index} style={styles.scheduleItem}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleText}>
                        {dayName}: {schedule.startTime} - {schedule.endTime}
                      </Text>
                    </View>
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity
                        onPress={() => handleEditSchedule(index)}
                        style={styles.scheduleActionButton}
                      >
                        <Ionicons name="pencil" size={18} color="#059669" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(index)}
                        style={styles.scheduleActionButton}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {schedules.length === 0 && (
                <Text style={styles.hint}>Chưa có lịch học nào được thêm</Text>
              )}
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "edit" ? "Cập nhật" : "Tạo"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Subject Selection Modal */}
          <SubjectSelectionModal
            visible={showSubjectModal}
            onClose={() => setShowSubjectModal(false)}
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
            loading={loadingSubjects}
          />

          {/* Schedule Modal */}
          <Modal
            visible={showScheduleModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowScheduleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingScheduleIndex !== null
                      ? "Chỉnh sửa lịch"
                      : "Thêm lịch học"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScheduleModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                  <View style={styles.section}>
                    <Text style={styles.label}>Thứ trong tuần</Text>
                    <View style={styles.daySelector}>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            tempSchedule.dayOfWeek === day &&
                              styles.dayButtonSelected,
                          ]}
                          onPress={() =>
                            setTempSchedule({
                              ...tempSchedule,
                              dayOfWeek: day,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              tempSchedule.dayOfWeek === day &&
                                styles.dayButtonTextSelected,
                            ]}
                          >
                            {DAYS_OF_WEEK_VI[index]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Giờ bắt đầu</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        // seed selectedStartTime from current tempSchedule.startTime
                        const [h = "09", m = "00"] = (
                          tempSchedule.startTime || "09:00"
                        ).split(":");
                        const d = new Date();
                        d.setHours(parseInt(h), parseInt(m), 0, 0);
                        setSelectedStartTime(d);
                        setShowStartTimePicker(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateInputText,
                          !tempSchedule.startTime && styles.placeholderText,
                        ]}
                      >
                        {tempSchedule.startTime || "Chọn giờ bắt đầu"}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#059669" />
                    </TouchableOpacity>
                    {Platform.OS === "ios" && showStartTimePicker && (
                      <Modal
                        visible={showStartTimePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowStartTimePicker(false)}
                      >
                        <View style={styles.datePickerModal}>
                          <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerHeader}>
                              <TouchableOpacity
                                onPress={() => setShowStartTimePicker(false)}
                                style={styles.datePickerCancelButton}
                              >
                                <Text style={styles.datePickerCancelText}>
                                  Hủy
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.datePickerTitle}>
                                Chọn giờ bắt đầu
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const hh = String(
                                    selectedStartTime.getHours()
                                  ).padStart(2, "0");
                                  const mm = String(
                                    selectedStartTime.getMinutes()
                                  ).padStart(2, "0");
                                  setTempSchedule({
                                    ...tempSchedule,
                                    startTime: `${hh}:${mm}`,
                                  });
                                  setShowStartTimePicker(false);
                                }}
                                style={styles.datePickerConfirmButton}
                              >
                                <Text style={styles.datePickerConfirmText}>
                                  Xác nhận
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={selectedStartTime}
                              mode="time"
                              display="inline"
                              onChange={(event, date) => {
                                if (date) setSelectedStartTime(date);
                              }}
                              textColor="#111827"
                              accentColor="#059669"
                              themeVariant="light"
                            />
                          </View>
                        </View>
                      </Modal>
                    )}
                    {Platform.OS === "android" && showStartTimePicker && (
                      <DateTimePicker
                        value={selectedStartTime}
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                          setShowStartTimePicker(false);
                          if (date) {
                            const hh = String(date.getHours()).padStart(2, "0");
                            const mm = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            setTempSchedule({
                              ...tempSchedule,
                              startTime: `${hh}:${mm}`,
                            });
                          }
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Giờ kết thúc</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        const [h = "11", m = "00"] = (
                          tempSchedule.endTime || "11:00"
                        ).split(":");
                        const d = new Date();
                        d.setHours(parseInt(h), parseInt(m), 0, 0);
                        setSelectedEndTime(d);
                        setShowEndTimePicker(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateInputText,
                          !tempSchedule.endTime && styles.placeholderText,
                        ]}
                      >
                        {tempSchedule.endTime || "Chọn giờ kết thúc"}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#059669" />
                    </TouchableOpacity>
                    {Platform.OS === "ios" && showEndTimePicker && (
                      <Modal
                        visible={showEndTimePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowEndTimePicker(false)}
                      >
                        <View style={styles.datePickerModal}>
                          <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerHeader}>
                              <TouchableOpacity
                                onPress={() => setShowEndTimePicker(false)}
                                style={styles.datePickerCancelButton}
                              >
                                <Text style={styles.datePickerCancelText}>
                                  Hủy
                                </Text>
                              </TouchableOpacity>
                              <Text style={styles.datePickerTitle}>
                                Chọn giờ kết thúc
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const hh = String(
                                    selectedEndTime.getHours()
                                  ).padStart(2, "0");
                                  const mm = String(
                                    selectedEndTime.getMinutes()
                                  ).padStart(2, "0");
                                  setTempSchedule({
                                    ...tempSchedule,
                                    endTime: `${hh}:${mm}`,
                                  });
                                  setShowEndTimePicker(false);
                                }}
                                style={styles.datePickerConfirmButton}
                              >
                                <Text style={styles.datePickerConfirmText}>
                                  Xác nhận
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={selectedEndTime}
                              mode="time"
                              display="inline"
                              textColor="#111827"
                              accentColor="#059669"
                              themeVariant="light"
                              onChange={(event, date) => {
                                if (date) setSelectedEndTime(date);
                              }}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}
                    {Platform.OS === "android" && showEndTimePicker && (
                      <DateTimePicker
                        value={selectedEndTime}
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                          setShowEndTimePicker(false);
                          if (date) {
                            const hh = String(date.getHours()).padStart(2, "0");
                            const mm = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            setTempSchedule({
                              ...tempSchedule,
                              endTime: `${hh}:${mm}`,
                            });
                          }
                        }}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      styles.warningSection,
                      { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: 6,
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name="warning"
                        size={16}
                        color="#92400E"
                        style={{ marginTop: 2 }}
                      />
                      <Text style={[styles.warningLabel, { color: "#92400E" }]}>
                        Lịch các khóa khác
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: "#92400E",
                        fontSize: 11,
                        marginBottom: 8,
                        lineHeight: 14,
                      }}
                    >
                      Chú ý: Lịch bên dưới hiển thị khung giờ các khóa học khác.
                      Chọn khung giờ không trùng lặp.
                    </Text>

                    {loadingAvailableSchedules ? (
                      <ActivityIndicator size="small" color="#92400E" />
                    ) : availableSchedules.length === 0 ? (
                      <Text style={styles.hint}>Không có lịch xung đột</Text>
                    ) : (
                      <View style={{ gap: 6 }}>
                        {availableSchedules.map((sch, i) => {
                          const dayIndex = DAYS_OF_WEEK.indexOf(sch.dayOfWeek);
                          const dayName =
                            dayIndex >= 0
                              ? DAYS_OF_WEEK_VI[dayIndex]
                              : sch.dayOfWeek;
                          const isSelected =
                            sch.dayOfWeek === tempSchedule.dayOfWeek &&
                            sch.startTime === tempSchedule.startTime &&
                            sch.endTime === tempSchedule.endTime;

                          return (
                            <View
                              key={i}
                              style={[
                                styles.warningItem,
                                isSelected && styles.warningItemSelected,
                                {
                                  backgroundColor: isSelected
                                    ? "#FEF3C7"
                                    : "#FFF7ED",
                                },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.warningItemTime}>
                                  {dayName}: {sch.startTime} - {sch.endTime}
                                </Text>
                                <Text style={styles.warningItemMeta}>
                                  {sch.course?.startDate
                                    ? new Date(
                                        sch.course.startDate
                                      ).toLocaleDateString("vi-VN")
                                    : "—"}{" "}
                                  đến{" "}
                                  {sch.course?.endDate
                                    ? new Date(
                                        sch.course.endDate
                                      ).toLocaleDateString("vi-VN")
                                    : "—"}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton]}
                    onPress={handleSaveSchedule}
                  >
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Province Selection Modal */}
          <Modal
            visible={showProvinceModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowProvinceModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn tỉnh/thành phố</Text>
                  <TouchableOpacity
                    onPress={() => setShowProvinceModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                {loadingProvinces ? (
                  <ActivityIndicator size="large" color="#059669" />
                ) : (
                  <ScrollView>
                    {provinces.map((province) => (
                      <TouchableOpacity
                        key={province.id}
                        style={[
                          styles.modalItem,
                          selectedProvince?.id === province.id &&
                            styles.modalItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedProvince(province);
                          setShowProvinceModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {province.name}
                        </Text>
                        {selectedProvince?.id === province.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#059669"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* District Selection Modal */}
          <Modal
            visible={showDistrictModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDistrictModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn quận/huyện</Text>
                  <TouchableOpacity
                    onPress={() => setShowDistrictModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                {loadingDistricts ? (
                  <ActivityIndicator size="large" color="#059669" />
                ) : (
                  <ScrollView>
                    {districts.map((district) => (
                      <TouchableOpacity
                        key={district.id}
                        style={[
                          styles.modalItem,
                          selectedDistrict?.id === district.id &&
                            styles.modalItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedDistrict(district);
                          setShowDistrictModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {district.name}
                        </Text>
                        {selectedDistrict?.id === district.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#059669"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Court Selection Modal */}
          <CourtSelectionModal
            visible={showCourtModal}
            onClose={() => setShowCourtModal(false)}
            courts={courts}
            selectedCourt={selectedCourt}
            onSelectCourt={setSelectedCourt}
            loading={loadingCourts}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  required: {
    color: "#EF4444",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },
  selectButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#F3F4F6",
  },
  selectButtonText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  imagePickerButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#059669",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  imagePickerHint: {
    fontSize: 12,
    color: "#6B7280",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#F3F4F6",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 4,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
  },
  radioLabel: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#111827",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#111827",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },
  dateInputText: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
    fontWeight: "500",
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelButton: {
    padding: 8,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  datePickerConfirmButton: {
    padding: 8,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "600",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  addButtonText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  scheduleActionButton: {
    padding: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#F0FDF4",
  },
  modalItemText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  daySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  dayButtonSelected: {
    backgroundColor: "#D1FAE5",
    borderColor: "#059669",
  },
  dayButtonText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  dayButtonTextSelected: {
    color: "#059669",
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    margin: 12,
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  courtInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
  },
  courtInfoText: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
  },
  courtPriceHighlight: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
    marginTop: 3,
  },
  labelWithAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FEF2F2",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  clearButtonText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  warningSection: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 0,
    marginVertical: 12,
  },
  warningLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  warningItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  warningItemSelected: {
    borderColor: "#F59E0B",
  },
  warningItemTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  warningItemMeta: {
    fontSize: 10,
    color: "#B45309",
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
    marginBottom: 8,
  },
  highlightedText: {
    color: "#059669",
    fontWeight: "700",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  googleMeetInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 0,
    marginBottom: 6,
  },
  googleMeetPrefix: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  googleMeetInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#111827",
  },
});
