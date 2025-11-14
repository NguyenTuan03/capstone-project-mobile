// services/ai/geminiService.ts
import type { CombinedAnalysisResult, VideoComparisonResult } from "@/types/ai";

// 🔑 Env cho Expo (app.config + .env)
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

if (!API_KEY) {
  console.warn(
    "[geminiService] EXPO_PUBLIC_GEMINI_API_KEY is missing. Please set it in your .env."
  );
}

// Helper parse JSON từ text model trả về
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

// Call Gemini REST API, trả về text từ candidate đầu tiên
const callGemini = async (body: unknown): Promise<string> => {
  const url = `${GEMINI_ENDPOINT}?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[Gemini API error]", res.status, errText);
    throw new Error(
      "Gọi AI thất bại. Có thể do cấu hình API key hoặc mạng. Vui lòng thử lại."
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

  return text;
};

/**
 * ===== SCHEMA CHO PHÂN TÍCH 1 VIDEO =====
 */
const analyzeVideoSchema = {
  type: "object",
  properties: {
    shotType: { type: "string" },
    confidence: { type: "number" },
    pose: {
      type: "object",
      properties: {
        summary: { type: "string" },
        feedback: { type: "string" },
      },
      required: ["summary", "feedback"],
    },
    movement: {
      type: "object",
      properties: {
        preparation: { type: "string" },
        contact: { type: "string" },
        followThrough: { type: "string" },
      },
      required: ["preparation", "contact", "followThrough"],
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    description: { type: "string" },
  },
  required: [
    "shotType",
    "confidence",
    "pose",
    "movement",
    "recommendations",
    "tags",
    "description",
  ],
} as const;

/**
 * Phân tích 1 video từ list frame base64
 */
export const analyzeVideo = async (
  base64Frames: string[]
): Promise<CombinedAnalysisResult> => {
  const prompt = `
    Bạn là một huấn luyện viên pickleball chuyên nghiệp với kiến thức sâu rộng về cơ sinh học.
    Phân tích chuỗi hình ảnh từ một video. Các hình ảnh được sắp xếp theo thứ tự thời gian và thể hiện một cú đánh duy nhất.
    Nhiệm vụ của bạn là thực hiện một phân tích toàn diện và trả về một đối tượng JSON duy nhất.
    1.  **Phân tích Kỹ thuật:**
        *   Phân loại loại cú đánh (ví dụ: cú smash, cú lốp, cú vô lê, v.v.).
        *   Phân tích chi tiết tư thế và chuyển động của người chơi (chuẩn bị, tiếp xúc, kết thúc).
        *   Đưa ra các đề xuất cụ thể để cải thiện kỹ thuật.
    2.  **Tạo Thẻ và Mô tả:**
        *   Tạo từ 1 đến 3 thẻ. Thẻ quan trọng nhất PHẢI là tên của kỹ thuật/cú đánh chính. Ví dụ: "Giao bóng" (Serve), "Bỏ nhỏ" (Dink), "Vô lê" (Volley). TUYỆT ĐỐI KHÔNG tạo thẻ về tư thế hoặc chuẩn bị.
        *   Viết một mô tả ngắn gọn (1-2 câu) tóm tắt hành động.

    Hãy trả lời CHỈ bằng một đối tượng JSON bằng tiếng Việt theo lược đồ đã cung cấp.`;

  const imageParts = base64Frames.map((frame) => ({
    inlineData: { mimeType: "image/jpeg", data: frame },
  }));

  try {
    const text = await callGemini({
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analyzeVideoSchema,
      },
    });

    return parseJsonResponse<CombinedAnalysisResult>(text);
  } catch (error) {
    console.error("Gemini API call failed in analyzeVideo:", error);
    throw new Error(
      "AI không thể xử lý video. Điều này có thể do sự cố mạng hoặc sự cố dịch vụ tạm thời. Vui lòng thử lại sau."
    );
  }
};

/**
 * ===== SCHEMA CHO SO SÁNH 2 VIDEO =====
 */

const comparisonDetailSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "string",
      description:
        "Phân tích chi tiết về kỹ thuật của người chơi trong giai đoạn này.",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách các điểm mạnh cụ thể.",
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách các điểm yếu cụ thể cần cải thiện.",
    },
    timestamp: {
      type: "number",
      description:
        "Dấu thời gian (tính bằng giây) trong video mà phân tích này áp dụng.",
    },
  },
  required: ["analysis", "strengths", "weaknesses", "timestamp"],
} as const;

const keyDifferenceSchema = {
  type: "object",
  properties: {
    aspect: {
      type: "string",
      description:
        "Khía cạnh kỹ thuật được so sánh (ví dụ: Dáng đứng, Vung vợt, Chuyển động chân).",
    },
    player1_technique: {
      type: "string",
      description: "Mô tả kỹ thuật của Huấn luyện viên.",
    },
    player2_technique: {
      type: "string",
      description: "Mô tả kỹ thuật của Học viên.",
    },
    impact: {
      type: "string",
      description: "Phân tích tác động của sự khác biệt này đối với cú đánh.",
    },
  },
  required: ["aspect", "player1_technique", "player2_technique", "impact"],
} as const;

const drillSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Tiêu đề của bài tập." },
    description: {
      type: "string",
      description: "Mô tả chi tiết về cách thực hiện bài tập.",
    },
    practice_sets: {
      type: "string",
      description:
        "Các hiệp thực hành được đề xuất (ví dụ: '3 hiệp, mỗi hiệp 10 lần lặp').",
    },
  },
  required: ["title", "description", "practice_sets"],
} as const;

const recommendationWithDrillSchema = {
  type: "object",
  properties: {
    recommendation: {
      type: "string",
      description: "Một đề xuất cụ thể để cải thiện.",
    },
    drill: drillSchema,
  },
  required: ["recommendation", "drill"],
} as const;

const poseLandmarkSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["name", "x", "y"],
} as const;

const compareVideosSchema = {
  type: "object",
  properties: {
    comparison: {
      type: "object",
      properties: {
        preparation: {
          type: "object",
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: "string" },
          },
          required: ["player1", "player2", "advantage"],
        },
        swingAndContact: {
          type: "object",
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: "string" },
          },
          required: ["player1", "player2", "advantage"],
        },
        followThrough: {
          type: "object",
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: "string" },
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
    summary: { type: "string" },
    recommendationsForPlayer2: {
      type: "array",
      items: recommendationWithDrillSchema,
    },
    overallScoreForPlayer2: {
      type: "number",
      description:
        "Điểm tổng thể cho kỹ thuật của Học viên trên thang điểm 10.",
    },
    coachPoses: {
      type: "array",
      description:
        "Một mảng chứa các mảng điểm khớp cho mỗi khung hình của huấn luyện viên.",
      items: {
        type: "array",
        items: poseLandmarkSchema,
      },
    },
    learnerPoses: {
      type: "array",
      description:
        "Một mảng chứa các mảng điểm khớp cho mỗi khung hình của học viên.",
      items: {
        type: "array",
        items: poseLandmarkSchema,
      },
    },
  },
  required: [
    "comparison",
    "keyDifferences",
    "summary",
    "recommendationsForPlayer2",
    "overallScoreForPlayer2",
    "coachPoses",
    "learnerPoses",
  ],
} as const;

/**
 * So sánh 2 video (coach vs learner)
 */
export const compareVideos = async (
  coachFrames: string[],
  coachTimestamps: number[],
  learnerFrames: string[],
  learnerTimestamps: number[]
): Promise<VideoComparisonResult> => {
  const prompt = `
    Bạn là một huấn luyện viên pickleball đẳng cấp thế giới, chuyên phân tích cơ sinh học. Nhiệm vụ của bạn là so sánh kỹ thuật giữa hai video: "Video Huấn luyện viên" và "Video Học viên".

    - Video 1 là của "Huấn luyện viên" (player1). Đây là video tham chiếu cho kỹ thuật đúng.
    - Video 2 là của "Học viên" (player2).
    - Trong cấu trúc JSON, "player1" PHẢI LUÔN là Huấn luyện viên và "player2" PHẢI LUÔN là Học viên.
    - Toàn bộ phân tích, bao gồm tóm tắt, đề xuất và điểm số, phải tập trung vào việc giúp "Học viên" (player2) cải thiện để giống với "Huấn luyện viên" (player1) hơn.

    Bạn được cung cấp ba khung hình cho mỗi video. Dấu thời gian cho các khung hình của Video Huấn luyện viên là ${coachTimestamps.join(
      ", "
    )} giây. Dấu thời gian cho các khung hình của Video Học viên là ${learnerTimestamps.join(
    ", "
  )} giây.
    Khung hình đầu tiên tương ứng với giai đoạn Chuẩn bị, khung hình thứ hai với Vung vợt & Tiếp xúc, và khung hình thứ ba với Kết thúc.

    Hãy thực hiện một phân tích cực kỳ chi tiết, song song. Đối với mỗi giai đoạn, hãy phân tích từng người chơi (Huấn luyện viên và Học viên), liệt kê các điểm mạnh và điểm yếu của họ. 
    
    ĐỒNG THỜI, đối với mỗi khung hình được cung cấp cho CẢ HAI người chơi, bạn PHẢI thực hiện ước tính tư thế và cung cấp tọa độ đã được chuẩn hóa (phạm vi 0-1) cho các điểm khớp chính trên cơ thể. Bao gồm dữ liệu này trong các trường 'coachPoses' và 'learnerPoses'. Các điểm khớp cần xác định là: nose, left_eye, right_eye, left_ear, right_ear, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle.

    Sau đó, xác định những khác biệt chính, tóm tắt lại và đưa ra các đề xuất mang tính xây dựng, bao gồm các bài tập thực hành cụ thể cho Học viên. Cuối cùng, chấm điểm tổng thể cho Học viên.

    Hãy trả lời CHỈ bằng một đối tượng JSON bằng tiếng Việt theo lược đồ đã cung cấp.`;

  const parts = [
    { text: "Khung hình từ Video Huấn luyện viên (player1):" },
    ...coachFrames.map((frame) => ({
      inlineData: { mimeType: "image/jpeg", data: frame },
    })),
    { text: "Khung hình từ Video Học viên (player2):" },
    ...learnerFrames.map((frame) => ({
      inlineData: { mimeType: "image/jpeg", data: frame },
    })),
    { text: prompt },
  ];

  try {
    const text = await callGemini({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: compareVideosSchema,
      },
    });

    return parseJsonResponse<VideoComparisonResult>(text);
  } catch (error) {
    console.error("Gemini API call failed in compareVideos:", error);
    throw new Error(
      "AI không thể xử lý video để so sánh. Điều này có thể do sự cố mạng hoặc sự cố dịch vụ tạm thời. Vui lòng thử lại sau."
    );
  }
};
