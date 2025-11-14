import { get } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { CoachVerificationStatus, User } from "@/types/user";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper functions for verification status
const getVerificationIcon = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "checkmark-circle";
    case CoachVerificationStatus.PENDING:
      return "hourglass";
    case CoachVerificationStatus.REJECTED:
      return "close-circle";
    default:
      return "help-circle";
  }
};

const getVerificationColor = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "#10B981";
    case CoachVerificationStatus.PENDING:
      return "#F59E0B";
    case CoachVerificationStatus.REJECTED:
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
};

const getVerificationLabel = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return "Xác minh";
    case CoachVerificationStatus.PENDING:
      return "Đang xét duyệt";
    case CoachVerificationStatus.REJECTED:
      return "Từ chối";
    default:
      return "Chưa xác minh";
  }
};

const getVerificationBadgeStyle = (status: CoachVerificationStatus) => {
  switch (status) {
    case CoachVerificationStatus.VERIFIED:
      return {
        backgroundColor: "#D1FAE5",
        borderWidth: 0,
      };
    case CoachVerificationStatus.PENDING:
      return {
        backgroundColor: "#FEF3C7",
        borderWidth: 0,
      };
    case CoachVerificationStatus.REJECTED:
      return {
        backgroundColor: "#FEE2E2",
        borderWidth: 0,
      };
    default:
      return {
        backgroundColor: "#E5E7EB",
        borderWidth: 0,
      };
  }
};

export default function ContentScreen() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  const loadRating = useCallback(async (coachId: number) => {
    try {
      const res = await get<{
        statusCode: number;
        message: string;
        metadata: number;
      }>(`/v1/coaches/${coachId}/rating/overall`);
      if (res?.data?.metadata !== undefined) {
        setRating(res.data.metadata);
      }
    } catch (error) {
      console.error("Error loading rating:", error);
      setRating(null);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await storageService.getUser();
      setUser(userData);

      // Load rating if user has coach profile
      if (
        userData?.coach &&
        userData.coach.length > 0 &&
        userData.coach[0].id
      ) {
        loadRating(userData.coach[0].id);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, [loadRating]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          setLoading(true);
          // Add logout logic here
          setTimeout(() => {
            setLoading(false);
            router.replace("/(auth)");
          }, 500);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Header with Green Background */}
      <View style={styles.headerSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
                }}
                style={styles.profileImage}
              />
            )}
          </View>

          {/* Full Name with Verification Badge */}
          <View style={styles.nameWithBadgeContainer}>
            <Text style={styles.profileName}>{user?.fullName || "Coach"}</Text>
            {user?.coach && user.coach.length > 0 && (
              <View
                style={[
                  styles.verificationBadge,
                  getVerificationBadgeStyle(user.coach[0].verificationStatus),
                ]}
              >
                <Ionicons
                  name={getVerificationIcon(user.coach[0].verificationStatus)}
                  size={14}
                  color={getVerificationColor(user.coach[0].verificationStatus)}
                />
                <Text
                  style={[
                    styles.verificationBadgeText,
                    {
                      color: getVerificationColor(
                        user.coach[0].verificationStatus
                      ),
                    },
                  ]}
                >
                  {getVerificationLabel(user.coach[0].verificationStatus)}
                </Text>
              </View>
            )}
            {/* Rating Display */}
            {rating !== null && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const roundedRating = Math.round(rating);
                    const isFilled = star <= roundedRating;
                    return (
                      <Ionicons
                        key={star}
                        name={isFilled ? "star" : "star-outline"}
                        size={16}
                        color={isFilled ? "#FBBF24" : "#D1D5DB"}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Contact Info */}
          <View style={styles.contactInfoContainer}>
            {user?.phoneNumber && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                <Text style={styles.contactText}>{user.phoneNumber}</Text>
              </View>
            )}
            {user?.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={14} color="#FFFFFF" />
                <Text style={styles.contactText}>{user.email}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Teaching Management Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={18} color="#059669" />
            <Text style={styles.sectionTitle}>Quản lý bài giảng</Text>
          </View>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/(coach)/menu/subject" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="book-outline" size={24} color="#059669" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Tài liệu khóa học</Text>
              <Text style={styles.menuDescription}>
                Quản lý chương, bài học, video
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={28} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Personal Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color="#059669" />
            <Text style={styles.sectionTitle}>Cá nhân</Text>
          </View>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/(coach)/menu/profile" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#059669"
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Thông tin cá nhân</Text>
              <Text style={styles.menuDescription}>
                Cập nhật hồ sơ và thông tin liên hệ
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={28} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/(coach)/menu/analytics" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="bar-chart-outline" size={24} color="#059669" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Hiệu suất giảng dạy</Text>
              <Text style={styles.menuDescription}>
                Xem thống kê và báo cáo hiệu suất
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={28} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push("/(coach)/menu/payouts" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#059669" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Quản lý ví tiền</Text>
              <Text style={styles.menuDescription}>
                Kiểm tra thu nhập và giao dịch
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={28} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={[styles.menuCard, styles.logoutCard]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View
              style={[styles.menuIconContainer, styles.logoutIconContainer]}
            >
              <MaterialIcons name="logout" size={24} color="#DC2626" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.logoutTitle}>Đăng xuất</Text>
              <Text style={styles.logoutDescription}>
                Đăng xuất khỏi tài khoản của bạn
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <MaterialIcons name="chevron-right" size={28} color="#FEE2E2" />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSection: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  profileCard: {
    alignItems: "center",
  },
  profileImageContainer: {
    backgroundColor: "#D1F7C4",
    borderRadius: 60,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: 70,
    height: 70,
  },
  nameWithBadgeContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verificationBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ratingContainer: {
    marginTop: 4,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  contactInfoContainer: {
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  logoutCard: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFA",
  },
  logoutIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
  },
  logoutDescription: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "500",
  },
});
