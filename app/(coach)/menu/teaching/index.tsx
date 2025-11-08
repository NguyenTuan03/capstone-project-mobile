import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Course = {
  id: number;
  name: string;
  description: string;
  duration: string;
  sessions: number;
  location: string;
  schedule: string;
  level: string;
  basePrice: number;
  enrolledCount?: number;
  maxStudents?: number;
  status: "available" | "full" | "upcoming" | "ongoing" | "completed";
  rating?: number;
};

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    name: "Pickleball cơ bản",
    description: "Kỹ thuật nền tảng",
    duration: "8 tuần",
    sessions: 16,
    location: "Q.3",
    schedule: "Thứ 3,5 - 19:00-20:30",
    level: "Beginner",
    basePrice: 500000,
    enrolledCount: 6,
    maxStudents: 8,
    status: "ongoing",
    rating: 4.8,
  },
  {
    id: 2,
    name: "Kỹ thuật nâng cao",
    description: "Forehand/Backhand",
    duration: "6 tuần",
    sessions: 12,
    location: "Q.1",
    schedule: "Thứ 2,6 - 18:00-19:30",
    level: "Intermediate",
    basePrice: 700000,
    enrolledCount: 8,
    maxStudents: 8,
    status: "full",
    rating: 4.7,
  },
  {
    id: 3,
    name: "Chiến thuật thi đấu",
    description: "Đánh đôi & chiến thuật",
    duration: "4 tuần",
    sessions: 8,
    location: "Q.7",
    schedule: "Thứ 7 - 15:00-17:00",
    level: "Advanced",
    basePrice: 900000,
    enrolledCount: 0,
    maxStudents: 6,
    status: "upcoming",
  },
];

export default function CoachTeachingScreen() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");

  const courses = useMemo(() => {
    let list = MOCK_COURSES;
    if (level !== "all")
      list = list.filter((c) => c.level.toLowerCase() === level);
    if (status !== "all") list = list.filter((c) => c.status === status);
    if (search)
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [search, level, status]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quản lý khóa học</Text>

      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm kiếm khóa học..."
          style={styles.input}
        />
        <View style={styles.row}>
          <FilterChip
            label="Tất cả trình độ"
            active={level === "all"}
            onPress={() => setLevel("all")}
          />
          <FilterChip
            label="Cơ bản"
            active={level === "beginner"}
            onPress={() => setLevel("beginner")}
          />
          <FilterChip
            label="Trung bình"
            active={level === "intermediate"}
            onPress={() => setLevel("intermediate")}
          />
          <FilterChip
            label="Nâng cao"
            active={level === "advanced"}
            onPress={() => setLevel("advanced")}
          />
        </View>
        <View style={styles.row}>
          <FilterChip
            label="Tất cả trạng thái"
            active={status === "all"}
            onPress={() => setStatus("all")}
          />
          <FilterChip
            label="Còn chỗ"
            active={status === "available"}
            onPress={() => setStatus("available")}
          />
          <FilterChip
            label="Sắp mở"
            active={status === "upcoming"}
            onPress={() => setStatus("upcoming")}
          />
          <FilterChip
            label="Đang diễn ra"
            active={status === "ongoing"}
            onPress={() => setStatus("ongoing")}
          />
          <FilterChip
            label="Đã đầy"
            active={status === "full"}
            onPress={() => setStatus("full")}
          />
          <FilterChip
            label="Đã hoàn thành"
            active={status === "completed"}
            onPress={() => setStatus("completed")}
          />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {courses.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.courseTitle}>{c.name}</Text>
              <Text style={[styles.badge, getStatusStyle(c.status)]}>
                {getStatusText(c.status)}
              </Text>
            </View>
            <Text style={styles.meta}>{c.description}</Text>
            <View style={[styles.rowBetween, { marginTop: 6 }]}>
              <Text style={styles.meta}>
                {c.duration} • {c.sessions} buổi • {c.schedule}
              </Text>
              <Text style={styles.meta}>{c.location}</Text>
            </View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}>
              <Text style={styles.price}>
                {formatPrice(c.basePrice)}đ/người
              </Text>
              <Text style={styles.meta}>
                {c.enrolledCount}/{c.maxStudents} học viên
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primary} activeOpacity={0.9}>
                <Text style={styles.primaryText}>Quản lý</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghost} activeOpacity={0.9}>
                <Text style={styles.ghostText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {courses.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.meta}>Không tìm thấy khóa học</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getStatusText(status: Course["status"]) {
  switch (status) {
    case "ongoing":
      return "Đang diễn ra";
    case "available":
      return "Còn chỗ";
    case "completed":
      return "Đã hoàn thành";
    case "full":
      return "Đã đầy";
    case "upcoming":
      return "Sắp mở";
    default:
      return "Đang mở";
  }
}

function getStatusStyle(status: Course["status"]) {
  switch (status) {
    case "ongoing":
      return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
    case "available":
      return { backgroundColor: "#ECFDF5", color: "#065F46" };
    case "completed":
      return { backgroundColor: "#F3F4F6", color: "#374151" };
    case "full":
      return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    case "upcoming":
      return { backgroundColor: "#EFF6FF", color: "#1E3A8A" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151" };
  }
}

function formatPrice(price: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(price);
  } catch {
    return String(price);
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontWeight: "700", color: "#111827" },
  filters: { gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  chipText: { color: "#111827", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseTitle: { color: "#111827", fontWeight: "700" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 11,
  },
  meta: { color: "#6B7280", fontSize: 12 },
  price: { color: "#065F46", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  primary: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    flex: 1,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  ghost: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    flex: 1,
    backgroundColor: "#fff",
  },
  ghostText: { color: "#111827", fontWeight: "600" },
  emptyBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
});
