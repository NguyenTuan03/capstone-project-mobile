import {
  getVerificationBadgeStyle,
  getVerificationColor,
  getVerificationIcon,
  getVerificationLabel,
} from "@/helper/content.helper";
import { get } from "@/services/http/httpService";
import { useJWTAuthActions } from "@/services/jwt-auth/JWTAuthProvider";
import storageService from "@/services/storageService";
import { User } from "@/types/user";
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

export default function ContentScreen() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const { logout } = useJWTAuthActions();

  const loadRating = useCallback(async (coachId: number) => {
    try {
      const res = await get<{
        statusCode: number;
        message: string;
        metadata: {
          overall: number;
          total: number;
        };
      }>(`/v1/coaches/${coachId}/rating/overall`);
      if (res?.data?.metadata !== undefined) {
        setRating(res.data.metadata.overall);
      }
    } catch (error) {
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
        loadRating(userData.id);
      }
    } catch (error) {}
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
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
            router.replace("/(auth)");
          } catch (error) {
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Header with Green Background */}
      <View style={styles.headerSection}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.push("/(coach)/menu/notifications" as any)}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
                  uri:
                    user?.profilePicture ||
                    "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
                }}
                style={styles.profileImage}
              />
            )}
          </View>

          {/* Profile Info Column */}
          <View style={styles.profileInfoColumn}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.fullName || "Coach"}
            </Text>

            <View style={styles.badgesRow}>
              {user?.coach && user.coach.length > 0 && (
                <View
                  style={[
                    styles.verificationBadge,
                    getVerificationBadgeStyle(user.coach[0].verificationStatus),
                  ]}
                >
                  <Ionicons
                    name={getVerificationIcon(user.coach[0].verificationStatus)}
                    size={12}
                    color={getVerificationColor(
                      user.coach[0].verificationStatus
                    )}
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

              {rating !== null && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Contact Info */}
            <View style={styles.contactInfoContainer}>
              {user?.phoneNumber && (
                <View style={styles.contactItem}>
                  <Ionicons
                    name="call-outline"
                    size={12}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                  <Text style={styles.contactText}>{user.phoneNumber}</Text>
                </View>
              )}
              {user?.email && (
                <View style={styles.contactItem}>
                  <Ionicons
                    name="mail-outline"
                    size={12}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              )}
            </View>
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  notificationButton: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileImageContainer: {
    backgroundColor: "#D1F7C4",
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileInfoColumn: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  contactInfoContainer: {
    gap: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 13,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
  logoutCard: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFA",
  },
  logoutIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },
  logoutDescription: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "400",
  },
});
