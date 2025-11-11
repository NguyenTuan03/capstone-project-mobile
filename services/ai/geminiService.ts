import { CombinedAnalysisResult, VideoComparisonResult } from "@/types/ai";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const model = "gemini-2.5-flash";

const parseJsonResponse = <T>(text: string): T => {
  try {
    const cleanedText = text.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse JSON response:", text, error);
    throw new Error(
      "Đã nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại."
    );
  }
};

const analyzeVideoSchema = {
  type: Type.OBJECT,
  properties: {
    shotType: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    pose: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        feedback: { type: Type.STRING },
      },
      required: ["summary", "feedback"],
    },
    movement: {
      type: Type.OBJECT,
      properties: {
        preparation: { type: Type.STRING },
        contact: { type: Type.STRING },
        followThrough: { type: Type.STRING },
      },
      required: ["preparation", "contact", "followThrough"],
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    description: { type: Type.STRING },
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
    inlineData: { mimeType: "image/jpeg", data: frame },
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [...imageParts, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analyzeVideoSchema,
      },
    });

    const text = response.text;
    if (typeof text !== "string") {
      throw new Error("Không nhận được phản hồi hợp lệ từ AI.");
    }

    return parseJsonResponse<CombinedAnalysisResult>(text);
  } catch (error) {
    console.error("Gemini API call failed in analyzeVideo:", error);
    throw new Error(
      "AI không thể xử lý video. Điều này có thể do sự cố mạng hoặc sự cố dịch vụ tạm thời. Vui lòng thử lại sau."
    );
  }
};

const comparisonDetailSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description:
        "Phân tích chi tiết về kỹ thuật của người chơi trong giai đoạn này.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách các điểm mạnh cụ thể.",
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách các điểm yếu cụ thể cần cải thiện.",
    },
    timestamp: {
      type: Type.NUMBER,
      description:
        "Dấu thời gian (tính bằng giây) trong video mà phân tích này áp dụng.",
    },
  },
  required: ["analysis", "strengths", "weaknesses", "timestamp"],
};

const keyDifferenceSchema = {
  type: Type.OBJECT,
  properties: {
    aspect: {
      type: Type.STRING,
      description:
        "Khía cạnh kỹ thuật được so sánh (ví dụ: Dáng đứng, Vung vợt, Chuyển động chân).",
    },
    player1_technique: {
      type: Type.STRING,
      description: "Mô tả kỹ thuật của Huấn luyện viên.",
    },
    player2_technique: {
      type: Type.STRING,
      description: "Mô tả kỹ thuật của Học viên.",
    },
    impact: {
      type: Type.STRING,
      description: "Phân tích tác động của sự khác biệt này đối với cú đánh.",
    },
  },
  required: ["aspect", "player1_technique", "player2_technique", "impact"],
};

const drillSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Tiêu đề của bài tập." },
    description: {
      type: Type.STRING,
      description: "Mô tả chi tiết về cách thực hiện bài tập.",
    },
    practice_sets: {
      type: Type.STRING,
      description:
        "Các hiệp thực hành được đề xuất (ví dụ: '3 hiệp, mỗi hiệp 10 lần lặp').",
    },
  },
  required: ["title", "description", "practice_sets"],
};

const recommendationWithDrillSchema = {
  type: Type.OBJECT,
  properties: {
    recommendation: {
      type: Type.STRING,
      description: "Một đề xuất cụ thể để cải thiện.",
    },
    drill: drillSchema,
  },
  required: ["recommendation", "drill"],
};

const poseLandmarkSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
  },
  required: ["name", "x", "y"],
};

const compareVideosSchema = {
  type: Type.OBJECT,
  properties: {
    comparison: {
      type: Type.OBJECT,
      properties: {
        preparation: {
          type: Type.OBJECT,
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: Type.STRING },
          },
          required: ["player1", "player2", "advantage"],
        },
        swingAndContact: {
          type: Type.OBJECT,
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: Type.STRING },
          },
          required: ["player1", "player2", "advantage"],
        },
        followThrough: {
          type: Type.OBJECT,
          properties: {
            player1: comparisonDetailSchema,
            player2: comparisonDetailSchema,
            advantage: { type: Type.STRING },
          },
          required: ["player1", "player2", "advantage"],
        },
      },
      required: ["preparation", "swingAndContact", "followThrough"],
    },
    keyDifferences: {
      type: Type.ARRAY,
      items: keyDifferenceSchema,
    },
    summary: { type: Type.STRING },
    recommendationsForPlayer2: {
      type: Type.ARRAY,
      items: recommendationWithDrillSchema,
    },
    overallScoreForPlayer2: {
      type: Type.NUMBER,
      description:
        "Điểm tổng thể cho kỹ thuật của Học viên trên thang điểm 10.",
    },
    coachPoses: {
      type: Type.ARRAY,
      description:
        "Một mảng chứa các mảng điểm khớp cho mỗi khung hình của huấn luyện viên.",
      items: {
        type: Type.ARRAY,
        items: poseLandmarkSchema,
      },
    },
    learnerPoses: {
      type: Type.ARRAY,
      description:
        "Một mảng chứa các mảng điểm khớp cho mỗi khung hình của học viên.",
      items: {
        type: Type.ARRAY,
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

    Hãy trả lời CHỈ bằng một đối tượng JSON bằng tiếng Việt theo lược đồ đã cung cấp.
    - Trong 'comparison', 'analysis' phải là một đoạn văn chi tiết. 'strengths' và 'weaknesses' phải là các điểm gạch đầu dòng ngắn gọn.
    - Đối với mỗi phân tích, bạn PHẢI bao gồm dấu thời gian tương ứng trong khóa 'timestamp'.
    - 'keyDifferences' phải nêu bật 2-3 khác biệt quan trọng nhất.
    - 'recommendationsForPlayer2' phải bao gồm một bài tập thực hành ('drill') cho mỗi đề xuất. Mỗi 'drill' phải là một đối tượng có 'title', 'description' và 'practice_sets'.
    - 'overallScoreForPlayer2' phải là một con số từ 1 đến 10.
    - 'coachPoses' và 'learnerPoses' phải là mảng của các mảng, trong đó mỗi mảng con chứa các điểm khớp cho một khung hình.`;

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
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: compareVideosSchema,
      },
    });

    const text = response.text;
    if (typeof text !== "string") {
      throw new Error("Không nhận được phản hồi hợp lệ từ AI.");
    }

    return parseJsonResponse<VideoComparisonResult>(text);
  } catch (error) {
    console.error("Gemini API call failed in compareVideos:", error);
    throw new Error(
      "AI không thể xử lý video để so sánh. Điều này có thể do sự cố mạng hoặc sự cố dịch vụ tạm thời. Vui lòng thử lại sau."
    );
  }
};
