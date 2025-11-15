// components/QuizAttemptCard.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAttemptQuiz } from "../../../hooks/use-attemp-quiz";

type Option = { id: number; content: string; isCorrect?: boolean };
type Question = {
  id: number;
  title: string;
  explanation?: string | null;
  options: Option[];
};
type Quiz = {
  id: number;
  title: string;
  description?: string | null;
  totalQuestions?: number;
  questions: Question[];
};

type Props = {
  quiz: Quiz;
};

const QuizAttemptCard: React.FC<Props> = ({ quiz }) => {
  const questions = useMemo(() => quiz.questions ?? [], [quiz.questions]);
  const [answers, setAnswers] = useState<Record<number, number | undefined>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correctCount: number;
    total: number;
  } | null>(null);

  const { submitAttempt, submitting, error } = useAttemptQuiz();

  const onSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const allAnswered = questions.every((q) => answers[q.id] != null);

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    const payload = {
      learnerAnswers: questions.map((q) => ({
        question: q.id,
        questionOption: Number(answers[q.id]),
      })),
    };
    console.log("Submitting payload:", payload, quiz.id);
    const res = await submitAttempt(quiz.id, payload);
    if (res) {
      setSubmitted(true);
      setResult({ correctCount: res.correctCount, total: res.total });
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>{quiz.title}</Text>
      {!!quiz.description && <Text style={s.desc}>{quiz.description}</Text>}
      <Text style={s.meta}>
        Tổng câu hỏi: {quiz.totalQuestions ?? questions.length}
      </Text>

      <View style={s.divider} />

      {questions.map((q, idx) => (
        <View key={q.id} style={s.qBox}>
          <Text style={s.qIndex}>Câu {idx + 1}.</Text>
          <Text style={s.qTitle}>{q.title}</Text>

          <View style={s.optList}>
            {q.options.map((op) => {
              const selected = answers[q.id] === op.id;
              return (
                <TouchableOpacity
                  key={op.id}
                  onPress={() => onSelect(q.id, op.id)}
                  activeOpacity={0.8}
                  style={[s.optItem, selected && s.optItemSelected]}
                >
                  <View style={[s.radio, selected && s.radioActive]} />
                  <Text style={[s.optText, selected && s.optTextActive]}>
                    {op.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {submitted && !!q.explanation && (
            <Text style={s.explain}>💡 {q.explanation}</Text>
          )}
        </View>
      ))}

      {error ? <Text style={s.error}>Lỗi gửi bài: {error}</Text> : null}

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btn, !allAnswered || submitting ? s.btnDisabled : null]}
          onPress={handleSubmit}
          disabled={!allAnswered || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={s.btnLabel}>Nộp bài</Text>
          )}
        </TouchableOpacity>
      </View>

      {submitted && result && (
        <View style={s.resultBox}>
          <Text style={s.resultText}>
            Kết quả: {result.correctCount}/{result.total}
          </Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  desc: { fontSize: 13, color: "#4B5563" },
  meta: { fontSize: 12, color: "#6B7280" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 6 },
  qBox: { paddingVertical: 8, gap: 8 },
  qIndex: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  qTitle: { fontSize: 14, color: "#111827", fontWeight: "600" },
  optList: { gap: 8, marginTop: 4 },
  optItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optItemSelected: { backgroundColor: "#ECFDF5", borderColor: "#34D399" },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    backgroundColor: "transparent",
  },
  radioActive: { borderColor: "#10B981", backgroundColor: "#10B981" },
  optText: { fontSize: 13, color: "#374151" },
  optTextActive: { color: "#065F46", fontWeight: "600" },
  explain: { marginTop: 6, fontSize: 12, color: "#065F46" },
  actions: { marginTop: 10, flexDirection: "row" },
  btn: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: "#FFFFFF", fontWeight: "700" },
  error: { color: "#DC2626", marginTop: 6 },
  resultBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  resultText: { color: "#1D4ED8", fontWeight: "700" },
});

export default QuizAttemptCard;
