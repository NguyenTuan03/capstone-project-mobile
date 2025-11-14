import { VideoComparisonResult } from "@/types/ai";

export const formatAnalysisResult = (result: VideoComparisonResult): string => {
    let text = "📊 KẾT QUẢ PHÂN TÍCH KỸ THUẬT\n";
    text += "=".repeat(50) + "\n\n";
  
    // Overall Score
    if (result.overallScoreForPlayer2 !== undefined) {
      text += `⭐ ĐIỂM TỔNG QUAN: ${result.overallScoreForPlayer2}/100\n\n`;
    }
  
    // Summary
    if (result.summary) {
      text += "📝 TÓM TẮT:\n";
      text += result.summary + "\n\n";
    }
  
    // Comparison
    if (result.comparison) {
      text += "⚖️ SO SÁNH CHI TIẾT:\n";
      text += "-".repeat(50) + "\n\n";
  
      // Preparation
      if (result.comparison.preparation) {
        const prep = result.comparison.preparation;
        text += "1. GIAI ĐOẠN CHUẨN BỊ:\n";
        text += `   Ưu thế: ${prep.advantage}\n`;
        if (prep.player2?.analysis) {
          text += `   Phân tích: ${prep.player2.analysis}\n`;
        }
        if (prep.player2?.strengths && prep.player2.strengths.length > 0) {
          text += `   Điểm mạnh:\n`;
          prep.player2.strengths.forEach((s) => {
            text += `     • ${s}\n`;
          });
        }
        if (prep.player2?.weaknesses && prep.player2.weaknesses.length > 0) {
          text += `   Điểm cần cải thiện:\n`;
          prep.player2.weaknesses.forEach((w) => {
            text += `     • ${w}\n`;
          });
        }
        text += "\n";
      }
  
      // Swing and Contact
      if (result.comparison.swingAndContact) {
        const swing = result.comparison.swingAndContact;
        text += "2. GIAI ĐOẠN VUNG VỢT & TIẾP XÚC:\n";
        text += `   Ưu thế: ${swing.advantage}\n`;
        if (swing.player2?.analysis) {
          text += `   Phân tích: ${swing.player2.analysis}\n`;
        }
        if (swing.player2?.strengths && swing.player2.strengths.length > 0) {
          text += `   Điểm mạnh:\n`;
          swing.player2.strengths.forEach((s) => {
            text += `     • ${s}\n`;
          });
        }
        if (swing.player2?.weaknesses && swing.player2.weaknesses.length > 0) {
          text += `   Điểm cần cải thiện:\n`;
          swing.player2.weaknesses.forEach((w) => {
            text += `     • ${w}\n`;
          });
        }
        text += "\n";
      }
  
      // Follow Through
      if (result.comparison.followThrough) {
        const follow = result.comparison.followThrough;
        text += "3. GIAI ĐOẠN KẾT THÚC:\n";
        text += `   Ưu thế: ${follow.advantage}\n`;
        if (follow.player2?.analysis) {
          text += `   Phân tích: ${follow.player2.analysis}\n`;
        }
        if (follow.player2?.strengths && follow.player2.strengths.length > 0) {
          text += `   Điểm mạnh:\n`;
          follow.player2.strengths.forEach((s) => {
            text += `     • ${s}\n`;
          });
        }
        if (follow.player2?.weaknesses && follow.player2.weaknesses.length > 0) {
          text += `   Điểm cần cải thiện:\n`;
          follow.player2.weaknesses.forEach((w) => {
            text += `     • ${w}\n`;
          });
        }
        text += "\n";
      }
    }
  
    // Key Differences
    if (result.keyDifferences && result.keyDifferences.length > 0) {
      text += "🔍 CÁC ĐIỂM KHÁC BIỆT CHÍNH:\n";
      text += "-".repeat(50) + "\n\n";
      result.keyDifferences.forEach((diff, index) => {
        text += `${index + 1}. ${diff.aspect}\n`;
        text += `   Kỹ thuật của bạn: ${diff.player2_technique}\n`;
        text += `   Tác động: ${diff.impact}\n\n`;
      });
    }
  
    // Recommendations
    if (
      result.recommendationsForPlayer2 &&
      result.recommendationsForPlayer2.length > 0
    ) {
      text += "💡 KHUYẾN NGHỊ:\n";
      text += "-".repeat(50) + "\n\n";
      result.recommendationsForPlayer2.forEach((rec, index) => {
        text += `${index + 1}. ${rec.recommendation}\n`;
        if (rec.drill) {
          if (rec.drill.title) {
            text += `   Bài tập: ${rec.drill.title}\n`;
          }
          if (rec.drill.description) {
            text += `   Mô tả: ${rec.drill.description}\n`;
          }
          if (rec.drill.practice_sets) {
            text += `   Số hiệp tập: ${rec.drill.practice_sets}\n`;
          }
        }
        text += "\n";
      });
    }
  
    return text;
  };
  