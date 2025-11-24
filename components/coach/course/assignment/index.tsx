import { get } from "@/services/http/httpService";
import type { Session } from "@/types/session";
import { formatStatus } from "@/utils/SessionFormat";
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
            const statusInfo = formatStatus(s.status);

            return (
              <TouchableOpacity
                key={s.id}
                style={styles.item}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(coach)/course/session/[sessionId]",
                    params: {
                      sessionId: String(s.id),
                      sessionData: JSON.stringify(s),
                    },
                  } as any)
                }
              >
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={styles.sessionNumber}>
                      Buổi {s.sessionNumber}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: statusInfo.bg,
                        borderColor: statusInfo.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: statusInfo.color }]}
                    >
                      {statusInfo.text}
                    </Text>
                  </View>
                </View>

                {s.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {s.description}
                  </Text>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.metaContainer}>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.meta}>{dateText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.meta}>
                      {start} - {end}
                    </Text>
                  </View>
                </View>

                {(s.video || s.quiz) && (
                  <View style={styles.resourcesContainer}>
                    {s.video && (
                      <View style={styles.resourceTag}>
                        <Ionicons name="videocam" size={12} color="#4F46E5" />
                        <Text style={styles.resourceText}>Video</Text>
                      </View>
                    )}
                    {s.quiz && (
                      <View
                        style={[
                          styles.resourceTag,
                          { backgroundColor: "#ECFDF5" },
                        ]}
                      >
                        <Ionicons
                          name="help-circle"
                          size={12}
                          color="#059669"
                        />
                        <Text
                          style={[styles.resourceText, { color: "#059669" }]}
                        >
                          Quiz
                        </Text>
                      </View>
                    )}
                  </View>
                )}
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
  tabContent: { flex: 1, backgroundColor: "#F9FAFB" },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sessionNumber: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  itemDesc: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  metaContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  resourcesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  resourceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resourceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
});

export default AssignmentTab;
