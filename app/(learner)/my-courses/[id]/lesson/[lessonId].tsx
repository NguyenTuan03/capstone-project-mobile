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
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    gap: 10,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  headerInfo: {
    gap: 6,
  },
  lessonTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    letterSpacing: 0.2,
    lineHeight: 18,
    fontWeight: "400",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 2,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  infoButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#059669",
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
  },
  infoButtonText: {
    color: "#059669",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  fallback: {
    padding: 12,
    borderRadius: 9,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },
  fallbackText: {
    textAlign: "center",
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
});

export default LessonResourcesScreen;

