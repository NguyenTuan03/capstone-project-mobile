// services/ai/geminiService.ts
import type { CombinedAnalysisResult, VideoComparisonResult } from "@/types/ai";

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

        // 🔥 Nếu 503 (overloaded) và còn retry, thử lại với wait time dài hơn
        if (res.status === 503 && attempt < retries) {
          const waitTime = attempt * 5000; // 5s, 10s, 15s, 20s, 25s
          console.log(`⏳ Server overloaded, retrying in ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }

        // 🔥 Nếu 429 (rate limit) và còn retry
        if (res.status === 429 && attempt < retries) {
          const waitTime = attempt * 3000; // 3s, 6s, 9s...
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
      // Nếu là lỗi network và còn retry
      if (attempt < retries && error instanceof TypeError) {
        console.log(`⏳ Network error, retrying in 3s...`);
        await sleep(3000);
        continue;
      }

      // Nếu hết retry hoặc lỗi khác, throw
      throw error;
    }
  }

  throw new Error(
    "Đã thử lại nhiều lần nhưng vẫn thất bại. Vui lòng thử lại sau."
  );
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
};

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
    inline_data: {
      mime_type: "image/jpeg",
      data: frame,
    },
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
        response_mime_type: "application/json",
        response_schema: analyzeVideoSchema,
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
    analysis: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    timestamp: { type: "number" },
  },
  required: ["analysis", "strengths", "weaknesses", "timestamp"],
};

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
      items: {
        type: "object",
        properties: {
          aspect: { type: "string" },
          player1_technique: { type: "string" },
          player2_technique: { type: "string" },
          impact: { type: "string" },
        },
        required: [
          "aspect",
          "player1_technique",
          "player2_technique",
          "impact",
        ],
      },
    },
    summary: { type: "string" },
    recommendationsForPlayer2: {
      type: "array",
      items: {
        type: "object",
        properties: {
          recommendation: { type: "string" },
          drill: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              practice_sets: { type: "string" },
            },
            required: ["title", "description", "practice_sets"],
          },
        },
        required: ["recommendation", "drill"],
      },
    },
    overallScoreForPlayer2: { type: "number" },
    coachPoses: {
      type: "array",
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
          },
          required: ["name", "x", "y"],
        },
      },
    },
    learnerPoses: {
      type: "array",
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
          },
          required: ["name", "x", "y"],
        },
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
};

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
      inline_data: { mime_type: "image/jpeg", data: frame },
    })),
    { text: "Khung hình từ Video Học viên (player2):" },
    ...learnerFrames.map((frame) => ({
      inline_data: { mime_type: "image/jpeg", data: frame },
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
        response_mime_type: "application/json",
        response_schema: compareVideosSchema,
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
