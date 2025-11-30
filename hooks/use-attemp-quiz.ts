// hooks/useAttemptQuiz.ts
import { AxiosError } from "axios";
import { useCallback, useState } from "react";

import { post } from "../services/http/httpService";

type AttemptPayload = {
  learnerAnswers: { question: number; questionOption: number }[];
};

type AttemptResult = {
  score?: number;
};

export function useAttemptQuiz() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAttempt = useCallback(
    async (
      quizId: number,
      payload: AttemptPayload
    ): Promise<AttemptResult | null> => {
      setSubmitting(true);
      setError(null);
      try {
        const doPost = async (path: string) => {
          const res = await post(path, payload);
          
          return res.data.metadata;
        };

        // chuẩn: /attempts ; fallback: /attemps
        let data: any;
        try {
          data = await doPost(`/v1/quizzes/${quizId}/attempts`);
        } catch (err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          // Nếu lỗi 404 hoặc path không tồn tại, thử fallback
          if (axiosError.response?.status === 404) {
            try {
              data = await doPost(`/v1/quizzes/${quizId}/attemps`);
            } catch (fallbackErr) {
              const fallbackError = fallbackErr as AxiosError<{
                message?: string;
              }>;
              const errorMessage =
                fallbackError.response?.data?.message ||
                fallbackError.message ||
                `HTTP ${fallbackError.response?.status || "Unknown"}`;
              throw new Error(errorMessage);
            }
          } else {
            const errorMessage =
              axiosError.response?.data?.message ||
              axiosError.message ||
              `HTTP ${axiosError.response?.status || "Unknown"}`;
            throw new Error(errorMessage);
          }
        }

        // Chuẩn hoá kết quả để UI xài (BE bạn có thể trả khác)
        return {
          score: Number(data?.score ?? 0),
        };
      } catch (e: any) {
        setError(e?.message || "Submit thất bại");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitAttempt, submitting, error };
}
