import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  DevSettings,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import attendanceService from "../../services/attendanceService";
import configurationService from "../../services/configurationService";
import sessionService from "../../services/sessionService";
import { AttendanceStatus } from "../../types/attendance";
import { CalendarSession, SessionStatus } from "../../types/session";
import SessionDetailQuiz from "./SessionDetailQuiz";
import SessionDetailVideo from "./SessionDetailVideo";

export enum EnrollmentStatus {
  PENDING_GROUP = "PENDING_GROUP",
  CONFIRMED = "CONFIRMED",
  LEARNING = "LEARNING",
  REFUNDED = "REFUNDED",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
}

interface SessionDetailModalProps {
  session: CalendarSession | null;
  isVisible: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isVisible,
  onClose,
}) => {
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>(
    {}
  );
  const [completeBeforeHours, setCompleteBeforeHours] = useState<number>(24);

  const [sessionData, setSessionData] = useState<CalendarSession | null>(
    session
  );

  useEffect(() => {
    setSessionData(session);
  }, [session]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await configurationService.getConfiguration(
          "complete_session_before_hours"
        );
        // cfg shape may vary; treat as any to safely read possible locations
        const raw: any = cfg as any;
        let hours: number = 24;
        if (raw == null) {
          hours = 24;
        } else if (typeof raw === "number") {
          hours = raw;
        } else if (typeof raw === "string") {
          const n = Number(raw);
          hours = Number.isNaN(n) ? 24 : n;
        } else if (typeof raw === "object") {
          if (raw.value != null) hours = Number(raw.value);
          else if (raw.metadata && raw.metadata.value != null)
            hours = Number(raw.metadata.value);
          else if (raw.data && raw.data.value != null)
            hours = Number(raw.data.value);
          else if (raw.valueRaw != null) hours = Number(raw.valueRaw);
          if (Number.isNaN(hours)) hours = 24;
        }
        setCompleteBeforeHours(hours);
      } catch (err) {
        console.warn(
          "Failed to load configuration complete_session_before_hours",
          err
        );
        setCompleteBeforeHours(24);
      }
    };

    loadConfig();
  }, []);

  // When the session is completed, fetch each learner's attendance status
  // and populate attendanceMap so the UI shows read-only attendance for learners.
  useEffect(() => {
    const loadAttendancesForCompleted = async () => {
      if (!sessionData) return;
      const enrollments = (sessionData.course as any)?.enrollments || [];

      // helper to determine present status from various server values
      const isStatusPresent = (status: any) => {
        if (status == null) return false;
        if (typeof status === "object") {
          if (status.code) return isStatusPresent(status.code);
          if (status.name) return isStatusPresent(status.name);
          if (status.value) return isStatusPresent(status.value);
          status = JSON.stringify(status);
        }
        const s = String(status).toUpperCase().trim();
        return (
          s === "PRESENT" ||
          s === "ATTENDED" ||
          s === "CHECKED_IN" ||
          s === "TRUE" ||
          s === "1"
        );
      };

      if (sessionData.status === SessionStatus.COMPLETED) {
        const results = await Promise.all(
          enrollments.map(async (en: any) => {
            const learnerId = en.user?.id ?? en.userId ?? null;
            try {
              if (learnerId == null)
                return { enrollmentId: en.id, present: false };
              const res = await attendanceService.getLearnerAttendance(
                sessionData.id,
                learnerId
              );
              const meta = res?.metadata ?? null;
              const status = meta?.status ?? null;
              return { enrollmentId: en.id, present: isStatusPresent(status) };
            } catch (err) {
              // if API fails for a learner, default to absent
              console.warn(
                `Failed to load attendance for learner ${learnerId}:`,
                err
              );
              return { enrollmentId: en.id, present: false };
            }
          })
        );

        const map: Record<number, boolean> = {};
        results.forEach((r) => {
          if (r && r.enrollmentId != null) map[r.enrollmentId] = !!r.present;
        });
        setAttendanceMap(map);
        return;
      }

      // If not completed, default to all-false
      const map: Record<number, boolean> = {};
      (sessionData.course as any)?.enrollments?.forEach((en: any) => {
        if (en && en.id) map[en.id] = false;
      });
      setAttendanceMap(map);
    };

    loadAttendancesForCompleted();
    // we only want to run when sessionData changes
  }, [sessionData]);

  if (!sessionData) return null;

  const toggleAttendance = (enrollmentId: number) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId],
    }));
  };

  const isCompleted = sessionData?.status === SessionStatus.COMPLETED;

  // Try to reload the current page/app. Priority:
  // 1) web: window.location.reload()
  // 2) Expo: Updates.reloadAsync() (if available)
  // 3) React Native DevSettings.reload() as a last resort
  const reloadApp = async () => {
    try {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.location?.reload
      ) {
        window.location.reload();
        return;
      }

      // Fallback: use DevSettings.reload() for native (dev) environments.
      if (
        (DevSettings as any) &&
        typeof (DevSettings as any).reload === "function"
      ) {
        (DevSettings as any).reload();
        return;
      }

      // If none of the above applied, warn the developer.
      console.warn(
        "No suitable reload method available (web/expo-updates/DevSettings)"
      );
    } catch (err) {
      console.warn("Failed to reload app/screen:", err);
    }
  };

  const saveAttendance = () => {
    const attendedCount = Object.values(attendanceMap).filter(Boolean).length;
    const totalCount = (sessionData.course as any)?.enrollments?.length || 0;

    Alert.alert(
      "Xác nhận lưu điểm danh",
      `Bạn đã điểm danh cho ${attendedCount}/${totalCount} học viên.\n\nXác nhận lưu điểm danh cho buổi học này?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              console.log("Saving attendance:", attendanceMap);

              const enrollments =
                (sessionData.course as any)?.enrollments || [];
              const attendances = enrollments.map((en: any) => {
                const isPresent = !!attendanceMap[en.id];
                const userId = en.user?.id ?? en.userId ?? null;
                return {
                  userId,
                  status: isPresent
                    ? AttendanceStatus.PRESENT
                    : AttendanceStatus.ABSENT,
                };
              });

              // Call session service to complete session and submit attendances
              const res = await sessionService.completeAndCheckAttendance(
                sessionData.id,
                attendances
              );

              console.log("Attendance API response:", res);

              // Instead of fetching the session again, reload the app/page so the
              // caller context will re-mount and fetch fresh data.
              try {
                await reloadApp();
              } catch (reloadErr) {
                console.warn("Failed to reload app after save:", reloadErr);
              }

              Alert.alert("Thành công", "Đã lưu điểm danh thành công!");
            } catch (error: any) {
              console.error("Failed to save attendance:", error);
              if (error?.response?.data) {
                Alert.alert(
                  "Lỗi",
                  error?.response?.data?.message ||
                    "Không thể lưu điểm danh. Vui lòng thử lại."
                );
              }
            }
          },
        },
      ]
    );
  };

  const getSessionStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return "#059669";
      case SessionStatus.IN_PROGRESS:
        return "#F59E0B";
      case SessionStatus.COMPLETED:
        return "#3B82F6";
      case SessionStatus.CANCELLED:
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getSessionStatusText = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return "Đã lên lịch";
      case SessionStatus.IN_PROGRESS:
        return "Đang diễn ra";
      case SessionStatus.COMPLETED:
        return "Đã hoàn thành";
      case SessionStatus.CANCELLED:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Extract location information
  const course = sessionData.course as any;
  const address = course?.address || "Chưa cập nhật";
  const provinceName = course?.province?.name || "";
  const districtName = course?.district?.name || "";
  const fullAddress =
    [address, districtName, provinceName].filter(Boolean).join(", ") || address;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết buổi học</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Session Title */}
          <View style={styles.titleSection}>
            <Text style={styles.sessionTitle}>{sessionData.name}</Text>
            <Text style={styles.sessionDate}>{sessionData.scheduleDate}</Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getSessionStatusColor(sessionData.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getSessionStatusText(sessionData.status)}
            </Text>
          </View>

          {/* Payment Warning */}
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
              <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningText}>
                Vui lòng hoàn thành buổi học trước {completeBeforeHours}h để có
                thể nhận tiền từ buổi học
              </Text>
            </View>
          </View>

          {/* Description */}
          {sessionData.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.sectionTitle}>Mô tả</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.descriptionText}>
                  {sessionData.description}
                </Text>
              </View>
            </View>
          )}

          {/* Time Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Thời gian</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.timeText}>
                {sessionData.startTime} - {sessionData.endTime}
              </Text>
            </View>
          </View>

          {/* Course Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Khóa học</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.courseName}>{sessionData.courseName}</Text>
            </View>
          </View>

          {/* Location Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Địa điểm</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.locationText}>{fullAddress}</Text>
            </View>
          </View>

          {/* Enrollments */}
          {course?.enrollments && course.enrollments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color="#059669" />
                <Text style={styles.sectionTitle}>Điểm danh</Text>
                <Text style={styles.enrollmentCount}>
                  ({course.enrollments.length} học viên)
                </Text>
                {!isCompleted && (
                  <TouchableOpacity
                    style={styles.checkAllButton}
                    onPress={() => {
                      // mark all enrollments as present in the local attendance map
                      const map: Record<number, boolean> = {};
                      (course.enrollments as any[]).forEach((en: any) => {
                        if (en && en.id) map[en.id] = true;
                      });
                      setAttendanceMap(map);
                      Alert.alert(
                        "Đã điểm danh",
                        `Đã điểm danh ${course.enrollments.length} học viên.`
                      );
                    }}
                  >
                    <Text style={styles.checkAllText}>Điểm danh tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.sectionContent}>
                {course.enrollments.map((enrollment: any, index: number) => (
                  <View
                    key={enrollment.id || index}
                    style={styles.enrollmentItem}
                  >
                    <View style={styles.enrollmentAvatar}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.enrollmentInfo}>
                      <Text style={styles.enrollmentName}>
                        {enrollment.user?.fullName || "Học viên không xác định"}
                      </Text>
                      {/* (Learner attendance view removed — coaches still can check attendance using the checkbox on the right) */}
                      <View style={styles.enrollmentStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                enrollment.status === EnrollmentStatus.LEARNING
                                  ? "#059669"
                                  : enrollment.status ===
                                    EnrollmentStatus.CONFIRMED
                                  ? "#3B82F6"
                                  : enrollment.status ===
                                    EnrollmentStatus.PENDING_GROUP
                                  ? "#F59E0B"
                                  : enrollment.status ===
                                    EnrollmentStatus.UNPAID
                                  ? "#8B5CF6"
                                  : enrollment.status ===
                                    EnrollmentStatus.REFUNDED
                                  ? "#06B6D4"
                                  : enrollment.status ===
                                    EnrollmentStatus.CANCELLED
                                  ? "#EF4444"
                                  : "#6B7280",
                            },
                          ]}
                        />
                        <Text style={styles.enrollmentStatusText}>
                          {enrollment.status === EnrollmentStatus.LEARNING
                            ? "Đang học"
                            : enrollment.status === EnrollmentStatus.CONFIRMED
                            ? "Đã xác nhận"
                            : enrollment.status ===
                              EnrollmentStatus.PENDING_GROUP
                            ? "Chờ đủ nhóm"
                            : enrollment.status === EnrollmentStatus.UNPAID
                            ? "Chưa thanh toán"
                            : enrollment.status === EnrollmentStatus.REFUNDED
                            ? "Đã hoàn tiền"
                            : enrollment.status === EnrollmentStatus.CANCELLED
                            ? "Đã hủy"
                            : "Không xác định"}
                        </Text>
                      </View>
                    </View>
                    {!isCompleted ? (
                      <TouchableOpacity
                        style={[
                          styles.attendanceCheckbox,
                          attendanceMap[enrollment.id] &&
                            styles.attendanceChecked,
                        ]}
                        onPress={() => toggleAttendance(enrollment.id)}
                      >
                        {attendanceMap[enrollment.id] && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[
                          styles.attendanceCheckbox,
                          attendanceMap[enrollment.id] &&
                            styles.attendanceChecked,
                          styles.attendanceDisabled,
                        ]}
                      >
                        {attendanceMap[enrollment.id] && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quizzes (moved to a separate component) */}
          <SessionDetailQuiz
            session={sessionData}
            course={course}
            styles={styles}
          />

          {/* Videos (moved to a separate component) */}
          <SessionDetailVideo
            session={sessionData}
            course={course}
            styles={styles}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {course?.enrollments &&
            course.enrollments.length > 0 &&
            !isCompleted && (
              <TouchableOpacity
                style={styles.saveButtonFooter}
                onPress={saveAttendance}
              >
                <Text style={styles.saveButtonText}>Lưu điểm danh</Text>
              </TouchableOpacity>
            )}
          <TouchableOpacity style={styles.closeButtonFooter} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    color: "#6B7280",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  warningSection: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
    marginLeft: 8,
  },
  warningContent: {
    paddingLeft: 28,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  sectionContent: {
    paddingLeft: 28,
  },
  timeText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  courseName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  locationText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  quizItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  quizMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  quizMetaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  quizFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  createdByText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  videoItem: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    position: "relative",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  defaultThumbnail: {
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  videoMetaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButtonFooter: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButtonFooter: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  attendanceCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  attendanceChecked: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  enrollmentCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  enrollmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  enrollmentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  enrollmentEmail: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  enrollmentStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  enrollmentStatusText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  checkAllButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5F3EA",
    borderWidth: 1,
    borderColor: "#34D399",
  },
  checkAllText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  checkAllButtonDisabled: {
    opacity: 0.5,
  },
  attendanceLabelWrapper: {
    marginTop: 6,
  },
  attendanceLabel: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "flex-start",
    fontWeight: "600",
  },
  attendancePresent: {
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
  },
  attendanceAbsent: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  attendanceDisabled: {
    opacity: 0.6,
  },
});

export default SessionDetailModal;
