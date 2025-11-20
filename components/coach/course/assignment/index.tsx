import { get } from "@/services/http/httpService";
import type { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  courseId: number;
};

const AssignmentTab: React.FC<Props> = ({ courseId }) => {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await get<Session[]>(`/v1/sessions/courses/${courseId}`);
        // Extract sessions from response - API returns array of sessions
        const sessionsData = Array.isArray(res.data) ? res.data : [];
        setSessions(sessionsData);
      } catch {
        Alert.alert("Lỗi", "Không thể tải danh sách bài học của khóa");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [courseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bài học trong khóa</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có bài học nào</Text>
          </View>
        ) : (
          sessions.map((s) => {
            const label = s?.name || `Bài học #${s.sessionNumber}`;
            const dateText = s.scheduleDate
              ? new Date(s.scheduleDate).toLocaleDateString("vi-VN")
              : "—";
            const start = (s.startTime || "").substring(0, 5);
            const end = (s.endTime || "").substring(0, 5);
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.item}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(coach)/course/session/[sessionId]",
                    params: { sessionId: String(s.id) },
                  })
                }
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{label}</Text>
                  <Text style={styles.badge}>{s.status}</Text>
                </View>
                {s.description ? (
                  <Text style={styles.itemDesc}>{s.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>Buổi: {s.sessionNumber}</Text>
                  <Text style={styles.meta}>Ngày: {dateText}</Text>
                  <Text style={styles.meta}>
                    Giờ: {start} - {end}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  {s.videos?.length ? (
                    <Text style={styles.meta}>
                      Video: {s.videos?.length || 0}
                    </Text>
                  ) : null}
                  {s.quizzes?.length ? (
                    <Text style={styles.meta}>
                      Quiz: {s.quizzes?.length || 0}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { padding: 20, alignItems: "center" },
  tabContent: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  item: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  itemDesc: { fontSize: 12, color: "#4B5563", marginBottom: 6 },
  badge: {
    fontSize: 11,
    color: "#2563EB",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  meta: { fontSize: 12, color: "#6B7280" },
});

export default AssignmentTab;
