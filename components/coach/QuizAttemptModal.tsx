import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
    } else if (visible && (!attempts || attempts.length === 0)) {
      Alert.alert(
        "Ch\u01b0a c\u00f3 b\u00e0i l\u00e0m",
        "H\u1ecdc vi\u00ean ch\u01b0a l\u00e0m b\u00e0i quiz n\u00e0y",
        [
          {
            text: "\u0110\u00f3ng",
            onPress: onClose,
          },
        ]
      );
    }
  }, [attempt, attempts, visible, onClose]);

  if (!selectedAttempt) return null;

  const renderAnswerItem = (answer: any, index: number) => {
    const isCorrect = answer.isCorrect;
    return (
      <View key={index} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumber}>Câu {index + 1}</Text>
          </View>
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
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={16} color="#059669" />
              <Text style={styles.explanationLabel}>Giải thích</Text>
            </View>
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
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.headerTitle}>Chi tiết bài làm</Text>
              <Text style={styles.quizTitle} numberOfLines={2}>
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
              <View style={styles.scoreIconContainer}>
                <Ionicons 
                  name={selectedAttempt.score >= 80 ? "trophy" : "document-text"} 
                  size={28} 
                  color={selectedAttempt.score >= 80 ? "#059669" : "#DC2626"} 
                />
              </View>
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
              <View style={[
                styles.scoreStatusBadge,
                selectedAttempt.score >= 80 ? styles.passedBadge : styles.failedBadge
              ]}>
                <Text style={[
                  styles.scoreStatusText,
                  selectedAttempt.score >= 80 ? styles.passedText : styles.failedText
                ]}>
                  {selectedAttempt.score >= 80 ? "\u0110\u1ea1t" : "Ch\u01b0a \u0111\u1ea1t"}
                </Text>
              </View>
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
  quizTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
    fontWeight: "500",
    lineHeight: 17,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  scoreStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  passedBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  failedBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  scoreStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  passedText: {
    color: "#059669",
  },
  failedText: {
    color: "#DC2626",
  },
  answersList: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  questionNumberBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  correctBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  wrongBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  correctText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  wrongText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
    lineHeight: 20,
  },
  optionContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
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
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  correctOptionText: {
    color: "#065F46",
  },
  wrongOptionText: {
    color: "#991B1B",
  },
  explanationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  explanationText: {
    fontSize: 12,
    color: "#065F46",
    lineHeight: 17,
    fontWeight: "500",
  },
  attemptSelector: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  attemptTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 75,
    alignItems: "center",
  },
  attemptTabActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#059669",
  },
  attemptTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  attemptTabTextActive: {
    color: "#059669",
  },
  attemptTabScore: {
    fontSize: 15,
    fontWeight: "700",
  },
  attemptTabScoreActive: {
    fontWeight: "700",
  },
});
