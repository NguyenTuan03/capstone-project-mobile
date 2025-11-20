// services/ai/geminiService.ts
import type { VideoComparisonResult, PoseLandmark } from "@/types/ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

if (!API_KEY) {
  console.warn(
    "[geminiService] EXPO_PUBLIC_GEMINI_API_KEY is missing. Please set it in your .env."
  );
}

const parseJsonResponse = <T>(text: string): T => {
  try {
    const cleanedText = text.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error(
      "Đã nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại."
    );
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (body: unknown, retries = 5): Promise<string> => {
  const url = `${GEMINI_ENDPOINT}?key=${API_KEY}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${retries}...`);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(errText);
        } catch {}

        console.error(
          `[Gemini API error] Attempt ${attempt}:`,
          res.status,
          errText
        );

        if (res.status === 503 && attempt < retries) {
          const waitTime = attempt * 5000;
          console.log(`⏳ Server overloaded, retrying in ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }

        if (res.status === 429 && attempt < retries) {
          const waitTime = attempt * 3000;
          console.log(`⏳ Rate limited, retrying in ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }

        throw new Error(
          `Gọi AI thất bại (${res.status}). ${
            errorData?.error?.message || "Không rõ lỗi"
          }`
        );
      }

      const data: any = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text ?? "")
          .join("") ?? "";

      if (!text) {
        console.error("[Gemini API] Empty text response", JSON.stringify(data));
        throw new Error("AI không trả về nội dung hợp lệ.");
      }

      console.log(`✅ Request successful on attempt ${attempt}`);
      return text;
    } catch (error) {
      if (attempt < retries && error instanceof TypeError) {
        console.log(`⏳ Network error, retrying in 3s...`);
        await sleep(3000);
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    "Đã thử lại nhiều lần nhưng vẫn thất bại. Vui lòng thử lại sau."
  );
};

// ===== SCHEMA MỚI CHO SO SÁNH DỰA TRÊN POSE DATA =====
const coachComparisonDetailSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "string",
      description:
        "Phân tích cực kỳ ngắn gọn (1 câu) về kỹ thuật của Huấn luyện viên trong giai đoạn này.",
    },
    timestamp: {
      type: "number",
      description:
        "Dấu thời gian (tính bằng giây) trong video mà phân tích này áp dụng.",
    },
  },
  required: ["analysis", "timestamp"],
};

const learnerComparisonDetailSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "string",
      description:
        "Phân tích cực kỳ ngắn gọn (1 câu) về kỹ thuật của người chơi trong giai đoạn này.",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách các điểm mạnh ngắn gọn.",
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách các điểm yếu ngắn gọn.",
    },
    timestamp: {
      type: "number",
      description:
        "Dấu thời gian (tính bằng giây) trong video mà phân tích này áp dụng.",
    },
  },
  required: ["analysis", "strengths", "weaknesses", "timestamp"],
};

const keyDifferenceSchema = {
  type: "object",
  properties: {
    aspect: { type: "string", description: "Khía cạnh kỹ thuật (ngắn gọn)." },
    player1_technique: {
      type: "string",
      description: "Mô tả ngắn gọn kỹ thuật của HLV.",
    },
    player2_technique: {
      type: "string",
      description: "Mô tả ngắn gọn kỹ thuật của Học viên.",
    },
    impact: {
      type: "string",
      description: "Phân tích tác động ngắn gọn (1 câu).",
    },
  },
  required: ["aspect", "player1_technique", "player2_technique", "impact"],
};

const drillSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Tiêu đề ngắn gọn của bài tập." },
    description: {
      type: "string",
      description: "Mô tả ngắn gọn (1-2 câu) về cách thực hiện bài tập.",
    },
    practice_sets: {
      type: "string",
      description: "Các hiệp thực hành được đề xuất (ví dụ: '3x10 lần').",
    },
  },
  required: ["title", "description", "practice_sets"],
};

const recommendationWithDrillSchema = {
  type: "object",
  properties: {
    recommendation: {
      type: "string",
      description: "Một đề xuất ngắn gọn, có thể hành động.",
    },
    drill: drillSchema,
  },
  required: ["recommendation", "drill"],
};

const comparePoseDataSchema = {
  type: "object",
  properties: {
    comparison: {
      type: "object",
      properties: {
        preparation: {
          type: "object",
          properties: {
            player1: coachComparisonDetailSchema,
            player2: learnerComparisonDetailSchema,
            advantage: {
              type: "string",
              description: "So sánh lợi thế 1 câu.",
            },
          },
          required: ["player1", "player2", "advantage"],
        },
        swingAndContact: {
          type: "object",
          properties: {
            player1: coachComparisonDetailSchema,
            player2: learnerComparisonDetailSchema,
            advantage: {
              type: "string",
              description: "So sánh lợi thế 1 câu.",
            },
          },
          required: ["player1", "player2", "advantage"],
        },
        followThrough: {
          type: "object",
          properties: {
            player1: coachComparisonDetailSchema,
            player2: learnerComparisonDetailSchema,
            advantage: {
              type: "string",
              description: "So sánh lợi thế 1 câu.",
            },
          },
          required: ["player1", "player2", "advantage"],
        },
      },
      required: ["preparation", "swingAndContact", "followThrough"],
    },
    keyDifferences: {
      type: "array",
      items: keyDifferenceSchema,
    },
    summary: {
      type: "string",
      description: "Tóm tắt tổng thể cực kỳ ngắn gọn (1 câu).",
    },
    recommendationsForPlayer2: {
      type: "array",
      items: recommendationWithDrillSchema,
    },
    overallScoreForPlayer2: {
      type: "number",
      description:
        "Điểm tổng thể cho kỹ thuật của Học viên trên thang điểm 100.",
    },
  },
  required: [
    "comparison",
    "keyDifferences",
    "summary",
    "recommendationsForPlayer2",
    "overallScoreForPlayer2",
  ],
};

/**
 * ===== SO SÁNH DỰA TRÊN POSE DATA (NO FRAMES) =====
 * Chỉ gửi JSON pose data thay vì frames
 */
export const comparePoseData = async (
  coachPoses: PoseLandmark[][],
  coachTimestamps: number[],
  learnerPoses: PoseLandmark[][],
  learnerTimestamps: number[]
): Promise<VideoComparisonResult> => {
  const prompt = `
    Bạn là một huấn luyện viên pickleball AI, chuyên đưa ra phản hồi so sánh nhanh chóng, súc tích cho người dùng di động.
    
    Nhiệm vụ: So sánh dữ liệu JSON của "Huấn luyện viên" (player1, tham chiếu) và "Học viên" (player2). Tập trung vào việc giúp Học viên cải thiện bằng cách phân tích hình học và chuyển động giữa các điểm khớp.

    YÊU CẦU QUAN TRỌNG:
    - **SÚC TÍCH TỐI ĐA:** Toàn bộ phản hồi PHẢI CỰC KỲ ngắn gọn. Sử dụng các gạch đầu dòng và câu ngắn. TRÁNH các đoạn văn dài.
    - **Phân tích so sánh ('comparison'):** Mỗi 'analysis', 'advantage' chỉ nên là một câu ngắn gọn. 'strengths' và 'weaknesses' là các gạch đầu dòng ngắn.
    - **Khác biệt chính ('keyDifferences'):** Liệt kê 2-3 điểm khác biệt quan trọng nhất một cách ngắn gọn.
    - **Tóm tắt ('summary'):** Một câu duy nhất.
    - **Đề xuất & Bài tập ('recommendationsForPlayer2'):** Đề xuất phải trực tiếp. Mô tả bài tập ('drill.description') chỉ nên là các bước chính, không quá 2 câu.
    - **Dấu thời gian:** Luôn bao gồm dấu thời gian chính xác cho mỗi giai đoạn, được cung cấp dưới đây.
    - **Điểm số:** Chấm điểm trên thang 100 điểm.
    
    DỮ LIỆU ĐẦU VÀO:
    - Dấu thời gian HLV: ${coachTimestamps.join(", ")} giây
    - Dữ liệu tư thế HLV (JSON): ${JSON.stringify(coachPoses)}
    - Dấu thời gian Học viên: ${learnerTimestamps.join(", ")} giây
    - Dữ liệu tư thế Học viên (JSON): ${JSON.stringify(learnerPoses)}

    Hãy trả lời CHỈ bằng một đối tượng JSON bằng tiếng Việt theo lược đồ đã cung cấp.
  `;

  try {
    const text = await callGemini({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: comparePoseDataSchema,
      },
    });

    return parseJsonResponse<VideoComparisonResult>(text);
  } catch (error) {
    console.error("Gemini API call failed in comparePoseData:", error);
    throw new Error(
      "AI không thể xử lý dữ liệu tư thế để so sánh. Điều này có thể do sự cố mạng hoặc sự cố dịch vụ tạm thời. Vui lòng thử lại sau."
    );
  }
};
