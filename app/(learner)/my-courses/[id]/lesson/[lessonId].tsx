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
          <View style={styles.headerInfo}>
            <Text style={styles.lessonTitle}>{heading}</Text>
            <Text style={styles.lessonSubtitle}>
              Xem video luyện tập và bài quiz của bài học này.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleGoBack}
            activeOpacity={0.8}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
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
  },
  header: {
    gap: 12,
  },
  headerInfo: {
    gap: 4,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  lessonSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  infoButton: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 10,
  },
  fallback: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  fallbackText: {
    textAlign: "center",
    color: "#B91C1C",
    fontWeight: "600",
  },
});

export default LessonResourcesScreen;

