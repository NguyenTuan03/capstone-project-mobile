import { get } from "@/services/http/httpService";
import { Enrollment } from "@/types/enrollments";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EnrollmentInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enrollmentId = id ? parseInt(id, 10) : null;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!enrollmentId) return;

    try {
      setLoading(true);
      const enrollmentRes = await get<Enrollment>(
        `/v1/enrollments/${enrollmentId}`
      );
      setEnrollment(enrollmentRes.data);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết enrollment:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết khóa học");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "N/A";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("vi-VN").format(numPrice) + " VNĐ";
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </View>
    );
  }

  if (!enrollment) {
    return (
      <View style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#6B7280" }}>Không tìm thấy khóa học</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={{ gap: 16 }}>
          {/* Course Info */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Thông tin khóa học</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tên khóa học:</Text>
              <Text style={styles.detailValue}>{enrollment.course.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mô tả:</Text>
              <Text style={styles.detailValue}>
                {enrollment.course.description}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trình độ:</Text>
              <Text style={styles.detailValue}>{enrollment.course.level}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hình thức:</Text>
              <Text style={styles.detailValue}>
                {enrollment.course.learningFormat === "INDIVIDUAL"
                  ? "Cá nhân"
                  : "Nhóm"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số buổi học:</Text>
              <Text style={styles.detailValue}>
                {enrollment.course.totalSessions || 0}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày bắt đầu:</Text>
              <Text style={styles.detailValue}>
                {formatDate(enrollment.course.startDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày kết thúc:</Text>
              <Text style={styles.detailValue}>
                {formatDate(enrollment.course.endDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Địa chỉ:</Text>
              <Text style={styles.detailValue}>
                {enrollment.course.address}
              </Text>
            </View>
            {enrollment.course.court.name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tỉnh/Thành phố:</Text>
                <Text style={styles.detailValue}>
                  {enrollment.course.court.name}
                </Text>
              </View>
            )}
            {enrollment.course.subject && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Môn học:</Text>
                <Text style={styles.detailValue}>
                  {enrollment.course.subject.name}
                </Text>
              </View>
            )}
            {enrollment.course.createdBy && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Huấn luyện viên:</Text>
                <Text style={styles.detailValue}>
                  {enrollment.course.createdBy.fullName}
                </Text>
              </View>
            )}
          </View>

          {/* Enrollment Info */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Thông tin đăng ký</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trạng thái:</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      enrollment.status === "CONFIRMED" ? "#10B981" : "#EF4444",
                    fontWeight: "700",
                  },
                ]}
              >
                {enrollment.status === "CONFIRMED"
                  ? "Đã xác nhận"
                  : enrollment.status === "UNPAID"
                  ? "Chưa thanh toán"
                  : enrollment.status === "DONE"
                  ? "Đã hoàn thành"
                  : "Đã hủy"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số tiền thanh toán:</Text>
              <Text style={styles.detailValue}>
                {formatPrice(enrollment.paymentAmount)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày đăng ký:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(enrollment.enrolledAt)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cập nhật lần cuối:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(enrollment.updatedAt)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  container: { padding: 16, gap: 16 },
  detailSection: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    minWidth: 120,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
});
