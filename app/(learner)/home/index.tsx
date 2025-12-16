import HowToPlayModal from "@/components/learner/HowToPlayModal";
import HowToPlayPreview from "@/components/learner/HowToPlayPreview";
import {
  LearnerProgress
} from "@/types/learner-progress";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import learnerService from "../../../services/learnerService";
import sessionService from "../../../services/sessionService";
import { CalendarSession } from "../../../types/session";
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalAiFeedbacks, setTotalAiFeedbacks] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [progresses, setProgresses] = useState<LearnerProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [howToPlayModalVisible, setHowToPlayModalVisible] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisDetailModalVisible, setAnalysisDetailModalVisible] = useState(false);
  const [selectedProgress, setSelectedProgress] =
    useState<LearnerProgress | null>(null);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    motivational: true,
    strengths: false,
    improvements: false,
    performance: true,
    recommendations: false,
  });

  const loadTodaySessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const today = getTodayDate();
      const data = await sessionService.getSessionsForWeeklyCalendar({
        startDate: today,
        endDate: today,
      });
      setSessions(data);
    } catch (error) {
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [courses, feedbacks] = await Promise.all([
        learnerService.getTotalCourses(),
        learnerService.getTotalAiFeedbacks(),
      ]);
      setTotalCourses(courses);
      setTotalAiFeedbacks(feedbacks);
    } catch (error) {
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const data = await learnerService.getLearnerProgresses();
      setProgresses(data);
    } catch (error) {
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const handleProgressClick = async (progress: LearnerProgress) => {
    setSelectedProgress(progress);
    setSelectedAnalysisIndex(0); // Reset to first analysis
    setAnalysisModalVisible(true);
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedProgress) return;

    setGeneratingAnalysis(true);
    try {
      await learnerService.generateProgressAnalysis(selectedProgress.id);
      // Reload progress data to get the new analysis
      const data = await learnerService.getLearnerProgresses();
      setProgresses(data);
      // Update selected progress with new data
      const updatedProgress = data.find((p) => p.id === selectedProgress.id);
      if (updatedProgress) {
        setSelectedProgress(updatedProgress);
        // Set to the latest (newest) analysis
        if (
          updatedProgress.aiLearnerProgressAnalyses &&
          updatedProgress.aiLearnerProgressAnalyses.length > 0
        ) {
          setSelectedAnalysisIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to generate analysis:", error);
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleNextAnalysis = () => {
    if (!selectedProgress?.aiLearnerProgressAnalyses) return;
    if (
      selectedAnalysisIndex <
      selectedProgress.aiLearnerProgressAnalyses.length - 1
    ) {
      setSelectedAnalysisIndex(selectedAnalysisIndex + 1);
    }
  };

  const handlePreviousAnalysis = () => {
    if (selectedAnalysisIndex > 0) {
      setSelectedAnalysisIndex(selectedAnalysisIndex - 1);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    loadTodaySessions();
    loadStats();
    loadProgress();
  }, [loadTodaySessions, loadStats, loadProgress]);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Card */}
        <View style={[styles.card, styles.welcomeCard]}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
              <Text style={styles.welcomeSubtitle}>
                Tiếp tục hành trình Pickleball của bạn
              </Text>
            </View>
            {/* <View style={styles.streakBox}>
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakText}>ngày liên tục</Text>
            </View> */}
          </View>
        </View>

        {/* How to Play Modal */}
        <HowToPlayPreview onPress={() => setHowToPlayModalVisible(true)} />

        <HowToPlayModal
          visible={howToPlayModalVisible}
          onClose={() => setHowToPlayModalVisible(false)}
        />

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="book" size={20} color="#059669" />
            </View>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Text style={styles.statNumber}>{totalCourses}</Text>
                <Text style={styles.statLabel}>Khóa học</Text>
              </>
            )}
          </View>
          <View style={[styles.card, styles.statCard]}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="sparkles" size={20} color="#059669" />
            </View>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Text style={styles.statNumber}>{totalAiFeedbacks}</Text>
                <Text style={styles.statLabel}>Phân tích AI</Text>
              </>
            )}
          </View>
        </View>

        {/* Learning Progress Section */}
        {!loadingProgress && progresses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tiến độ học tập</Text>
            {progresses.map((progress, index) => {
              const progressPercent = Math.round(
                (progress.sessionsCompleted / progress.totalSessions) * 100
              );
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.progressItem}
                  onPress={() => handleProgressClick(progress)}
                  activeOpacity={0.7}
                >
                  <View style={styles.progressHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.progressTitle}>
                        {progress.course.name}
                      </Text>
                      <Text style={styles.progressSessionCount}>
                        {progress.sessionsCompleted}/{progress.totalSessions}{" "}
                        buổi hoàn thành
                      </Text>
                    </View>
                    <View style={styles.progressPercentBadge}>
                      <Text style={styles.progressPercent}>
                        {progressPercent}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercent}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreItem}>
                      <View style={styles.scoreIconBox}>
                        <Ionicons name="star" size={18} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scoreLabel}>Phân tích AI</Text>
                        <Text style={styles.scoreValue}>
                          {progress.avgAiAnalysisScore}/100
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scoreItem}>
                      <View style={styles.scoreIconBox}>
                        <Ionicons
                          name="checkmark-done"
                          size={18}
                          color="#059669"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scoreLabel}>Điểm Quiz</Text>
                        <Text style={styles.scoreValue}>
                          {progress.avgQuizScore}/100
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* How to Play Section */}

        {/* AI Analysis Quick */}
        {/* <View style={[styles.card, styles.aiCard]}>
          <View style={styles.aiRow}>
            <View style={styles.aiIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Phân tích kỹ thuật AI</Text>
              <Text style={styles.aiSub}>
                2 video đã phân tích • Xem chi tiết
              </Text>
            </View>
          </View>
        </View>  */}

        {/* Today's Sessions */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Buổi học hôm nay</Text>
            <TouchableOpacity
              onPress={() => router.push("/(learner)/my-courses")}
            >
              <Text style={styles.viewAllText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loadingSessions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.loadingText}>Đang tải buổi học...</Text>
            </View>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                onPress={() =>
                  router.push(
                    `/(learner)/my-courses/${session.courseId}` as any
                  )
                }
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{session.courseName}</Text>
                  <Text style={styles.sessionCoach}>Buổi {session.name}</Text>
                  <View style={styles.sessionMetaRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.sessionMeta}>
                      {session.startTime} - {session.endTime}
                    </Text>
                    {session.course?.court?.name && (
                      <>
                        <Text style={styles.sessionMeta}>•</Text>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.sessionMeta}>
                          {session.course.court.name}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                Không có buổi học hôm nay
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Hãy nghỉ ngơi và chuẩn bị cho các buổi học sắp tới!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Progress Analysis Modal */}
      <Modal
        visible={analysisModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAnalysisModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết tiến độ học tập</Text>
            <TouchableOpacity
              onPress={() => setAnalysisModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedProgress ? (
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
            >
              {/* Course Info & Progress Details */}
              <View style={styles.progressDetailCard}>
                <Text style={styles.progressCourseName}>
                  {selectedProgress.course.name}
                </Text>

                {/* Progress Stats */}
                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                    <View style={styles.progressStatTextContainer}>
                      <Text style={styles.progressStatLabel}>Buổi học</Text>
                      <Text style={styles.progressStatValue}>
                        {selectedProgress.sessionsCompleted}/
                        {selectedProgress.totalSessions}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressStatItem}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <View style={styles.progressStatTextContainer}>
                      <Text style={styles.progressStatLabel}>Điểm Quiz TB</Text>
                      <Text style={styles.progressStatValue}>
                        {selectedProgress.avgQuizScore.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Ionicons name="analytics" size={20} color="#8B5CF6" />
                    <View style={styles.progressStatTextContainer}>
                      <Text style={styles.progressStatLabel}>Điểm AI TB</Text>
                      <Text style={styles.progressStatValue}>
                        {selectedProgress.avgAiAnalysisScore.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressStatItem}>
                    <Ionicons
                      name={
                        selectedProgress.status === "COMPLETED"
                          ? "checkmark-circle"
                          : "time"
                      }
                      size={20}
                      color={
                        selectedProgress.status === "COMPLETED"
                          ? "#10B981"
                          : "#6B7280"
                      }
                    />
                    <View style={styles.progressStatTextContainer}>
                      <Text style={styles.progressStatLabel}>Trạng thái</Text>
                      <Text style={styles.progressStatValue}>
                        {selectedProgress.status === "COMPLETED"
                          ? "Hoàn thành"
                          : selectedProgress.status === "IN_PROGRESS"
                          ? "Đang học"
                          : "Đã bỏ"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ marginTop: 12 }}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${
                            (selectedProgress.sessionsCompleted /
                              selectedProgress.totalSessions) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressBarLabel}>
                    {Math.round(
                      (selectedProgress.sessionsCompleted /
                        selectedProgress.totalSessions) *
                        100
                    )}
                    % hoàn thành
                  </Text>
                </View>
              </View>

              {/* AI Analysis Section */}
              {/* Analysis List Header - Outside collapsible group */}
              {selectedProgress.aiLearnerProgressAnalyses &&
                selectedProgress.aiLearnerProgressAnalyses.length > 0 && (
                  <View style={styles.analysisListHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                      <Text style={styles.analysisListTitle}>
                        Danh sách phân tích AI
                      </Text>
                      <View style={styles.analysisCountBadge}>
                        <Text style={styles.analysisCountText}>
                          {selectedAnalysisIndex + 1}/{selectedProgress.aiLearnerProgressAnalyses.length}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

              {/* Navigation Controls - Outside collapsible group */}
              {selectedProgress.aiLearnerProgressAnalyses &&
                selectedProgress.aiLearnerProgressAnalyses.length > 1 && (
                  <View style={styles.analysisNavigation}>
                    <TouchableOpacity
                      onPress={handlePreviousAnalysis}
                      disabled={selectedAnalysisIndex === 0}
                      style={[
                        styles.navButton,
                        selectedAnalysisIndex === 0 &&
                          styles.navButtonDisabled,
                      ]}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={
                          selectedAnalysisIndex === 0
                            ? "#9CA3AF"
                            : "#059669"
                        }
                      />
                      <Text
                        style={[
                          styles.navButtonText,
                          selectedAnalysisIndex === 0 &&
                            styles.navButtonTextDisabled,
                        ]}
                      >
                        Trước
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleNextAnalysis}
                      disabled={
                        selectedAnalysisIndex ===
                        selectedProgress.aiLearnerProgressAnalyses.length -
                          1
                      }
                      style={[
                        styles.navButton,
                        selectedAnalysisIndex ===
                          selectedProgress.aiLearnerProgressAnalyses
                            .length -
                            1 && styles.navButtonDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.navButtonText,
                          selectedAnalysisIndex ===
                            selectedProgress.aiLearnerProgressAnalyses
                              .length -
                              1 && styles.navButtonTextDisabled,
                        ]}
                      >
                        Sau
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={
                          selectedAnalysisIndex ===
                          selectedProgress.aiLearnerProgressAnalyses
                            .length -
                            1
                            ? "#9CA3AF"
                            : "#059669"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

              {/* AI Analysis Title Card - Click to open detail modal */}
              {selectedProgress.aiLearnerProgressAnalyses &&
                selectedProgress.aiLearnerProgressAnalyses.length > 0 ? (
                <>
                  {(() => {
                    const currentAnalysis =
                      selectedProgress.aiLearnerProgressAnalyses[
                        selectedAnalysisIndex
                      ];
                    return (
                      <TouchableOpacity
                        style={styles.analysisTitleContainer}
                        onPress={() => setAnalysisDetailModalVisible(true)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.analysisTitleText}>
                            {currentAnalysis.title}
                          </Text>
                          <Text style={styles.analysisDate}>
                            {new Date(
                              currentAnalysis.createdAt
                            ).toLocaleDateString("vi-VN")}
                          </Text>
                        </View>
                        <Ionicons
                          name="eye"
                          size={24}
                          color="#5B21B6"
                        />
                      </TouchableOpacity>
                    );
                  })()}
                  
                  {/* Info text about generating new analysis */}
                  <View style={styles.analysisInfoCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                    <Text style={styles.analysisInfoText}>
                      Bạn có thể tạo phân tích AI mới sau khi hoàn thành một buổi học
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.noAnalysisContainer}>
                      <Ionicons name="analytics-outline" size={48} color="#C4B5FD" />
                      <Text style={styles.noAnalysisText}>
                        Chưa có phân tích AI
                      </Text>
                      <Text style={styles.noAnalysisSubtext}>
                        {selectedProgress.canGenerateAIAnalysis
                          ? "AI sẽ phân tích kết quả quiz, video và đưa ra đề xuất cải thiện"
                          : "Hoàn thành thêm bài tập để tạo phân tích AI"}
                      </Text>
                      {selectedProgress.canGenerateAIAnalysis && (
                        <TouchableOpacity
                          style={styles.generateButton}
                          onPress={handleGenerateAnalysis}
                          disabled={generatingAnalysis}
                        >
                          {generatingAnalysis ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                              <Text style={styles.generateButtonText}>
                                Tạo phân tích AI
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* AI Analysis Detail Modal */}
      <Modal
        visible={analysisDetailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAnalysisDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailModalHeader}>
            <View style={styles.detailModalHeaderContent}>
              <View style={styles.detailModalTitleRow}>
                <View style={styles.aiIconLarge}>
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.detailModalTitle}>Chi tiết phân tích AI</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAnalysisDetailModalVisible(false)}
                style={styles.detailModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedProgress?.aiLearnerProgressAnalyses &&
            selectedProgress.aiLearnerProgressAnalyses.length > 0 ? (
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
            >
              {(() => {
                const currentAnalysis =
                  selectedProgress.aiLearnerProgressAnalyses[
                    selectedAnalysisIndex
                  ];
                return (
                  <>
                    {/* Analysis Title Card */}
                    <View style={styles.detailTitleCard}>
                      <Text style={styles.detailTitle}>
                        {currentAnalysis.title}
                      </Text>
                      <View style={styles.detailDateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
                        <Text style={styles.detailDate}>
                          {new Date(
                            currentAnalysis.createdAt
                          ).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>

                    {/* Quiz & AI Performance */}
                    <View style={styles.detailPerformanceRow}>
                      <View style={styles.detailPerformanceCard}>
                        <View style={[styles.performanceIconBox, { backgroundColor: "#F3E8FF" }]}>
                          <Ionicons name="help-circle" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={styles.detailPerformanceLabel}>Điểm Quiz TB</Text>
                        <Text style={[styles.detailPerformanceScore, { color: "#8B5CF6" }]}>
                          {currentAnalysis.quizPerformanceAnalysis.averageScore}
                        </Text>
                        <Text style={styles.detailPerformanceMax}>/100</Text>
                      </View>

                      <View style={styles.detailPerformanceCard}>
                        <View style={[styles.performanceIconBox, { backgroundColor: "#F3E8FF" }]}>
                          <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={styles.detailPerformanceLabel}>Điểm AI TB</Text>
                        <Text style={[styles.detailPerformanceScore, { color: "#8B5CF6" }]}>
                          {currentAnalysis.videoPerformanceAnalysis.averageScore}
                        </Text>
                        <Text style={styles.detailPerformanceMax}>/100</Text>
                      </View>
                    </View>

                    {/* Overall Summary */}
                    <View style={styles.detailSection}>
                      <TouchableOpacity
                        style={styles.detailSectionHeader}
                        onPress={() => toggleSection("summary")}
                        activeOpacity={0.7}
                      >
                        <View style={styles.detailSectionTitleRow}>
                          <View style={[styles.sectionIconBox, { backgroundColor: "#DCFCE7" }]}>
                            <Ionicons
                              name="document-text"
                              size={18}
                              color="#059669"
                            />
                          </View>
                          <Text style={styles.detailSectionTitle}>
                            Tổng quan
                          </Text>
                        </View>
                        <Ionicons
                          name={expandedSections.summary ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                      {expandedSections.summary && (
                        <View style={styles.detailSectionContent}>
                          <Text style={styles.detailSummaryText}>
                            {currentAnalysis.overallSummary}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Motivational Message */}
                    {currentAnalysis.motivationalMessage && (
                      <View style={styles.motivationalCard}>
                        <TouchableOpacity
                          style={styles.detailSectionHeader}
                          onPress={() => toggleSection("motivational")}
                          activeOpacity={0.7}
                        >
                          <View style={styles.detailSectionTitleRow}>
                            <View style={[styles.sectionIconBox, { backgroundColor: "#FEE2E2" }]}>
                              <Ionicons name="heart" size={18} color="#EF4444" />
                            </View>
                            <Text style={styles.detailSectionTitle}>
                              Lời động viên
                            </Text>
                          </View>
                          <Ionicons
                            name={expandedSections.motivational ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                        {expandedSections.motivational && (
                          <View style={styles.motivationalContent}>
                            <Text style={styles.motivationalText}>
                              {currentAnalysis.motivationalMessage}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Strengths */}
                    {currentAnalysis.strengthsIdentified.length > 0 && (
                      <View style={styles.detailSection}>
                        <TouchableOpacity
                          style={styles.detailSectionHeader}
                          onPress={() => toggleSection("strengths")}
                          activeOpacity={0.7}
                        >
                          <View style={styles.detailSectionTitleRow}>
                            <View style={[styles.sectionIconBox, { backgroundColor: "#FEF3C7" }]}>
                              <Ionicons name="trophy" size={18} color="#F59E0B" />
                            </View>
                            <Text style={styles.detailSectionTitle}>
                              Điểm mạnh
                            </Text>
                            <View style={styles.countBadge}>
                              <Text style={styles.countBadgeText}>
                                {currentAnalysis.strengthsIdentified.length}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name={expandedSections.strengths ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                        {expandedSections.strengths && (
                          <View style={styles.detailSectionContent}>
                            {currentAnalysis.strengthsIdentified.map(
                              (strength: string, index: number) => (
                                <View key={index} style={styles.detailListItem}>
                                  <View style={styles.listIconBox}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                  </View>
                                  <Text style={styles.detailListText}>{strength}</Text>
                                </View>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Areas for Improvement */}
                    {currentAnalysis.areasForImprovement.length > 0 && (
                      <View style={styles.detailSection}>
                        <TouchableOpacity
                          style={styles.detailSectionHeader}
                          onPress={() => toggleSection("improvements")}
                          activeOpacity={0.7}
                        >
                          <View style={styles.detailSectionTitleRow}>
                            <View style={[styles.sectionIconBox, { backgroundColor: "#DBEAFE" }]}>
                              <Ionicons name="trending-up" size={18} color="#3B82F6" />
                            </View>
                            <Text style={styles.detailSectionTitle}>
                              Cần cải thiện
                            </Text>
                            <View style={styles.countBadge}>
                              <Text style={styles.countBadgeText}>
                                {currentAnalysis.areasForImprovement.length}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name={expandedSections.improvements ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                        {expandedSections.improvements && (
                          <View style={styles.detailSectionContent}>
                            {currentAnalysis.areasForImprovement.map(
                              (area: string, index: number) => (
                                <View key={index} style={styles.detailListItem}>
                                  <View style={styles.listIconBox}>
                                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                                  </View>
                                  <Text style={styles.detailListText}>{area}</Text>
                                </View>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Recommendations */}
                    {currentAnalysis.recommendationsForNextSession.length > 0 && (
                      <View style={styles.detailSection}>
                        <TouchableOpacity
                          style={styles.detailSectionHeader}
                          onPress={() => toggleSection("recommendations")}
                          activeOpacity={0.7}
                        >
                          <View style={styles.detailSectionTitleRow}>
                            <View style={[styles.sectionIconBox, { backgroundColor: "#FEF3C7" }]}>
                              <Ionicons name="bulb" size={18} color="#F59E0B" />
                            </View>
                            <Text style={styles.detailSectionTitle}>
                              Đề xuất cải thiện
                            </Text>
                            <View style={styles.countBadge}>
                              <Text style={styles.countBadgeText}>
                                {currentAnalysis.recommendationsForNextSession.length}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name={expandedSections.recommendations ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                        {expandedSections.recommendations && (
                          <View style={styles.detailSectionContent}>
                            {currentAnalysis.recommendationsForNextSession.map(
                              (rec: any, index: number) => (
                                <View key={index} style={styles.detailRecommendationCard}>
                                  <View style={styles.recommendationCardHeader}>
                                    <View
                                      style={[
                                        styles.detailPriorityBadge,
                                        rec.priority === "HIGH" && { backgroundColor: "#FEE2E2" },
                                        rec.priority === "MEDIUM" && { backgroundColor: "#FEF3C7" },
                                        rec.priority === "LOW" && { backgroundColor: "#DBEAFE" },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.detailPriorityText,
                                          rec.priority === "HIGH" && { color: "#DC2626" },
                                          rec.priority === "MEDIUM" && { color: "#D97706" },
                                          rec.priority === "LOW" && { color: "#2563EB" },
                                        ]}
                                      >
                                        {rec.priority === "HIGH" ? "Cao" : rec.priority === "MEDIUM" ? "TB" : "Thấp"}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.detailRecommendationText}>{rec.title}</Text>
                                </View>
                              )
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <HowToPlayModal
        visible={howToPlayModalVisible}
        onClose={() => setHowToPlayModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  welcomeCard: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    color: "#DCFCE7",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  streakBox: { alignItems: "center" },
  streakNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  streakText: { color: "#fff", fontSize: 11 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },
  aiCard: { backgroundColor: "#F3E8FF", borderColor: "#E9D5FF" },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#9333EA",
  },
  aiTitle: { color: "#581C87", fontWeight: "700" },
  aiSub: { color: "#7C3AED", fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  sessionTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
  },
  sessionCoach: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sessionMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "400",
  },
  chev: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1D5DB" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  viewAllText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "400",
  },
  progressItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  progressSessionCount: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "400",
  },
  progressPercentBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 5,
  },
  scoreContainer: {
    flexDirection: "row",
    gap: 10,
  },
  scoreItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.2,
  },
  progressStats: {
    gap: 6,
  },
  progressStatText: {
    fontSize: 12,
    color: "#6B7280",
  },
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  scoreText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "500",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  analysisHeader: {
    marginBottom: 8,
  },
  analysisCourseName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  analysisProgressBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  analysisProgressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  analysisSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  motivationalSection: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  analysisSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  analysisSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  analysisSummaryText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  subSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subSectionItem: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    paddingLeft: 8,
  },
  recommendationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: "#FEE2E2",
  },
  priorityMedium: {
    backgroundColor: "#FEF3C7",
  },
  priorityLow: {
    backgroundColor: "#DBEAFE",
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  recommendationDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  focusAreasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  focusAreaBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  focusAreaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  drillCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  drillName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  drillDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 10,
  },
  drillMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  drillMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  drillMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Progress Detail Card Styles
  progressDetailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  progressCourseName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  progressStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  progressStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressStatTextContainer: {
    flex: 1,
  },
  progressStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  progressStatValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  progressBarLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
  },
  // AI Analysis Card Styles
  aiAnalysisCard: {
    backgroundColor: "#F9F5FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    marginBottom: 16,
  },
  aiAnalysisMainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    paddingBottom: 12,
  },
  aiAnalysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiAnalysisTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#5B21B6",
  },
  analysisCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  analysisCountBadge: {
    backgroundColor: "#DDD6FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 4,
  },
  analysisCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B21B6",
  },
  analysisListHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  analysisListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  analysisNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#059669",
  },
  navButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  navButtonTextDisabled: {
    color: "#9CA3AF",
  },
  analysisTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#5B21B6",
    marginBottom: 4,
  },
  aiAnalysisCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#059669",
  },
  analysisDate: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  aiAnalysisContent: {
    gap: 12,
  },
  performanceRow: {
    flexDirection: "row",
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  performanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  performanceScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#059669",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  noAnalysisContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  noAnalysisText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5B21B6",
    marginTop: 16,
    textAlign: "center",
  },
  noAnalysisSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  analysisInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 12,
  },
  analysisInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  // Detail Modal Styles
  detailModalHeader: {
    backgroundColor: "#8B5CF6",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#7C3AED",
  },
  detailModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  detailModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTitleCard: {
    backgroundColor: "#F9F5FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5B21B6",
    marginBottom: 8,
  },
  detailDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailDate: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  detailSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    overflow: "hidden",
  },
  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  detailSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  countBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  detailSectionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  detailSummaryText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  motivationalCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
    overflow: "hidden",
  },
  motivationalContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  motivationalText: {
    fontSize: 14,
    color: "#991B1B",
    lineHeight: 20,
    fontStyle: "italic",
  },
  detailListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  listIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  detailListText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  detailPerformanceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  detailPerformanceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  performanceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  detailPerformanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailPerformanceScore: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  detailPerformanceMax: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  detailRecommendationCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  recommendationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailPriorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailPriorityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailRecommendationText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
});
