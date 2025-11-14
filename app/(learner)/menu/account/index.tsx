import storageService from "@/services/storageService";
import { PickleballLevel, User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AccountInfoScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await storageService.getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const getLevelInVietnamese = (level: PickleballLevel | undefined): string => {
    if (!level) return "Chưa xác định";
    const levelMap: Record<PickleballLevel, string> = {
      [PickleballLevel.BEGINNER]: "Cơ bản",
      [PickleballLevel.INTERMEDIATE]: "Trung bình",
      [PickleballLevel.ADVANCED]: "Nâng cao",
    };
    return levelMap[level] || "Chưa xác định";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(learner)/profile" as any)}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.fullName || "User")}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Thông tin cơ bản</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>{user?.fullName || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="call" size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Learner Info Card */}
        {user?.learner?.[0] && (
          <View style={styles.card}>
            <View style={styles.cardSection}>
              <Text style={styles.sectionLabel}>Thông tin học viên</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.gridItem}>
                <View style={styles.gridIconContainer}>
                  <Ionicons name="layers" size={20} color="#059669" />
                </View>
                <Text style={styles.gridLabel}>Trình độ hiện tại</Text>
                <Text style={styles.gridValue}>
                  {getLevelInVietnamese(user.learner[0].skillLevel)}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <View style={styles.gridIconContainer}>
                  <Ionicons name="flag" size={20} color="#059669" />
                </View>
                <Text style={styles.gridLabel}>Mục tiêu</Text>
                <Text style={styles.gridValue}>
                  {getLevelInVietnamese(user.learner[0].learningGoal)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#059669" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tỉnh/Thành phố</Text>
                <Text style={styles.infoValue}>
                  {user.learner[0].province?.name || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#059669" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Quận/Huyện</Text>
                <Text style={styles.infoValue}>
                  {user.learner[0].district?.name || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Info Card */}
        <View style={styles.card}>
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>Thông tin tài khoản</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vai trò</Text>
              <Text style={styles.infoValue}>Học viên</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày tạo tài khoản</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton} activeOpacity={0.85}>
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },

  /* Profile Section */
  section: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Info Item */
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },

  /* Grid Layout */
  infoGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  gridIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
  },

  /* Edit Button */
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: "#059669",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
