import { BuildExercise } from "@/helper/BuildExercise";
import { get } from "@/services/http/httpService";
import type { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatTime = (time?: string | null) => {
  if (!time) return "—";
  return time.substring(0, 5);
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
};

const SessionDetailScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [learnerVideos, setLearnerVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      try {
        setLoading(true);
        const res = await get<Session>(`/v1/sessions/${sessionId}`);
        setSession(res.data);
      } catch {
        Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const exercises = useMemo(
    () => (session ? BuildExercise(session) : []),
    [session]
  );
  const videoExercises = useMemo(
    () => exercises.filter((ex) => ex.type === "video"),
    [exercises]
  );

  useEffect(() => {
    const fetchLearnerVideos = async () => {
      if (!sessionId) return;
      try {
        const res = await get<any[]>(`/v1/learner-videos?sessionId=${sessionId}`);
        setLearnerVideos(Array.isArray(res.data) ? res.data : []);
      } catch {
        // ignore
      }
    };
    fetchLearnerVideos();
  }, [sessionId]);

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
          {session?.lesson?.name || session?.name || "Chi tiết buổi học"}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : !session ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Không tìm thấy buổi học</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin buổi học</Text>
            <InfoRow label="Tên bài học" value={session.lesson?.name} />
            <InfoRow
              label="Mô tả"
              value={session.lesson?.description || session.description}
              multiline
            />
            <InfoRow label="Buổi số" value={String(session.sessionNumber)} />
            <InfoRow label="Ngày" value={formatDate(session.scheduleDate)} />
            <InfoRow
              label="Thời gian"
              value={`${formatTime(session.startTime)} - ${formatTime(
                session.endTime
              )}`}
            />
            <InfoRow
              label="Trạng thái"
              value={session.status || "—"}
              valueStyle={{ color: "#059669", fontWeight: "600" }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bài tập{" "}
              {videoExercises.length ? `(${videoExercises.length})` : ""}
            </Text>

            {videoExercises.length ? (
              videoExercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseWrap}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="film-outline" size={20} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseTitle} numberOfLines={1}>
                        {ex.title}
                      </Text>
                      {ex.subtitle ? (
                        <Text style={styles.exerciseSubtitle} numberOfLines={2}>
                          {ex.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    {!!ex.dueDate && (
                      <View
                        style={[styles.badge, { backgroundColor: "#EFF6FF" }]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#2563EB"
                        />
                        <Text style={[styles.badgeText, { color: "#2563EB" }]}>
                          Hạn: {formatDate(ex.dueDate)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[styles.badge, { backgroundColor: "#F3E8FF" }]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={12}
                        color="#7C3AED"
                      />
                      <Text style={[styles.badgeText, { color: "#7C3AED" }]}>
                        {learnerVideos.length} bài nộp
                      </Text>
                    </View>
                    {ex.hasSample && (
                      <View
                        style={[styles.badge, { backgroundColor: "#ECFDF5" }]}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={12}
                          color="#059669"
                        />
                        <Text style={[styles.badgeText, { color: "#059669" }]}>
                          Có video mẫu
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    {learnerVideos.length > 0 ? (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnPrimaryPurple]}
                        onPress={() =>
                          router.push({
                            pathname:
                              "/(coach)/course/session/submissions/[sessionId]",
                            params: { sessionId: String(sessionId) },
                          })
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#fff"
                        />
                        <Text style={[styles.btnText, { color: "#fff" }]}>
                          {`Xem Bài Nộp (${learnerVideos.length})`}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[
                          styles.btn,
                          styles.btnPrimaryPurple,
                          { backgroundColor: "#9CA3AF" },
                        ]}
                      >
                        <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                          Chưa có bài nộp
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="document-text-outline"
                  size={36}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video bài học</Text>
            {session.lesson?.videos && session.lesson.videos.length > 0 ? (
              session.lesson.videos.map((video) => (
                <View key={video.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{video.title}</Text>
                  {video.description ? (
                    <Text style={styles.cardDescription}>
                      {video.description}
                    </Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    {video.duration != null ? (
                      <Text style={styles.meta}>⏱ {video.duration} phút</Text>
                    ) : null}
                    {video.drillName ? (
                      <Text style={styles.meta}>🎯 {video.drillName}</Text>
                    ) : null}
                  </View>
                  {video.drillDescription ? (
                    <Text style={styles.meta}>{video.drillDescription}</Text>
                  ) : null}
                  {video.drillPracticeSets ? (
                    <Text style={styles.meta}>{video.drillPracticeSets}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={36} color="#9CA3AF" />
                <Text style={styles.emptyText}>Chưa có video bài tập</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  multiline,
  valueStyle,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
  valueStyle?: any;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[styles.infoValue, valueStyle]}
      numberOfLines={multiline ? undefined : 2}
    >
      {value || "—"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardDescription: {
    fontSize: 12,
    color: "#4B5563",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  exerciseWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  exerciseSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnGhostGreen: {
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#F0FDF4",
  },
  btnPrimaryPurple: {
    backgroundColor: "#7C3AED",
  },
  btnText: { fontSize: 13, fontWeight: "700" },
});

export default SessionDetailScreen;
