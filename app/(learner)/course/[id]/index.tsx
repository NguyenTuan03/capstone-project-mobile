import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const course = {
    id,
    title: "Cơ bản Pickleball cho người mới bắt đầu",
    coach: "Huấn luyện viên Nguyễn Văn A",
    progress: 37,
    sessions: [
      {
        id: 1,
        title: "Buổi 1: Giới thiệu và luật chơi cơ bản",
        date: "2024-01-15",
        status: "completed",
        location: "Sân Pickleball Quận 3",
      },
      {
        id: 2,
        title: "Buổi 2: Kỹ thuật cầm vợt và đứng",
        date: "2024-01-18",
        status: "completed",
        location: "Sân Pickleball Quận 3",
      },
      {
        id: 3,
        title: "Buổi 3: Kỹ thuật đánh bóng cơ bản",
        date: "2024-01-22",
        status: "completed",
        location: "Sân Pickleball Quận 3",
      },
      {
        id: 4,
        title: "Buổi 4: Kỹ thuật giao bóng (Serve)",
        date: "2024-01-25",
        status: "upcoming",
        location: "Sân Pickleball Quận 3",
      },
    ] as {
      id: number;
      title: string;
      date: string;
      status: "completed" | "upcoming";
      location: string;
    }[],
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ marginTop: 50, marginLeft: 30 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.meta}>{course.coach}</Text>

        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Các buổi học</Text>
          {course.sessions.map((s) => (
            <View key={s.id} style={styles.sessionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>{s.title}</Text>
                <Text style={styles.meta}>{s.location}</Text>
                <View style={styles.rowGap8}>
                  <Text style={styles.meta}>{s.date}</Text>
                  <Text
                    style={[
                      styles.badgeMini,
                      s.status === "completed"
                        ? styles.badgeGreen
                        : styles.badgeBlue,
                    ]}
                  >
                    {s.status === "completed" ? "Đã hoàn thành" : "Sắp tới"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(learner)/course/[id]/lesson",
                    params: { id: String(course.id), lessonId: String(s.id) },
                  } as any)
                }
                style={styles.ghostBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.ghostBtnText}>Vào học</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  meta: { color: "#6B7280", fontSize: 12 },
  sectionTitle: { fontWeight: "700", color: "#111827" },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
  },
  sessionTitle: { color: "#111827", fontWeight: "600" },
  rowGap8: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  badgeMini: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeGreen: { backgroundColor: "#ECFDF5", color: "#065F46" },
  badgeBlue: { backgroundColor: "#EFF6FF", color: "#1E3A8A" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#111827", fontWeight: "600" },
});
