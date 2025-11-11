
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CombinedAnalysisResult, VideoComparisonResult } from "@/types/ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL = "gemini-1.5-flash";

const getModel = () => genAI.getGenerativeModel({ model: MODEL });

const parseJsonResponse = <T>(text: string): T => {
  try {
    const cleaned = text.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON response:", text, err);
    throw new Error("Đã nhận phản hồi không hợp lệ từ AI. Thử lại nhé.");
  }
};

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
    recommendations: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
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

export const analyzeVideo = async (
  base64Frames: string[]
): Promise<CombinedAnalysisResult> => {
  const prompt = `
Bạn là HLV pickleball, phân tích chuỗi ảnh (1 cú đánh). Trả về JSON theo schema.
1) Phân loại cú đánh + phân tích tư thế (chuẩn bị/tiếp xúc/kết thúc) + khuyến nghị.
2) Sinh 1–3 thẻ (tên kỹ thuật chính), và 1–2 câu mô tả ngắn.
Chỉ trả JSON (tiếng Việt) đúng schema.`;

  const parts = [
    ...base64Frames.map((frame) => ({
      inlineData: { mimeType: "image/jpeg", data: frame },
    })),
    { text: prompt },
  ];

  try {
    const model = getModel();
    const res = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analyzeVideoSchema as any,
      },
    });

    const text = res.response.text();
    return parseJsonResponse<CombinedAnalysisResult>(text);
  } catch (err) {
    console.error("Gemini analyzeVideo error:", err);
    throw new Error(
      "AI không xử lý được video lúc này. Có thể do mạng hoặc dịch vụ. Thử lại sau nhé."
    );
  }
};

const comparisonDetailSchema = {
  type: "object",
  properties: {
    analysis: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    timestamp: { type: "number" },
  },
  required: ["analysis", "strengths", "weaknesses", "timestamp"],
} as const;

const keyDifferenceSchema = {
  type: "object",
  properties: {
    aspect: { type: "string" },
    player1_technique: { type: "string" },
    player2_technique: { type: "string" },
    impact: { type: "string" },
  },
  required: ["aspect", "player1_technique", "player2_technique", "impact"],
} as const;

const drillSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    practice_sets: { type: "string" },
  },
  required: ["title", "description", "practice_sets"],
} as const;

const recommendationWithDrillSchema = {
  type: "object",
  properties: {
    recommendation: { type: "string" },
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
    keyDifferences: { type: "array", items: keyDifferenceSchema },
    summary: { type: "string" },
    recommendationsForPlayer2: {
      type: "array",
      items: recommendationWithDrillSchema,
    },
    overallScoreForPlayer2: { type: "number" },
    coachPoses: {
      type: "array",
      items: { type: "array", items: poseLandmarkSchema },
    },
    learnerPoses: {
      type: "array",
      items: { type: "array", items: poseLandmarkSchema },
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

export const compareVideos = async (
  coachFrames: string[],
  coachTimestamps: number[],
  learnerFrames: string[],
  learnerTimestamps: number[]
): Promise<VideoComparisonResult> => {
  const prompt = `
Bạn là HLV đẳng cấp, so sánh kỹ thuật player1 (Huấn luyện viên) vs player2 (Học viên).
- Timestamps coach: ${coachTimestamps.join(", ")} (giây)
- Timestamps learner: ${learnerTimestamps.join(", ")} (giây)
Giai đoạn: Chuẩn bị / Vung & Tiếp xúc / Kết thúc.
BẮT BUỘC trả JSON đúng schema, tiếng Việt. Phải có 'coachPoses'/'learnerPoses' (0..1).`;

  const parts = [
    { text: "Khung hình từ Video Huấn luyện viên (player1):" },
    ...coachFrames.map((f) => ({
      inlineData: { mimeType: "image/jpeg", data: f },
    })),
    { text: "Khung hình từ Video Học viên (player2):" },
    ...learnerFrames.map((f) => ({
      inlineData: { mimeType: "image/jpeg", data: f },
    })),
    { text: prompt },
  ];

  try {
    const model = getModel();
    const res = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: compareVideosSchema as any,
      },
    });

    const text = res.response.text();
    return parseJsonResponse<VideoComparisonResult>(text);
  } catch (err) {
    console.error("Gemini compareVideos error:", err);
    throw new Error(
      "AI không xử lý được so sánh video lúc này. Thử lại sau nhé."
    );
  }
};
