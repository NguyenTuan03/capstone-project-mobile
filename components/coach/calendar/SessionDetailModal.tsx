import { formatDate } from "@/utils/SessionFormat";
import { Ionicons } from "@expo/vector-icons";
import { default as React, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import attendanceService from "../../../services/attendanceService";
import configurationService from "../../../services/configurationService";
import { useJWTAuth } from "../../../services/jwt-auth/JWTAuthProvider";
import sessionService from "../../../services/sessionService";
import { AttendanceStatus } from "../../../types/attendance";
import { CalendarSession, SessionStatus } from "../../../types/session";
import GoogleMeetConference from "../../common/GoogleMeetConference";

export enum EnrollmentStatus {
  PENDING_GROUP = "PENDING_GROUP",
  CONFIRMED = "CONFIRMED",
  LEARNING = "LEARNING",
  REFUNDED = "REFUNDED",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  DONE = "DONE",
}

interface SessionDetailModalProps {
  session: CalendarSession | null;
  isVisible: boolean;
  onClose: () => void;
  onAttendanceSaved?: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isVisible,
  onClose,
  onAttendanceSaved,
}) => {
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>(
    {}
  );
  const [completeBeforeHours, setCompleteBeforeHours] = useState<number>(24);
  const { user } = useJWTAuth();
  const [isVCVisible, setIsVCVisible] = useState(false);
  const [meetLink, setMeetLink] = useState("");

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
              await sessionService.completeAndCheckAttendance(
                sessionData.id,
                attendances
              );

              // Trigger refresh callback if provided
              if (onAttendanceSaved) {
                onAttendanceSaved();
              }

              onClose();
              Alert.alert("Thành công", "Đã lưu điểm danh thành công!");
            } catch (error: any) {
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

  const handleJoinVideoConference = async () => {
    if (!sessionData?.courseId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin khóa học");
      return;
    }

    try {
      // For now, create a Google Meet URL format
      // Backend should return meetLink in future
      const meetUrl = `https://meet.google.com/${sessionData.course.googleMeetLink}`;
      setMeetLink(meetUrl);
      setIsVCVisible(true);
    } catch {
      Alert.alert("Lỗi", "Không thể tham gia lớp học trực tuyến");
    }
  };

  // Extract location information
  const course = sessionData.course as any;

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
            <Text style={styles.sessionDate}>
              {formatDate(sessionData.scheduleDate)}
            </Text>
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

          {/* Video Conference Button */}
          {sessionData.status !== SessionStatus.CANCELLED &&
            sessionData.status !== SessionStatus.COMPLETED && (
              <TouchableOpacity
                style={styles.vcButton}
                onPress={handleJoinVideoConference}
              >
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
                <Text style={styles.vcButtonText}>
                  Tham gia lớp học trực tuyến
                </Text>
              </TouchableOpacity>
            )}

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
              <Text style={styles.locationText}>{course.court.address}</Text>
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
                                  : enrollment.status === EnrollmentStatus.DONE
                                  ? "#10B981"
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
                            : enrollment.status === EnrollmentStatus.DONE
                            ? "Hoàn thành"
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
      <GoogleMeetConference
        isVisible={isVCVisible}
        onClose={() => setIsVCVisible(false)}
        meetLink={meetLink}
        userName={user?.fullName || "Bạn"}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12, // reduced from 16
    paddingTop: 12, // reduced from 16
    paddingBottom: 8, // reduced from 12
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 15, // reduced from 17
    fontWeight: "700", // reduced from 800
    color: "#111827",
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 8, // reduced from 12
  },
  titleSection: {
    marginBottom: 8, // reduced from 12
    backgroundColor: "#FFFFFF",
    padding: 10, // reduced from 14
    borderRadius: 10, // reduced from 14
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 17, // reduced from 20
    fontWeight: "700", // reduced from 800
    color: "#111827",
    marginBottom: 4, // reduced from 6
    lineHeight: 22, // reduced from 26
  },
  sessionDate: {
    fontSize: 12, // reduced from 14
    color: "#6B7280",
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, // reduced from 12
    paddingVertical: 4, // reduced from 6
    borderRadius: 10, // reduced from 14
    marginBottom: 8, // reduced from 12
  },
  statusText: {
    fontSize: 10, // reduced from 11
    fontWeight: "700", // reduced from 800
    color: "#FFFFFF",
    letterSpacing: 0.3, // reduced from 0.5
    textTransform: "uppercase",
  },
  vcButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 10, // reduced from 12
    borderRadius: 10, // reduced from 12
    marginBottom: 12, // reduced from 16
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  vcButtonText: {
    color: "#FFFFFF",
    fontSize: 13, // reduced from 15
    fontWeight: "700",
    marginLeft: 6, // reduced from 8
  },
  warningSection: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FBBF24",
    borderRadius: 10, // reduced from 12
    padding: 8, // reduced from 12
    marginBottom: 8, // reduced from 12
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // reduced from 6
  },
  warningTitle: {
    fontSize: 12, // reduced from 14
    fontWeight: "700",
    color: "#92400E",
    marginLeft: 6, // reduced from 8
  },
  warningContent: {
    paddingLeft: 18, // reduced from 24
  },
  warningText: {
    fontSize: 12, // reduced from 13
    color: "#78350F",
    lineHeight: 16, // reduced from 18
    fontWeight: "500",
  },
  section: {
    marginBottom: 8, // reduced from 12
    backgroundColor: "#FFFFFF",
    padding: 8, // reduced from 12
    borderRadius: 10, // reduced from 12
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6, // reduced from 10
    paddingBottom: 6, // reduced from 8
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 13, // reduced from 15
    fontWeight: "700",
    color: "#111827",
    marginLeft: 6, // reduced from 8
  },
  sectionContent: {
    paddingLeft: 18, // reduced from 24
  },
  timeText: {
    fontSize: 13, // reduced from 15
    color: "#1F2937",
    fontWeight: "600",
  },
  courseName: {
    fontSize: 13, // reduced from 15
    color: "#1F2937",
    fontWeight: "600",
  },
  locationText: {
    fontSize: 12, // reduced from 14
    color: "#374151",
    lineHeight: 16, // reduced from 20
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 12, // reduced from 14
    color: "#374151",
    lineHeight: 16, // reduced from 20
    fontWeight: "500",
  },
  quizItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  quizMeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quizMetaText: {
    fontSize: 11,
    color: "#1E40AF",
    marginLeft: 4,
    fontWeight: "700",
  },
  quizDescription: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: "500",
  },
  quizFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 3,
  },
  createdByText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    fontWeight: "500",
  },
  videoItem: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    position: "relative",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  defaultThumbnail: {
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 16,
    marginBottom: 6,
    fontWeight: "500",
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoMetaText: {
    fontSize: 10,
    color: "#374151",
    marginLeft: 4,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonFooter: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  closeButtonFooter: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  closeButtonText: {
    color: "#374151",
    fontSize: 15,
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
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "600",
  },
  enrollmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  enrollmentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  enrollmentEmail: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 3,
  },
  enrollmentStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  enrollmentStatusText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  checkAllButton: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  checkAllText: {
    color: "#374151",
    fontSize: 11,
    fontWeight: "600",
  },
  checkAllButtonDisabled: {
    opacity: 0.5,
  },
  attendanceLabelWrapper: {
    marginTop: 4,
  },
  attendanceLabel: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
    fontWeight: "700",
  },
  attendancePresent: {
    backgroundColor: "#D1FAE5",
    color: "#047857",
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
