import type { CoachDetail } from "@/types/coach";
import { Feedback } from "@/types/feecbacks";
import { parseStringArray } from "@/utils/parseStringArray";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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
  feedbacks: Feedback[];
  courseStatus?: string;
  onClose: () => void;
  onCredentialPress: (credential: any) => void;
};

export function CoachDetailModal({
  visible,
  coachDetail,
  feedbacks,
  courseStatus,
  onClose,
  onCredentialPress,
}: Props) {
  const [expandedCredential, setExpandedCredential] = useState<any>(null);

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
                              if (credential.publicUrl) {
                                setExpandedCredential(
                                  expandedCredential?.id === credential.id
                                    ? null
                                    : credential
                                );
                              }
                            }}
                            activeOpacity={credential.publicUrl ? 0.7 : 1}
                          >
                            <View style={styles.credentialIcon}>
                              <Ionicons
                                name={
                                  credential.type === "CERTIFICATE"
                                    ? "document-text-outline"
                                    : credential.type === "PRIZE"
                                    ? "trophy-outline"
                                    : "ribbon-outline"
                                }
                                size={16}
                                color="#059669"
                              />
                            </View>
                            <View style={styles.credentialContent}>
                              <Text style={styles.credentialName}>
                                {credential.name}
                              </Text>
                              {credential.description && (
                                <Text style={styles.credentialDescription}>
                                  {credential.description}
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
                            {credential.publicUrl && (
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
                            credential.publicUrl && (
                              <View style={styles.expandedImageContainer}>
                                <Image
                                  source={{ uri: credential.publicUrl }}
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
            {feedbacks && feedbacks.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Đánh giá{" "}
                  <Text style={styles.countBadge}>({feedbacks.length})</Text>
                </Text>

                {feedbacks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {feedbacks.map((feedback, index) => (
                      <View
                        key={feedback.id || index}
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
                                  : (feedback as any).createdBy?.fullName ||
                                    "Người dùng"}
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
                        {feedback.comment && (
                          <Text style={styles.commentText}>
                            {feedback.comment}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
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
