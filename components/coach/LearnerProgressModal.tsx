import learnerVideoService from "@/services/learnerVideo.service";
import quizService from "@/services/quiz.service";
import sessionService from "@/services/sessionService";
import { LearnerProgress } from "@/types/learner-progress";
import { Session } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LearnerVideoModal from "./LearnerVideoModal";
import QuizAttemptModal from "./QuizAttemptModal";

interface LearnerProgressModalProps {
  visible: boolean;
  onClose: () => void;
  learner: LearnerProgress | null;
}

export default function LearnerProgressModal({
  visible,
  onClose,
  learner,
}: LearnerProgressModalProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(
    null
  );
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState<any[]>([]);
  const [quizAttemptModalVisible, setQuizAttemptModalVisible] = useState(false);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");

  // Learner video state
  const [learnerVideos, setLearnerVideos] = useState<any[]>([]);
  const [selectedLearnerVideo, setSelectedLearnerVideo] = useState<any>(null);
  const [learnerVideoModalVisible, setLearnerVideoModalVisible] =
    useState(false);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingQuizAttempts, setLoadingQuizAttempts] = useState(false);

  useEffect(() => {
    if (visible && learner?.course?.id) {
      fetchSessions(learner.course.id);
    } else {
      setSessions([]);
      setExpandedSessionId(null);
    }
  }, [visible, learner]);

  const fetchSessions = async (courseId: number) => {
    try {
      setLoading(true);
      const data = await sessionService.getSessionsByCourseId(courseId);
      setSessions(data.metadata || data || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async (sessionId: number, quizId?: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      setSelectedQuizAttempts([]);
    } else {
      setExpandedSessionId(sessionId);
    }
  };

  const handleQuizClick = async (quizId: number, quizTitle: string) => {
    if (!learner?.user?.id) return;

    try {
      setLoadingQuizAttempts(true);
      console.log(
        "Fetching quiz attempts for quizId:",
        quizId,
        "userId:",
        learner.user.id
      );
      const attempts = await quizService.getQuizAttemptsByQuizAndUser(
        quizId,
        learner.user.id
      );
      console.log("Quiz attempts raw response:", attempts);
      const attemptsArray = attempts.metadata || attempts || [];
      console.log("Quiz attempts array:", attemptsArray);

      setSelectedQuizAttempts(attemptsArray);
      setSelectedQuizTitle(quizTitle);

      if (attemptsArray.length > 0) {
        // Sort by attempt number descending to get the latest attempt first
        const sortedAttempts = [...attemptsArray].sort(
          (a: any, b: any) => b.attemptNumber - a.attemptNumber
        );
        setSelectedAttempt(sortedAttempts[0]);
      } else {
        setSelectedAttempt(null);
      }

      setQuizAttemptModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch quiz attempts:", error);
      alert("Không thể tải dữ liệu bài làm quiz");
      setSelectedQuizAttempts([]);
    } finally {
      setLoadingQuizAttempts(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleVideoClick = async (coachVideoId: number, videoTitle: string) => {
    if (!learner?.user?.id) return;

    try {
      setLoadingVideos(true);
      const videos =
        await learnerVideoService.getLearnerVideosByUserAndCoachVideo(
          learner.user.id,
          coachVideoId
        );
      setLearnerVideos(videos);
      setSelectedVideoTitle(videoTitle);

      if (videos && videos.length > 0) {
        const sortedVideos = [...videos].sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSelectedLearnerVideo(sortedVideos[0]);
        setLearnerVideoModalVisible(true);
      } else {
        alert("Học viên chưa nộp video cho bài này");
      }
    } catch (error) {
      console.error("Error fetching learner videos:", error);
      alert("Không thể tải dữ liệu video");
    } finally {
      setLoadingVideos(false);
    }
  };

  const renderSessionItem = (session: Session) => {
    const isExpanded = expandedSessionId === session.id;
    return (
      <View key={session.id} style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => toggleSession(session.id, session.quiz?.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>
              {session.name || `Buổi ${session.sessionNumber}`}
            </Text>
            <Text style={styles.sessionDate}>
              {formatDate(session.scheduleDate)} •{" "}
              {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sessionContent}>
            {/* Video */}
            {session.video && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Video bài giảng</Text>
                <TouchableOpacity
                  style={styles.videoItem}
                  onPress={() =>
                    handleVideoClick(session.video!.id, session.video!.title)
                  }
                  disabled={loadingVideos}
                >
                  <View style={styles.videoHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Ionicons name="play-circle" size={20} color="#059669" />
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {session.video.title}
                      </Text>
                    </View>
                    {loadingVideos ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
            {/* Quiz */}
            {session.quiz && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Bài tập Quiz</Text>
                <TouchableOpacity
                  style={styles.videoItem}
                  onPress={() =>
                    handleQuizClick(session.quiz!.id, session.quiz!.title)
                  }
                  disabled={loadingQuizAttempts}
                >
                  <View style={styles.videoHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Ionicons name="help-circle" size={20} color="#F59E0B" />
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {session.quiz.title}
                      </Text>
                    </View>
                    {loadingQuizAttempts ? (
                      <ActivityIndicator size="small" color="#F59E0B" />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!learner) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Chi tiết học tập</Text>
              <Text style={styles.learnerName}>{learner.user.fullName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.courseName}>sdsd</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {learner.avgAiAnalysisScore}
                  </Text>
                  <Text style={styles.statLabel}>AI Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{learner.avgQuizScore}</Text>
                  <Text style={styles.statLabel}>Quiz Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {learner.sessionsCompleted}/{learner.totalSessions}
                  </Text>
                  <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
              </View>
              <Text style={styles.sectionHeader}>Danh sách buổi học</Text>
              <View style={styles.sessionsList}>
                {sessions
                  ?.sort((a, b) => a.sessionNumber - b.sessionNumber)
                  .map((session) => renderSessionItem(session))}
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
      <QuizAttemptModal
        visible={quizAttemptModalVisible}
        onClose={() => setQuizAttemptModalVisible(false)}
        attempt={selectedAttempt}
        attempts={selectedQuizAttempts}
        quizTitle={selectedQuizTitle}
      />
      <LearnerVideoModal
        visible={learnerVideoModalVisible}
        onClose={() => setLearnerVideoModalVisible(false)}
        learnerVideo={selectedLearnerVideo}
        learnerVideos={learnerVideos}
        videoTitle={selectedVideoTitle}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  learnerName: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  sessionContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  videoTitle: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
