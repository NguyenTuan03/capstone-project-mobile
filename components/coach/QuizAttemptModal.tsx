import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface QuizAttemptModalProps {
  visible: boolean;
  onClose: () => void;
  attempt: any; // The initially selected attempt
  attempts?: any[]; // All attempts for this quiz
  quizTitle: string;
}

export default function QuizAttemptModal({
  visible,
  onClose,
  attempt,
  attempts,
  quizTitle,
}: QuizAttemptModalProps) {
  const [selectedAttempt, setSelectedAttempt] = useState(attempt);

  useEffect(() => {
    if (attempt) {
      setSelectedAttempt(attempt);
    }
  }, [attempt]);

  if (!selectedAttempt) return null;

  const renderAnswerItem = (answer: any, index: number) => {
    const isCorrect = answer.isCorrect;
    return (
      <View key={index} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Câu {index + 1}</Text>
          {isCorrect ? (
            <View style={[styles.statusBadge, styles.correctBadge]}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.correctText}>Đúng</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.wrongBadge]}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={styles.wrongText}>Sai</Text>
            </View>
          )}
        </View>

        <Text style={styles.questionTitle}>{answer.question?.title}</Text>

        <View
          style={[
            styles.optionContainer,
            isCorrect ? styles.correctOption : styles.wrongOption,
          ]}
        >
          <Text
            style={[
              styles.optionText,
              isCorrect ? styles.correctOptionText : styles.wrongOptionText,
            ]}
          >
            {answer.questionOption?.content}
          </Text>
        </View>

        {!isCorrect && answer.question?.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationLabel}>Giải thích:</Text>
            <Text style={styles.explanationText}>
              {answer.question.explanation}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Chi tiết bài làm</Text>
              <Text style={styles.quizTitle} numberOfLines={1}>
                {quizTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Attempt Selector - Show if there are multiple attempts */}
          {attempts && attempts.length > 1 && (
            <View style={styles.attemptSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {attempts
                  .sort((a: any, b: any) => a.attemptNumber - b.attemptNumber)
                  .map((att: any, index: number) => (
                    <TouchableOpacity
                      key={att.id || index}
                      style={[
                        styles.attemptTab,
                        selectedAttempt?.id === att.id &&
                          styles.attemptTabActive,
                      ]}
                      onPress={() => setSelectedAttempt(att)}
                    >
                      <Text
                        style={[
                          styles.attemptTabText,
                          selectedAttempt?.id === att.id &&
                            styles.attemptTabTextActive,
                        ]}
                      >
                        Lần {att.attemptNumber}
                      </Text>
                      <Text
                        style={[
                          styles.attemptTabScore,
                          selectedAttempt?.id === att.id &&
                            styles.attemptTabScoreActive,
                          att.score >= 80
                            ? { color: "#059669" }
                            : { color: "#DC2626" },
                        ]}
                      >
                        {att.score}%
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Điểm số</Text>
              <Text
                style={[
                  styles.scoreValue,
                  selectedAttempt.score >= 80
                    ? { color: "#059669" }
                    : { color: "#DC2626" },
                ]}
              >
                {selectedAttempt.score}%
              </Text>
            </View>

            <View style={styles.answersList}>
              {selectedAttempt.learnerAnswers?.map(
                (answer: any, index: number) => renderAnswerItem(answer, index)
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    height: "80%",
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
  quizTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  answersList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  correctBadge: {
    backgroundColor: "#ECFDF5",
  },
  wrongBadge: {
    backgroundColor: "#FEF2F2",
  },
  correctText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  wrongText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 12,
  },
  optionContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  correctOption: {
    backgroundColor: "#ECFDF5",
    borderColor: "#059669",
  },
  wrongOption: {
    backgroundColor: "#FEF2F2",
    borderColor: "#DC2626",
  },
  optionText: {
    fontSize: 14,
  },
  correctOptionText: {
    color: "#065F46",
  },
  wrongOptionText: {
    color: "#991B1B",
  },
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: "#374151",
    fontStyle: "italic",
  },
  attemptSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  attemptTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 80,
    alignItems: "center",
  },
  attemptTabActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  attemptTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  attemptTabTextActive: {
    color: "#6366F1",
  },
  attemptTabScore: {
    fontSize: 16,
    fontWeight: "bold",
  },
  attemptTabScoreActive: {
    fontWeight: "bold",
  },
});
