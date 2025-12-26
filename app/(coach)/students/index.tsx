import LearnerProgressModal from "@/components/coach/LearnerProgressModal";
import { getAllCoachLearnerProgress } from "@/services/learner.service";
import { CourseStatus } from "@/types/course";
import { LearnerProgress } from "@/types/learner-progress";
import { PickleballLevel } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CoachStudentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState<LearnerProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<CourseStatus>(CourseStatus.ON_GOING);
  const [selectedLearner, setSelectedLearner] =
    useState<LearnerProgress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const data = await getAllCoachLearnerProgress(status);
      setLearners(data);
      if (selectedLearner) {
        const updatedLearner = data.find((l) => l.id === selectedLearner.id);
        if (updatedLearner) {
          setSelectedLearner(updatedLearner);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLearners();
  };

  const getLevelLabel = (level?: PickleballLevel) => {
    switch (level) {
      case PickleballLevel.BEGINNER:
        return "Cơ bản";
      case PickleballLevel.INTERMEDIATE:
        return "Trung bình";
      case PickleballLevel.ADVANCED:
        return "Nâng cao";
      default:
        return "Chưa xác định";
    }
  };

  const getProgressPercentage = (
    current: PickleballLevel,
    goal: PickleballLevel
  ) => {
    const levels = [
      PickleballLevel.BEGINNER,
      PickleballLevel.INTERMEDIATE,
      PickleballLevel.ADVANCED,
    ];
    const currentIndex = levels.indexOf(current);
    const goalIndex = levels.indexOf(goal);

    if (currentIndex === -1 || goalIndex === -1) return 0;
    if (currentIndex >= goalIndex) return 100;

    return ((currentIndex + 1) / (goalIndex + 1)) * 100;
  };

  const renderLearnerCard = ({ item }: { item: LearnerProgress }) => {
    const learnerData = Array.isArray(item.user.learner)
      ? item.user.learner[0]
      : item.user.learner;

    const skillLevel = learnerData?.skillLevel ?? PickleballLevel.BEGINNER;
    const learningGoal =
      learnerData?.learningGoal ?? PickleballLevel.INTERMEDIATE;
    const progress = getProgressPercentage(skillLevel, learningGoal);

    return (
      <TouchableOpacity
        style={[styles.card]}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedLearner(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.user.fullName?.charAt(0) || "U"}
              </Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.userName}>{item.user.fullName}</Text>
              <Text style={styles.courseName} numberOfLines={2}>
                {item.course?.name}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              status === CourseStatus.COMPLETED && {
                backgroundColor: "#DCFCE7",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                status === CourseStatus.COMPLETED && { color: "#059669" },
              ]}
            >
              {status === CourseStatus.ON_GOING ? "Đang học" : "Hoàn thành"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="sparkles" size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.statValue}>{item.avgAiAnalysisScore}</Text>
              <Text style={styles.statLabel}>AI</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document-text" size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.statValue}>{item.avgQuizScore}</Text>
              <Text style={styles.statLabel}>Quiz</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.statValue}>
                {item.sessionsCompleted}/{item.totalSessions}
              </Text>
              <Text style={styles.statLabel}>Buổi học</Text>
            </View>
          </View>
        </View>

        {/* <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.levelLabel}>{getLevelLabel(skillLevel)}</Text>
            <Text style={styles.levelLabel}>{getLevelLabel(learningGoal)}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Mục tiêu: {getLevelLabel(learningGoal)}
          </Text>
        </View> */}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Học viên của tôi</Text>
            <Text style={styles.headerSubtitle}>
              {learners.length} học viên{" "}
              {status === CourseStatus.ON_GOING ? "đang học" : "đã hoàn thành"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            status === CourseStatus.ON_GOING && styles.activeFilterTab,
          ]}
          onPress={() => setStatus(CourseStatus.ON_GOING)}
        >
          <Text
            style={[
              styles.filterText,
              status === CourseStatus.ON_GOING && styles.activeFilterText,
            ]}
          >
            Đang học
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            status === CourseStatus.COMPLETED && styles.activeFilterTab,
          ]}
          onPress={() => setStatus(CourseStatus.COMPLETED)}
        >
          <Text
            style={[
              styles.filterText,
              status === CourseStatus.COMPLETED && styles.activeFilterText,
            ]}
          >
            Đã hoàn thành
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={learners}
          renderItem={renderLearnerCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>
                {status === CourseStatus.ON_GOING
                  ? "Chưa có học viên đang học"
                  : "Chưa có học viên đã hoàn thành"}
              </Text>
              <Text style={styles.emptyDescription}>
                {status === CourseStatus.ON_GOING
                  ? "Học viên sẽ xuất hiện ở đây khi họ đăng ký khóa học của bạn"
                  : "Học viên sẽ xuất hiện ở đây khi họ hoàn thành khóa học"}
              </Text>
            </View>
          }
        />
      )}
      <LearnerProgressModal
        visible={modalVisible}
        learner={selectedLearner}
        onClose={() => {
          setModalVisible(false);
          setSelectedLearner(null);
        }}
        onReload={fetchLearners}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeFilterTab: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 12,
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    fontWeight: "500",
  },
  statusBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
});
