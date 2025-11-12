import { StyleSheet, Text, View } from "react-native";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
};

export const StepIndicator = ({
  currentStep,
  totalSteps,
  stepLabels,
}: StepIndicatorProps) => {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        const isLast = index === totalSteps - 1;

        return (
          <View key={stepNumber} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[styles.stepCircle, isActive && styles.stepCircleActive]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    isActive && styles.stepNumberActive,
                  ]}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text style={styles.stepLabel}>{stepLabels[index]}</Text>
            </View>
            {!isLast && <View style={styles.stepLine} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 10,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#059669",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  stepNumberActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 100,
  },
  stepLine: {
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
    width: 60,
  },
});
