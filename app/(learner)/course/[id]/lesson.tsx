import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Assignment = {
  id: number;
  type: "quiz" | "video" | "exercise";
  title: string;
  description: string;
  completed?: boolean;
  score?: number;
  questions?: number;
  feedback?: string;
  coachFeedback?: string;
};

type Lesson = {
  id: number;
  title: string;
  date: string;
  status: "completed" | "upcoming";
  location: string;
  assignments: Assignment[];
};

const MOCK_LESSONS: Record<string, Lesson> = {
  "1": {
    id: 1,
    title: "Buổi 1: Giới thiệu và luật chơi cơ bản",
    date: "2024-01-15",
    status: "completed",
    location: "Sân Pickleball Quận 3",
    assignments: [
      {
        id: 1,
        type: "quiz",
        title: "Quiz luật chơi Pickleball",
        description: "Kiểm tra kiến thức về luật chơi cơ bản",
        completed: true,
        score: 85,
        questions: 10,
      },
      {
        id: 2,
        type: "video",
        title: "Video thực hành cầm vợt",
        description: "Tải video kỹ thuật cầm vợt đúng cách",
        completed: true,
        feedback: "Tốt! Kỹ thuật ổn định, cần cải thiện tư thế đứng.",
        coachFeedback: "HLV Nguyễn Văn A",
      },
    ],
  },
  "2": {
    id: 2,
    title: "Buổi 2: Kỹ thuật cầm vợt và đứng",
    date: "2024-01-18",
    status: "completed",
    location: "Sân Pickleball Quận 3",
    assignments: [
      {
        id: 3,
        type: "exercise",
        title: "Bài tập về nhà - Thực hành cầm vợt",
        description: "Chụp ảnh tư thế cầm vợt và gửi cho HLV",
        completed: true,
        feedback: "Tư thế tốt, tiếp tục phát huy!",
      },
      {
        id: 4,
        type: "video",
        title: "Video thực hành đứng và di chuyển",
        description: "Tải video kỹ thuật di chuyển trên sân",
        completed: false,
      },
    ],
  },
  "3": {
    id: 3,
    title: "Buổi 3: Kỹ thuật đánh bóng cơ bản",
    date: "2024-01-22",
    status: "completed",
    location: "Sân Pickleball Quận 3",
    assignments: [
      {
        id: 5,
        type: "quiz",
        title: "Quiz kỹ thuật đánh bóng",
        description: "Kiểm tra kiến thức về các loại cú đánh",
        completed: true,
        score: 78,
        questions: 8,
      },
      {
        id: 6,
        type: "exercise",
        title: "Bài tập forehand/backhand",
        description: "Thực hành 50 cú forehand và 50 cú backhand",
        completed: false,
      },
      {
        id: 7,
        type: "video",
        title: "Video kỹ thuật đánh bóng",
        description: "Tải video kỹ thuật đánh bóng cơ bản",
        completed: false,
      },
    ],
  },
  "4": {
    id: 4,
    title: "Buổi 4: Kỹ thuật giao bóng (Serve)",
    date: "2024-01-25",
    status: "upcoming",
    location: "Sân Pickleball Quận 3",
    assignments: [],
  },
};

const MEET_LINKS: Record<string, string> = {
  "1": "https://meet.google.com/abc-defg-hij",
  "2": "https://meet.google.com/xyz-abcd-efg",
  "3": "https://meet.google.com/qwe-rtyu-iop",
};

export default function LessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, lessonId } = useLocalSearchParams<{
    id: string;
    lessonId: string;
  }>();

  const lesson: Lesson = useMemo(() => {
    const found = MOCK_LESSONS[String(lessonId ?? "1")];
    return found ?? MOCK_LESSONS["1"];
  }, [lessonId]);

  const meetUrl = useMemo(
    () => MEET_LINKS[String(id)] ?? MEET_LINKS["1"],
    [id]
  );

  const [isInVideoConference, setIsInVideoConference] = useState(false);
  const [attended, setAttended] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(
    null
  );

  const joinMeet = async () => {
    try {
      await Linking.openURL(meetUrl);
      setIsInVideoConference(true);
    } catch {}
  };

  const leaveMeet = () => setIsInVideoConference(false);

  const AssignmentRow = ({ a }: { a: Assignment }) => {
    const isDone = !!a.completed;
    const actionLabel =
      a.type === "quiz"
        ? isDone
          ? "Xem lại quiz"
          : "Làm quiz"
        : a.type === "video"
        ? isDone
          ? "Cập nhật video"
          : "Tải video"
        : isDone
        ? "Cập nhật bài"
        : "Nộp bài";
    return (
      <View style={styles.assignmentCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.assignmentTitle}>{a.title}</Text>
          <Text style={styles.meta}>{a.description}</Text>
          {isDone && a.feedback && (
            <View style={styles.feedbackBox}>
              <Text style={[styles.meta, { color: "#1E3A8A" }]}>
                Phản hồi từ {a.coachFeedback ?? "HLV"}:
              </Text>
              <Text style={[styles.meta, { color: "#1E3A8A" }]}>
                {a.feedback}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setActiveAssignment(a)}
          style={styles.primarySm}
          activeOpacity={0.9}
        >
          <Text style={styles.primarySmText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 50 },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <View style={{ width: 64 }} />
      </View>

      {/* Session Info */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.meta}>{lesson.location}</Text>
          <Text
            style={[
              styles.badgeMini,
              lesson.status === "completed"
                ? styles.badgeGreen
                : styles.badgeBlue,
            ]}
          >
            {lesson.status === "completed" ? "Đã hoàn thành" : "Sắp tới"}
          </Text>
        </View>
        <Text style={[styles.meta, { marginTop: 6 }]}>
          Ngày học: {lesson.date}
        </Text>
      </View>

      {/* Video Conference */}
      {lesson.status === "upcoming" && (
        <View
          style={[
            styles.card,
            { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
          ]}
        >
          {!isInVideoConference ? (
            <TouchableOpacity
              onPress={joinMeet}
              style={styles.primaryBtn}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>
                Tham gia video conference
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>Đang trong cuộc họp</Text>
              </View>
              <TouchableOpacity
                onPress={leaveMeet}
                style={styles.ghostBtn}
                activeOpacity={0.9}
              >
                <Text style={styles.ghostBtnText}>Rời khỏi cuộc họp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Attendance (completed but not marked) */}
      {lesson.status === "completed" && !attended && (
        <View
          style={[
            styles.card,
            { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.meta, { color: "#9A3412" }]}>
              Buổi học đã qua • Đánh dấu nếu bạn đã tham dự
            </Text>
            <TouchableOpacity
              onPress={() => setAttended(true)}
              style={styles.primarySm}
              activeOpacity={0.9}
            >
              <Text style={styles.primarySmText}>Đã tham dự</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Assignments */}
      {lesson.assignments.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bài tập & hoạt động</Text>
          <View style={{ gap: 10 }}>
            {lesson.assignments.map((a) => (
              <AssignmentRow key={a.id} a={a} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.meta}>Chưa có bài tập cho bài học này.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { color: "#374151" },
  headerTitle: { fontWeight: "700", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  sectionTitle: { fontWeight: "700", color: "#111827", marginBottom: 8 },
  meta: { color: "#6B7280", fontSize: 12 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Conference & actions
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#111827", fontWeight: "600" },
  noticeBox: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  noticeText: { color: "#1D4ED8", fontWeight: "700" },

  // Badges
  badgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 11,
  },
  badgeGreen: { backgroundColor: "#ECFDF5", color: "#065F46" },
  badgeBlue: { backgroundColor: "#EFF6FF", color: "#1E3A8A" },

  // Assignments
  assignmentCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  assignmentTitle: { color: "#111827", fontWeight: "600" },
  primarySm: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primarySmText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  feedbackBox: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
});
