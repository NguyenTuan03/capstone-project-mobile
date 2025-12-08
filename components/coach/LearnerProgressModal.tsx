import learnerVideoService from "@/services/learnerVideo.service";
import quizService from "@/services/quiz.service";
import sessionService from "@/services/sessionService";
import { LearnerProgress } from "@/types/learner-progress";
import { Session } from "@/types/session";
import { LearnerVideo } from "@/types/video";
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
  const [learnerVideos, setLearnerVideos] = useState<LearnerVideo[]>([]);
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

      const attempts = await quizService.getQuizAttemptsByQuizAndUser(
        quizId,
        learner.user.id
      );

      const attemptsArray = attempts.metadata || attempts || [];

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
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="play-circle" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>Video bài giảng</Text>
                </View>
                <TouchableOpacity
                  style={styles.videoItem}
                  onPress={() =>
                    handleVideoClick(session.video!.id, session.video!.title)
                  }
                  disabled={loadingVideos}
                >
                  <View style={styles.videoContent}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
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
                </TouchableOpacity>
              </View>
            )}
            {/* Quiz */}
            {session.quiz && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="document-text" size={16} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Bài tập Quiz</Text>
                </View>
                <TouchableOpacity
                  style={styles.videoItem}
                  onPress={() =>
                    handleQuizClick(session.quiz!.id, session.quiz!.title)
                  }
                  disabled={loadingQuizAttempts}
                >
                  <View style={styles.videoContent}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
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
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="sparkles" size={18} color="#059669" />
                  </View>
                  <Text style={styles.statValue}>
                    {learner.avgAiAnalysisScore}
                  </Text>
                  <Text style={styles.statLabel}>Điểm AI</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="document-text" size={18} color="#F59E0B" />
                  </View>
                  <Text style={styles.statValue}>{learner.avgQuizScore}</Text>
                  <Text style={styles.statLabel}>Điểm Quiz</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>
                    {learner.sessionsCompleted}/{learner.totalSessions}
                  </Text>
                  <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
              </View>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar-outline" size={18} color="#059669" />
                <Text style={styles.sectionHeader}>Danh sách buổi học</Text>
                <View style={styles.sessionCountBadge}>
                  <Text style={styles.sessionCountText}>{sessions.length}</Text>
                </View>
              </View>
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
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  learnerName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
    fontWeight: "500",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  sessionCountBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  sessionCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  sessionContent: {
    padding: 12,
    paddingTop: 0,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  videoContent: {
    flex: 1,
    marginRight: 8,
  },
  videoTitle: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
