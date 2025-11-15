import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AiVideoCompareResult } from "../../../types/ai";

interface AIAnalysisResultProps {
  loading: boolean;
  result: AiVideoCompareResult | null;
}

const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({
  loading,
  result,
}) => {
  if (loading) {
    return (
      <View style={styles.resourceCard}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.metaText}>Đang tải kết quả phân tích...</Text>
        </View>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={[styles.resourceCard, { backgroundColor: "#FFFBEB" }]}>
      <Text style={styles.resourceTitle}>📊 Kết quả phân tích AI</Text>
      {result.learnerScore !== null && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 8,
            marginVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#059669",
            }}
          >
            ⭐ {result.learnerScore}
          </Text>
          <Text style={styles.metaText}>/100</Text>
        </View>
      )}
      {result.summary && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisLabel}>📝 Tóm tắt:</Text>
          <Text style={styles.analysisText}>{result.summary}</Text>
        </View>
      )}
      {result.coachNote && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisLabel}>💬 Feedback từ coach:</Text>
          <Text style={styles.analysisText}>{result.coachNote}</Text>
        </View>
      )}
      {result.keyDifferents && result.keyDifferents.length > 0 && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisLabel}>🔍 Các điểm khác biệt chính:</Text>
          {result.keyDifferents.map((diff, index) => (
            <View key={index} style={styles.differenceItem}>
              <Text style={styles.differenceAspect}>{diff.aspect}</Text>
              <Text style={styles.analysisText}>
                Kỹ thuật của bạn: {diff.learnerTechnique}
              </Text>
              <Text style={styles.analysisText}>Tác động: {diff.impact}</Text>
            </View>
          ))}
        </View>
      )}
      {result.recommendationDrills &&
        result.recommendationDrills.length > 0 && (
          <View style={styles.analysisSection}>
            <Text style={styles.analysisLabel}>💡 Khuyến nghị:</Text>
            {result.recommendationDrills.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.analysisText}>
                  <Text style={{ fontWeight: "700" }}>
                    {index + 1}. {rec.name || "Bài tập"}
                  </Text>
                </Text>
                {rec.description && (
                  <Text style={styles.analysisText}>
                    Mô tả: {rec.description}
                  </Text>
                )}
                {rec.practiceSets && (
                  <Text style={styles.analysisText}>
                    Số hiệp tập: {rec.practiceSets}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      {result.createdAt && (
        <Text
          style={{
            ...styles.metaText,
            marginTop: 6,
            fontStyle: "italic",
          }}
        >
          Phân tích lúc: {new Date(result.createdAt).toLocaleString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  resourceCard: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
  },
  analysisSection: {
    marginTop: 9,
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
  },
  differenceItem: {
    marginTop: 6,
    padding: 7,
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    gap: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#FB923C",
  },
  differenceAspect: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  recommendationItem: {
    marginTop: 6,
    padding: 7,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    gap: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#34D399",
  },
});

export default AIAnalysisResult;

