import { get } from "@/services/http/httpService";
import type { Session } from "@/types/session";
import type { LearnerVideo, VideoType } from "@/types/video";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN"
  )}`;
};

const SubmissionListScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [videos, setVideos] = useState<LearnerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await get<LearnerVideo[]>(
        `/v1/learner-videos?sessionId=${sessionId}`
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setVideos(list);
      if (list.length > 0) {
        setSession(list[0].session);
      } else {
        const sessionRes = await get<Session>(`/v1/sessions/${sessionId}`);
        setSession(sessionRes.data);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể tải danh sách bài nộp");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const groupedByLearner = useMemo(() => {
    return videos.reduce<Record<string, LearnerVideo[]>>((acc, video) => {
      const key = video.user?.fullName || `Learner-${video.user?.id ?? "N/A"}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {});
  }, [videos]);

  const learnerEntries = useMemo(
    () => Object.entries(groupedByLearner),
    [groupedByLearner]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session?.lesson?.name
            ? `Chấm bài - ${session.lesson.name}`
            : "Chấm bài"}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchVideos}>
          <Ionicons name="refresh" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : learnerEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color="#9CA3AF"
          />
          <Text style={styles.emptyText}>Chưa có học viên nào nộp bài</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {learnerEntries.map(([learnerName, learnerVideos]) => (
            <View key={learnerName} style={styles.section}>
              <Text style={styles.sectionTitle}>{learnerName}</Text>
              {learnerVideos.map((video) => (
                <SubmissionCard
                  key={video.id}
                  video={video}
                  sessionId={sessionId ? String(sessionId) : undefined}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const SubmissionCard = ({
  video,
  sessionId,
}: {
  video: LearnerVideo;
  sessionId?: string;
}) => {
  const router = useRouter();
  const lessonVideo: VideoType | undefined =
    video.session.lesson?.videos?.[0] ?? undefined;

  const handleNavigate = () => {
    const effectiveSessionId = sessionId ?? String(video.session?.id ?? "");
    if (!video.publicUrl || !effectiveSessionId) {
      return;
    }

    router.push({
      pathname:
        "/(coach)/course/session/submissions/[sessionId]/[submissionId]",
      params: {
        sessionId: effectiveSessionId,
        submissionId: String(video.id),
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="videocam-outline" size={18} color="#7C3AED" />
        <Text style={styles.cardTitle}>Bài nộp #{video.id}</Text>
      </View>
      <Text style={styles.metaText}>
        Thời gian nộp: {formatDateTime(video.createdAt)}
      </Text>
      {video.publicUrl ? (
        <TouchableOpacity style={styles.linkButton} onPress={handleNavigate}>
          <Ionicons name="sparkles" size={14} color="#7C3AED" />
          <Ionicons name="play" size={14} color="#059669" />
          <Text style={styles.linkText}>Chấm bài</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.metaText}>Video đang xử lý</Text>
      )}
      {lessonVideo ? (
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>Video hướng dẫn:</Text>
          <Text style={styles.metaText}>{lessonVideo.title}</Text>
          {lessonVideo.drillName ? (
            <Text style={styles.metaText}>
              Drill: {lessonVideo.drillName} - {lessonVideo.drillPracticeSets}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { padding: 8 },
  refreshButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, color: "#6B7280" },
  scroll: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  metaText: { fontSize: 12, color: "#6B7280" },
  lessonInfo: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    gap: 4,
  },
  lessonTitle: { fontSize: 12, color: "#374151", fontWeight: "600" },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
  },
  linkText: { fontSize: 12, color: "#059669", fontWeight: "600" },
});

export default SubmissionListScreen;
