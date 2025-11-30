import { formStyles } from "@/components/common/formStyles";
import { PickleballLevel } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  skillLevel: PickleballLevel | "";
  learningGoal: PickleballLevel | "";
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onSkillLevelChange: (value: PickleballLevel) => void;
  onLearningGoalChange: (value: PickleballLevel) => void;
  onClearError: (field: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const SKILL_LEVELS = [
  { value: PickleballLevel.BEGINNER, label: "Người mới" },
  { value: PickleballLevel.INTERMEDIATE, label: "Trung bình" },
  { value: PickleballLevel.ADVANCED, label: "Nâng cao" },
];

const LEARNING_GOALS = [
  { value: PickleballLevel.BEGINNER, label: "Cơ bản" },
  { value: PickleballLevel.INTERMEDIATE, label: "Trung bình" },
  { value: PickleballLevel.ADVANCED, label: "Chuyên nghiệp" },
];

export const RegistrationStep2Learner = ({
  skillLevel,
  learningGoal,
  fieldErrors,
  submitting,
  onSkillLevelChange,
  onLearningGoalChange,
  onClearError,
  onBack,
  onSubmit,
}: Props) => {
  return (
    <>
      {/* Skill Level */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Trình độ hiện tại</Text>
        <View style={formStyles.levelContainer}>
          {SKILL_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              onPress={() => {
                onSkillLevelChange(level.value);
                if (fieldErrors.skillLevel) {
                  onClearError("skillLevel");
                }
              }}
              style={[
                formStyles.levelButton,
                skillLevel === level.value && styles.levelButtonActive,
              ]}
            >
              <View style={formStyles.radioOuter}>
                {skillLevel === level.value ? (
                  <View style={formStyles.radioInner} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.levelButtonText,
                  skillLevel === level.value && styles.levelButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {fieldErrors.skillLevel ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.skillLevel}
          </Text>
        ) : null}
      </View>

      {/* Learning Goal */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Mục tiêu học tập</Text>
        <View style={formStyles.levelContainer}>
          {LEARNING_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              onPress={() => {
                onLearningGoalChange(goal.value);
                if (fieldErrors.learningGoal) {
                  onClearError("learningGoal");
                }
              }}
              style={[
                formStyles.levelButton,
                learningGoal === goal.value && styles.levelButtonActive,
              ]}
            >
              <View style={formStyles.radioOuter}>
                {learningGoal === goal.value ? (
                  <View style={formStyles.radioInner} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.levelButtonText,
                  learningGoal === goal.value && styles.levelButtonTextActive,
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {fieldErrors.learningGoal ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.learningGoal}
          </Text>
        ) : null}
      </View>

      {/* Buttons */}
      <View style={formStyles.buttonRow}>
        <TouchableOpacity onPress={onBack} style={formStyles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={formStyles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        <Pressable disabled={submitting} onPress={onSubmit} style={styles.submitButtonWrapper}>
          <LinearGradient
            colors={
              submitting ? ["#9CA3AF", "#9CA3AF"] : ["#059669", "#047857"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={formStyles.submitButton}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.submitButtonText}>Hoàn thành</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  levelButtonActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#059669",
  },
  levelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  levelButtonTextActive: {
    color: "#059669",
  },
  submitButtonWrapper: {
    flex: 1,
  },
});
