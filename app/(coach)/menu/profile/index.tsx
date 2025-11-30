import storageService from "@/services/storageService";
import { CoachVerificationStatus, User } from "@/types/user";
import { parseStringArray } from "@/utils/parseStringArray";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CoachProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState(user?.coach?.[0] || null);

  const loadProfile = useCallback(async () => {
      const storedUser = await storageService.getUser();
      setUser(storedUser);
      setCoach(storedUser?.coach?.[0] || null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const getVerificationStatusColor = (status: CoachVerificationStatus) => {
    switch (status) {
      case CoachVerificationStatus.VERIFIED:
        return "#059669"; // Green
      case CoachVerificationStatus.PENDING:
        return "#F59E0B"; // Amber
      case CoachVerificationStatus.REJECTED:
        return "#EF4444"; // Red
      case CoachVerificationStatus.UNVERIFIED:
        return "#6B7280"; // Gray
      default:
        return "#6B7280";
    }
  };

  const getVerificationStatusText = (status: CoachVerificationStatus) => {
    switch (status) {
      case CoachVerificationStatus.VERIFIED:
        return "Đã xác minh";
      case CoachVerificationStatus.PENDING:
        return "Đang chờ xác minh";
      case CoachVerificationStatus.REJECTED:
        return "Bị từ chối";
      case CoachVerificationStatus.UNVERIFIED:
        return "Chưa xác minh";
      default:
        return "Không rõ";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Back Button */}
      <View style={styles.headerTop}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#059669" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Hồ sơ HLV</Text>
          <Text style={styles.subtitle}>Thông tin cá nhân và chuyên môn</Text>
        </View>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push("/(coach)/menu/profile/edit")}
        >
          <Ionicons name="pencil" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Personal Info Section - User Basic Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle" size={20} color="#059669" />
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <Text style={styles.sectionSubtitle}>(Thông tin tài khoản)</Text>
        </View>
        <View style={styles.infoCard}>
          {/* Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>{user?.fullName || "N/A"}</Text>
            </View>
            <Ionicons name="person" size={24} color="#059669" />
          </View>

          {/* Phone */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || "N/A"}</Text>
            </View>
            <Ionicons name="call" size={24} color="#059669" />
          </View>

          {/* Email */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
            </View>
            <Ionicons name="mail" size={24} color="#059669" />
          </View>
        </View>
      </View>

      {/* Coach Info Section */}
      {coach && (
        <>
          {/* Verification Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Trạng thái xác minh</Text>
            </View>
            <View
              style={[
                styles.statusCard,
                {
                  borderLeftColor: getVerificationStatusColor(
                    coach.verificationStatus
                  ),
                },
              ]}
            >
              <View style={styles.statusContent}>
                <Text style={styles.statusLabel}>Xác minh HLV</Text>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: getVerificationStatusColor(
                        coach.verificationStatus
                      ),
                    },
                  ]}
                >
                  {getVerificationStatusText(coach.verificationStatus)}
                </Text>
              </View>
              <Ionicons
                name={
                  coach.verificationStatus === CoachVerificationStatus.VERIFIED
                    ? "checkmark-circle"
                    : "alert-circle"
                }
                size={24}
                color={getVerificationStatusColor(coach.verificationStatus)}
              />
            </View>
          </View>

          {/* Professional Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>
              <Text style={styles.sectionSubtitle}>(Thông tin HLV)</Text>
            </View>
            <View style={styles.infoCard}>
              {/* Experience */}
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Text style={styles.infoLabel}>Số năm kinh nghiệm</Text>
                  <Text style={styles.infoValue}>
                    {coach.yearOfExperience} năm
                  </Text>
                </View>
                <Ionicons name="school" size={24} color="#059669" />
              </View>

              {/* Bio */}
              <View style={[styles.infoRow, styles.borderTop]}>
                <View style={styles.infoLeft}>
                  <Text style={styles.infoLabel}>Giới thiệu</Text>
                  <Text
                    style={styles.infoValue}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {coach.bio || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Specialties */}
              {coach.specialties && (
                <View style={[styles.infoRow, styles.borderTop]}>
                  <View style={styles.infoLeft}>
                    <Text style={styles.infoLabel}>Chuyên môn</Text>
                    <View style={styles.tagsContainer}>
                      {parseStringArray(coach.specialties).map(
                        (specialty: string, index: number) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{specialty}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Teaching Methods */}
              {coach.teachingMethods && (
                <View style={[styles.infoRow, styles.borderTop]}>
                  <View style={styles.infoLeft}>
                    <Text style={styles.infoLabel}>Phương pháp giảng dạy</Text>
                    <View style={styles.tagsContainer}>
                      {parseStringArray(coach.teachingMethods).map(
                        (method: string, index: number) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{method}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Rejection Reason (if applicable) */}
          {coach.verificationStatus === CoachVerificationStatus.REJECTED &&
            coach.verificationReason && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>
                    Lý do từ chối
                  </Text>
                </View>
                <View style={[styles.infoCard, styles.rejectionCard]}>
                  <Text style={styles.rejectionText}>
                    {coach.verificationReason}
                  </Text>
                </View>
              </View>
            )}
        </>
      )}

      {/* Credentials Section Link */}
      <View style={styles.section}>
        <Pressable
          style={styles.credentialLink}
          onPress={() => router.push("/(coach)/menu/credentials" as any)}
        >
          <View style={styles.credentialLinkContent}>
            <View style={styles.credentialLinkIcon}>
              <Ionicons name="trophy" size={20} color="#059669" />
            </View>
            <View style={styles.credentialLinkText}>
              <Text style={styles.credentialLinkTitle}>Chứng chỉ & Giải thưởng</Text>
              <Text style={styles.credentialLinkSubtitle}>
                Quản lý chứng chỉ và giải thưởng của bạn
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#059669",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoLeft: {
    flex: 1,
    gap: 5,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderTopColor: "#E5E7EB",
    borderRightColor: "#E5E7EB",
    borderBottomColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statusContent: {
    flex: 1,
    gap: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#ECFDF5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  rejectionCard: {
    backgroundColor: "#FEF2F2",
    borderLeftColor: "#EF4444",
    borderWidth: 1,
    borderRightColor: "#FCA5A5",
    borderBottomColor: "#FCA5A5",
    borderTopColor: "#FCA5A5",
  },
  rejectionText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 20,
    fontWeight: "500",
  },
  credentialLink: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  credentialLinkContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  credentialLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  credentialLinkText: {
    flex: 1,
    gap: 3,
  },
  credentialLinkTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  credentialLinkSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
});
