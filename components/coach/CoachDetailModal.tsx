import { get } from "@/services/http/httpService";
import type { CoachDetail } from "@/types/coach";
import { Feedback } from "@/types/feecbacks";
import { parseStringArray } from "@/utils/parseStringArray";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  coachDetail: CoachDetail | null;
  feedbacks?: Feedback[];
  courseStatus?: string;
  onClose: () => void;
  onCredentialPress: (credential: any) => void;
};

export function CoachDetailModal({
  visible,
  coachDetail,
  courseStatus,
  onClose,
  onCredentialPress,
}: Props) {
  const [expandedCredential, setExpandedCredential] = useState<any>(null);
  const [coachFeedbacks, setCoachFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // Fetch coach feedbacks when modal opens
  useEffect(() => {
    if (visible && coachDetail?.user?.id) {
      fetchCoachFeedbacks(coachDetail.user.id);
    }
  }, [visible, coachDetail?.user?.id]);

  const fetchCoachFeedbacks = async (coachUserId: number) => {
    try {
      setLoadingFeedbacks(true);
      const res = await get<Feedback[]>(`/v1/feedbacks/coaches/${coachUserId}`);
      setCoachFeedbacks((res.data as any).metadata || []);
    } catch (error) {
      setCoachFeedbacks([]);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  if (!coachDetail) return null;

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.safe}>
        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Thông tin huấn luyện viên
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          <View style={{ gap: 16 }}>
            {/* Coach Info Card */}
            <View style={styles.card}>
              <View style={styles.coachInfoSection}>
                <View style={styles.coachHeader}>
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#059669"
                  />
                  <View style={styles.coachInfoText}>
                    <Text style={styles.coachName}>
                      {coachDetail.user?.fullName}
                    </Text>
                    <Text style={styles.coachEmail}>
                      {coachDetail.user?.phoneNumber}
                    </Text>
                  </View>
                </View>

                {coachDetail.yearOfExperience > 0 && (
                  <View style={styles.experienceBox}>
                    <Ionicons name="star-outline" size={16} color="#F59E0B" />
                    <Text style={styles.experienceText}>
                      {coachDetail.yearOfExperience} năm kinh nghiệm
                    </Text>
                  </View>
                )}

                {coachDetail.verificationStatus && (
                  <View
                    style={[
                      styles.verificationBadge,
                      {
                        backgroundColor:
                          coachDetail.verificationStatus === "VERIFIED"
                            ? "#D1FAE5"
                            : "#FEF3C7",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        coachDetail.verificationStatus === "VERIFIED"
                          ? "checkmark-circle"
                          : "information-circle-outline"
                      }
                      size={14}
                      color={
                        coachDetail.verificationStatus === "VERIFIED"
                          ? "#059669"
                          : "#F59E0B"
                      }
                    />
                    <Text
                      style={[
                        styles.verificationText,
                        {
                          color:
                            coachDetail.verificationStatus === "VERIFIED"
                              ? "#059669"
                              : "#F59E0B",
                        },
                      ]}
                    >
                      {coachDetail.verificationStatus === "VERIFIED"
                        ? "Đã xác minh"
                        : "Chưa xác minh"}
                    </Text>
                  </View>
                )}

                {coachDetail.bio && (
                  <View style={styles.bioSection}>
                    <Text style={styles.bioLabel}>Giới thiệu</Text>
                    <Text style={styles.bioText}>{coachDetail.bio}</Text>
                  </View>
                )}

                {coachDetail.specialties &&
                  parseStringArray(coachDetail.specialties).length > 0 && (
                    <View style={styles.specialtiesSection}>
                      <Text style={styles.specialtyLabel}>Chuyên môn</Text>
                      <View style={styles.specialtyTags}>
                        {parseStringArray(coachDetail.specialties).map(
                          (specialty: string, idx: number) => (
                            <View key={idx} style={styles.specialtyTag}>
                              <Text style={styles.specialtyTagText}>
                                {specialty}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}

                {coachDetail.teachingMethods &&
                  parseStringArray(coachDetail.teachingMethods).length > 0 && (
                    <View style={styles.specialtiesSection}>
                      <Text style={styles.specialtyLabel}>
                        Phương pháp giảng dạy
                      </Text>
                      <View style={styles.specialtyTags}>
                        {parseStringArray(coachDetail.teachingMethods).map(
                          (method: string, idx: number) => (
                            <View key={idx} style={styles.specialtyTag}>
                              <Text style={styles.specialtyTagText}>
                                {method}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}
              </View>

              {/* Credentials */}
              {coachDetail.credentials &&
                coachDetail.credentials.length > 0 && (
                  <View style={styles.credentialsSection}>
                    <View style={styles.credentialsDivider} />
                    <Text style={styles.sectionSubtitle}>
                      Chứng chỉ & Giải thưởng
                    </Text>
                    <View style={styles.credentialsList}>
                      {coachDetail.credentials.map((credential, idx) => (
                        <View key={idx}>
                          <TouchableOpacity
                            style={styles.credentialItem}
                            onPress={() => {
                              if (credential.baseCredential.publicUrl) {
                                setExpandedCredential(
                                  expandedCredential?.id === credential.id
                                    ? null
                                    : credential
                                );
                              }
                            }}
                            activeOpacity={
                              credential.baseCredential.publicUrl ? 0.7 : 1
                            }
                          >
                            <View style={styles.credentialIcon}>
                              <Ionicons
                                name={
                                  credential.baseCredential.type ===
                                  "CERTIFICATE"
                                    ? "document-text-outline"
                                    : credential.baseCredential.type === "PRIZE"
                                    ? "trophy-outline"
                                    : "ribbon-outline"
                                }
                                size={16}
                                color="#059669"
                              />
                            </View>
                            <View style={styles.credentialContent}>
                              <Text style={styles.credentialName}>
                                {credential.baseCredential.name}
                              </Text>
                              {credential.baseCredential.description && (
                                <Text style={styles.credentialDescription}>
                                  {credential.baseCredential.description}
                                </Text>
                              )}
                              {(credential.issuedAt ||
                                credential.expiresAt) && (
                                <Text style={styles.credentialDate}>
                                  {credential.issuedAt &&
                                    `Cấp: ${new Date(
                                      credential.issuedAt
                                    ).toLocaleDateString("vi-VN")}`}
                                  {credential.expiresAt &&
                                    ` | Hết hạn: ${new Date(
                                      credential.expiresAt
                                    ).toLocaleDateString("vi-VN")}`}
                                </Text>
                              )}
                            </View>
                            {credential.baseCredential.publicUrl && (
                              <Ionicons
                                name={
                                  expandedCredential?.id === credential.id
                                    ? "chevron-up"
                                    : "chevron-down"
                                }
                                size={20}
                                color="#6B7280"
                              />
                            )}
                          </TouchableOpacity>

                          {/* Expanded Image View */}
                          {expandedCredential?.id === credential.id &&
                            credential.baseCredential.publicUrl && (
                              <View style={styles.expandedImageContainer}>
                                <Image
                                  source={{
                                    uri: credential.baseCredential.publicUrl,
                                  }}
                                  style={styles.credentialImage}
                                  resizeMode="contain"
                                />
                              </View>
                            )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
            </View>

            {/* Feedbacks Section */}
            {!loadingFeedbacks && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Đánh giá {coachFeedbacks ? coachFeedbacks.length : 0}{" "}
                  <Text style={styles.countBadge}></Text>
                </Text>

                {!coachFeedbacks || coachFeedbacks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {/* Coach Feedbacks */}
                    {coachFeedbacks && coachFeedbacks.length > 0 && (
                      <View>
                        <Text style={styles.feedbackGroupTitle}>
                          Đánh giá về huấn luyện viên
                        </Text>
                        <View style={{ gap: 12 }}>
                          {coachFeedbacks.map(
                            (feedback: Feedback, index: number) => (
                              <View
                                key={`coach-${feedback.id || index}`}
                                style={styles.feedbackCard}
                              >
                                <View style={styles.feedbackTop}>
                                  <View style={styles.userInfo}>
                                    <View style={styles.avatarPlaceholder}>
                                      <Text style={styles.avatarText}>
                                        {feedback.isAnonymous
                                          ? "A"
                                          : (feedback as any).createdBy
                                              ?.fullName?.[0] || "U"}
                                      </Text>
                                    </View>
                                    <View>
                                      <Text style={styles.userName}>
                                        {feedback.isAnonymous
                                          ? "Ẩn danh"
                                          : (feedback as any).createdBy
                                              ?.fullName || "Người dùng"}
                                      </Text>
                                      <Text style={styles.feedbackTime}>
                                        {formatDateTime(feedback.createdAt)}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Ionicons
                                        key={star}
                                        name={
                                          star <= feedback.rating
                                            ? "star"
                                            : "star-outline"
                                        }
                                        size={14}
                                        color={
                                          star <= feedback.rating
                                            ? "#F59E0B"
                                            : "#E5E7EB"
                                        }
                                      />
                                    ))}
                                  </View>
                                </View>

                                {/* Course Info */}
                                {(feedback as any).course && (
                                  <View style={styles.courseInfoBox}>
                                    <Ionicons
                                      name="book-outline"
                                      size={14}
                                      color="#059669"
                                    />
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.courseLabel}>
                                        Khóa học:
                                      </Text>
                                      <Text
                                        style={styles.courseNameText}
                                        numberOfLines={1}
                                      >
                                        {(feedback as any).course?.name ||
                                          "Khóa học"}
                                      </Text>
                                    </View>
                                  </View>
                                )}

                                {feedback.comment && (
                                  <Text style={styles.commentText}>
                                    {feedback.comment}
                                  </Text>
                                )}
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Loading Feedbacks State */}
            {loadingFeedbacks && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Đánh giá</Text>
                <View style={styles.emptyState}>
                  <ActivityIndicator size="small" color="#059669" />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  container: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  coachInfoSection: {
    gap: 12,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachInfoText: {
    flex: 1,
    gap: 2,
  },
  coachName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  coachEmail: {
    fontSize: 12,
    color: "#6B7280",
  },

  experienceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  experienceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B45309",
  },

  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "600",
  },

  bioSection: {
    gap: 6,
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bioText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },

  specialtiesSection: {
    gap: 8,
  },
  specialtyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  specialtyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  specialtyTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },

  credentialsSection: {
    gap: 8,
  },
  credentialsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 0,
  },
  credentialsList: {
    gap: 10,
  },
  credentialItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  credentialIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  credentialContent: {
    flex: 1,
    gap: 2,
  },
  credentialName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  credentialDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  credentialDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  countBadge: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  feedbackGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 8,
    marginTop: 8,
  },

  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    gap: 12,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  feedbackCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  feedbackTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  feedbackTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  commentText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  courseInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  courseLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  courseNameText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
    marginTop: 2,
  },

  expandedImageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
    gap: 8,
  },
  credentialImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
});
