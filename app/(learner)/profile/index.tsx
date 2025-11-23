import { useJWTAuthActions } from "@/services/jwt-auth/JWTAuthProvider";
import storageService from "@/services/storageService";
import { PickleballLevel, User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useJWTAuthActions();
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

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)");
        },
      },
    ]);
  };

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

  const menuItems = [
    {
      key: "info",
      icon: "person",
      label: "Thông tin cá nhân",
      to: "/(learner)/menu/account",
    },
    {
      key: "notifications",
      icon: "notifications",
      label: "Thông báo",
      to: "/(learner)/menu/notifications",
    },
    {
      key: "enrolled",
      icon: "book",
      label: "Khóa học đã đăng ký",
      to: "/(learner)/my-courses",
    },
    {
      key: "payouts",
      icon: "wallet",
      label: "Ví & Giao dịch",
      to: "/(learner)/payouts",
    },
    {
      key: "achievements",
      icon: "trophy",
      label: "Thành tựu",
      to: "/(learner)/profile",
    },
    {
      key: "settings",
      icon: "settings",
      label: "Cài đặt",
      to: "/(learner)/profile",
    },
  ];

  const quickActions = [
    {
      key: "schedule",
      icon: "calendar",
      label: "Lịch học",
      color: "#3B82F6",
      to: "/(learner)/profile",
    },
    {
      key: "achievements",
      icon: "star",
      label: "Thành tựu",
      color: "#F59E0B",
      to: "/(learner)/profile",
    },
  ];

  return (
    <View style={[styles.safe]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Background */}
        <View style={styles.headerBg} />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.fullName || "User")}
              </Text>
            </View>
            <View style={styles.editButton}>
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || "User"}</Text>
            <Text style={styles.userId}>{user?.email || "N/A"}</Text>
            <Text style={styles.userEmail}>{user?.phoneNumber || "N/A"}</Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesSection}>
            <View style={[styles.badge, styles.badgeLevelBasic]}>
              <Ionicons name="layers" size={12} color="#059669" />
              <Text style={styles.badgeTextLevel}>
                {user?.learner?.[0]
                  ? getLevelInVietnamese(user.learner[0].skillLevel)
                  : "Chưa xác định"}
              </Text>
            </View>
            <View style={[styles.badge, styles.badgeRoleLearner]}>
              <Ionicons name="school" size={12} color="#FFFFFF" />
              <Text style={styles.badgeTextRole}>Học viên</Text>
            </View>
          </View>

          {/* Learner Details */}
          {user?.learner?.[0] && (
            <View style={styles.learnerDetailsSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Trình độ hiện tại</Text>
                  <Text style={styles.detailValue}>
                    {getLevelInVietnamese(user.learner[0].skillLevel)}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mục tiêu</Text>
                  <Text style={styles.detailValue}>
                    {getLevelInVietnamese(user.learner[0].learningGoal)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tỉnh/Thành</Text>
                  <Text style={styles.detailValue}>
                    {user?.province?.name || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Quận/Huyện</Text>
                  <Text style={styles.detailValue}>
                    {user?.district?.name || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Khóa học</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>68%</Text>
              <Text style={styles.statLabel}>Hoàn thành</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Thành tựu</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickActionCard}
              activeOpacity={0.85}
              onPress={() => router.push(action.to as any)}
            >
              <View
                style={[
                  styles.quickActionIconBg,
                  { backgroundColor: action.color + "15" },
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Menu</Text>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(item.to as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={18} color="#059669" />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { paddingBottom: 20 },

  /* Header Background */
  headerBg: {
    height: 140,
    backgroundColor: "#059669",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  /* Profile Card */
  profileCard: {
    marginHorizontal: 16,
    marginTop: -60,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },

  /* Avatar Container */
  avatarContainer: {
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  /* User Info */
  userInfo: {
    alignItems: "center",
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  userId: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  userEmail: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  /* Badges Section */
  badgesSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  badgeLevelBasic: {
    backgroundColor: "#F0FDF4",
  },
  badgeTextLevel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  badgeRoleLearner: {
    backgroundColor: "#059669",
  },
  badgeTextRole: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Stats Row */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
  },

  /* Section Header */
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  /* Quick Actions Grid */
  quickActionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },

  /* Menu Card */
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  /* Logout Button */
  logoutBtn: {
    marginHorizontal: 16,
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },

  /* Learner Details Section */
  learnerDetailsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  detailDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
  },

  /* Old Styles (kept for safety) */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  rowGap12: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  badgePrimary: { backgroundColor: "#059669" },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6B7280",
  },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#111827", fontWeight: "600" },
});
