import { useRouter } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const courses = [
    {
      id: 1,
      title: "Cơ bản Pickleball cho người mới bắt đầu",
      coach: "Huấn luyện viên Nguyễn Văn A",
      rating: 4.8,
      reviews: 124,
      price: "500.000 VNĐ",
      duration: "4 tuần",
      level: "Cơ bản",
      image:
        "https://cdn.britannica.com/25/236225-050-59A4051E/woman-daughter-doubles-pickleball.jpg",
      location: "Sân Pickleball Quận 3",
      courseType: "individual",
      status: "upcoming",
      totalSessions: 8,
    },
  ];

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Search & Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <View style={styles.searchIcon} />
            <TextInput
              placeholder="Tìm kiếm khóa học..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.filterBtn} />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Trạng thái khóa học</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {["Tất cả", "Sắp diễn ra", "Đang diễn ra"].map((x, i) => (
              <View key={i} style={[styles.chip, i === 0 && styles.chipActive]}>
                <Text
                  style={[styles.chipText, i === 0 && styles.chipTextActive]}
                >
                  {x}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Course Cards */}
        <View style={{ gap: 16 }}>
          {courses.map((c) => (
            <View
              key={c.id}
              style={[styles.card, { padding: 0, overflow: "hidden" }]}
            >
              <Image source={{ uri: c.image }} style={styles.cover} />
              <View style={{ padding: 16, gap: 8 }}>
                <Text style={styles.courseTitle}>{c.title}</Text>
                <Text style={styles.courseCoach}>{c.coach}</Text>

                <View style={styles.rowGap8}>
                  <View style={styles.star} />
                  <Text style={styles.meta}>{c.rating}</Text>
                  <Text style={styles.meta}>({c.reviews})</Text>
                </View>

                <View style={styles.rowGap8}>
                  <View style={styles.pin} />
                  <Text style={styles.meta}>{c.location}</Text>
                </View>

                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgePrimary]}>
                    <Text style={styles.badgeText}>
                      {c.courseType === "individual" ? "Cá nhân" : "Nhóm"}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.badgeNeutral]}>
                    <Text style={[styles.badgeText, { color: "#111827" }]}>
                      {c.level}
                    </Text>
                  </View>
                </View>

                <Text style={styles.price}>{c.price}</Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/(learner)/payment",
                      params: { id: String(c.id) },
                    } as any)
                  }
                >
                  <Text style={styles.primaryBtnText}>
                    {c.courseType === "individual"
                      ? "Đăng ký cá nhân"
                      : "Đăng ký"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#9CA3AF",
  },
  searchInput: { flex: 1, color: "#111827" },
  filterBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  filterSection: { gap: 8 },
  filterTitle: { color: "#111827", fontWeight: "600" },
  chipsRow: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  chipActive: { backgroundColor: "#10B981" },
  chipText: { color: "#374151", fontSize: 12, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  cover: { width: "100%", height: 160, backgroundColor: "#E5E7EB" },
  courseTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  courseCoach: { color: "#6B7280", fontSize: 12 },
  rowGap8: { flexDirection: "row", alignItems: "center", gap: 6 },
  star: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FBBF24" },
  pin: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#9CA3AF" },
  meta: { color: "#6B7280", fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePrimary: { backgroundColor: "#10B981" },
  badgeNeutral: { backgroundColor: "#E5E7EB" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  price: { color: "#10B981", fontWeight: "700", marginTop: 6 },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
