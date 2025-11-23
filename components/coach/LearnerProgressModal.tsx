import { getLearnerProgressDetails } from "@/services/learner.service";
import {
  LearnerProgress,
  LearnerProgressDetails,
} from "@/types/learner-progress";
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
  const [learnerDetails, setLearnerDetails] =
    useState<LearnerProgressDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(
    null
  );
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [quizAttemptModalVisible, setQuizAttemptModalVisible] = useState(false);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");

  useEffect(() => {
    if (visible && learner?.course?.id && learner?.user?.id) {
      fetchLearnerProgressDetails(learner.user.id, learner.course.id);
    } else {
      setLearnerDetails(null);
      setExpandedSessionId(null);
    }
  }, [visible, learner]);

  const fetchLearnerProgressDetails = async (
    userId: number,
    courseId: number
  ) => {
    try {
      setLoading(true);
      const data = await getLearnerProgressDetails(userId, courseId);
      setLearnerDetails(data);
    } catch (error) {
      console.error("Failed to fetch learner progress details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      year: "numeric",
    });
  };

  const renderSessionItem = (session: Session) => {
    const isExpanded = expandedSessionId === session.id;
    const sessionQuizAttempts =
      session.quiz && learnerDetails?.user?.quizAttempts
        ? learnerDetails.user.quizAttempts.filter((attempt: any) => {
            // 1. Match by quizId on the attempt itself (most direct)
            if (attempt.quizId === session.quiz!.id) return true;
            if (attempt.quiz?.id === session.quiz!.id) return true;

            // 2. Match by quizId on the question (if populated)
            const matchByQuizId = attempt.learnerAnswers?.some(
              (ans: any) => ans.question?.quizId === session.quiz!.id
            );
            if (matchByQuizId) return true;

            // 3. Match by question IDs (if session.quiz.questions is populated)
            if (session.quiz?.questions?.length) {
              const questionIds = new Set(
                session.quiz.questions.map((q) => q.id)
              );
              return attempt.learnerAnswers?.some((ans: any) =>
                questionIds.has(ans.question?.id)
              );
            }

            return false;
          })
        : [];
    return (
      <View key={session.id} style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => toggleSession(session.id)}
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
                <View style={styles.videoItem}>
                  <Ionicons name="play-circle" size={20} color="#059669" />
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {session.video.title}
                  </Text>
                </View>
              </View>
            )}
            {/* Quiz */}
            {session.quiz && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Bài tập Quiz</Text>
                <View style={styles.quizItem}>
                  <View style={styles.quizHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Ionicons name="help-circle" size={20} color="#F59E0B" />
                      <Text style={styles.quizTitle} numberOfLines={1}>
                        {session.quiz.title}
                      </Text>
                    </View>
                    {sessionQuizAttempts.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => {
                          // Find the best attempt (highest score) or just the first one
                          // Ideally we let them choose, but for now show the best one
                          const bestAttempt = sessionQuizAttempts.reduce(
                            (prev: any, current: any) =>
                              prev.score > current.score ? prev : current
                          );
                          setSelectedAttempt(bestAttempt);
                          setSelectedQuizTitle(session.quiz!.title);
                          setQuizAttemptModalVisible(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.quizScore,
                            Math.max(
                              ...sessionQuizAttempts.map((a: any) => a.score)
                            ) >= 80
                              ? { color: "#059669" }
                              : { color: "#6B7280" },
                            { textDecorationLine: "underline" },
                          ]}
                        >
                          {`${Math.max(
                            ...sessionQuizAttempts.map((a: any) => a.score)
                          )}%`}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.quizScore, { color: "#6B7280" }]}>
                        Chưa làm
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
            {/* Empty state */}
            {!session.video && !session.quiz && (
              <Text style={styles.emptyContentText}>
                Không có tài liệu cho buổi học này
              </Text>
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
              <Text style={styles.courseName}>
                {learnerDetails?.course?.name}
              </Text>
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
                {learnerDetails?.course?.sessions
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
        quizTitle={selectedQuizTitle}
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
  quizItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  quizTitle: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  quizScore: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContentText: {
    marginTop: 16,
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
  },
});
