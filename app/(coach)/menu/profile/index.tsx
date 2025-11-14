import storageService from "@/services/storageService";
import { CoachVerificationStatus, User } from "@/types/user";
import { parseStringArray } from "@/utils/parseStringArray";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CoachProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState(user?.coach?.[0] || null);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await storageService.getUser();
      setUser(storedUser);
      console.log("Fetched user sss:", storedUser);
      setCoach(storedUser?.coach?.[0] || null);
    };
    fetchUser();
  }, []);

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
      {/* Header */}
      <View style={styles.header}>
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
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  header: {
    gap: 4,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#059669",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoLeft: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statusContent: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0369A1",
  },
  rejectionCard: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  rejectionText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
  },
  credentialLink: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  credentialLinkContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  credentialLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  credentialLinkText: {
    flex: 1,
    gap: 2,
  },
  credentialLinkTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  credentialLinkSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
});
