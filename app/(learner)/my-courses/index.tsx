import { useRouter } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyCoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const enrolled = [
    {
      id: 1,
      title: "Cơ bản Pickleball cho người mới bắt đầu",
      coach: "Huấn luyện viên Nguyễn Văn A",
      courseType: "individual",
      totalSessions: 8,
      completedSessions: 3,
      progress: 37,
      image:
        "https://cdn.britannica.com/25/236225-050-59A4051E/woman-daughter-doubles-pickleball.jpg",
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
        <Text style={styles.pageTitle}>Khóa học của tôi</Text>

        {enrolled.map((c) => (
          <View
            key={c.id}
            style={[styles.card, { padding: 0, overflow: "hidden" }]}
          >
            <Image source={{ uri: c.image }} style={styles.cover} />
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={styles.courseTitle}>{c.title}</Text>
              <Text style={styles.courseCoach}>{c.coach}</Text>

              <View style={{ gap: 6 }}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Tiến độ</Text>
                  <Text style={styles.progressPercent}>{c.progress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${c.progress}%` }]}
                  />
                </View>
                <Text style={styles.sessionCount}>
                  {c.completedSessions}/{c.totalSessions} buổi
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/(learner)/course/[id]",
                    params: { id: String(c.id) },
                  } as any)
                }
              >
                <Text style={styles.primaryBtnText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  cover: { width: "100%", height: 128, backgroundColor: "#E5E7EB" },
  courseTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  courseCoach: { color: "#6B7280", fontSize: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#6B7280", fontSize: 12 },
  progressPercent: { color: "#10B981", fontWeight: "700" },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#10B981", borderRadius: 999 },
  sessionCount: { color: "#6B7280", fontSize: 12 },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
