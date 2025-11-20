import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LessonResourcesTabs from "../../../../../components/learner/lesson/LessonResourcesTabs";

const LessonResourcesScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    lessonId?: string;
    lessonName?: string;
    sessionId?: string;
  }>();

  const lessonId = params.lessonId ? Number(params.lessonId) : null;
  const lessonName = params.lessonName;
  const sessionId = params.sessionId ? Number(params.sessionId) : undefined;

  const heading = useMemo(() => {
    if (lessonName && lessonName.trim().length > 0) return lessonName;
    if (lessonId) return `Bài học ${lessonId}`;
    return "Bài học";
  }, [lessonId, lessonName]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.lessonTitle}>{heading}</Text>
            <Text style={styles.lessonSubtitle}>
              Xem video luyện tập và bài quiz của bài học này.
            </Text>
          </View>
        </View>

        {lessonId ? (
          <LessonResourcesTabs lessonId={lessonId} sessionId={sessionId} />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              Không tìm thấy thông tin bài học.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 26,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "400",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  fallback: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
    alignItems: "center",
  },
  fallbackText: {
    textAlign: "center",
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default LessonResourcesScreen;
