import { useCallback, useEffect, useMemo, useState } from "react";

import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { VideoType } from "@/types/video";

type ApiCollection<T> = T;

const extractCollection = <T>(
  payload: ApiCollection<T> | undefined
): T | undefined => {
  if (!payload) return undefined;
  return payload;
};

export interface LessonResourcesState {
  quiz: QuizType | undefined;
  video: VideoType | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLessonResources = (
  lessonId?: number | null
): LessonResourcesState => {
  const [quiz, setQuiz] = useState<QuizType | undefined>(undefined);
  const [video, setVideo] = useState<VideoType | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(
    () => typeof lessonId === "number" && lessonId > 0,
    [lessonId]
  );

  const fetchResources = useCallback(async () => {
    if (!canFetch) {
      setQuiz(undefined);
      setVideo(undefined);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [videoRes, quizRes] = await Promise.allSettled([
        get<ApiCollection<VideoType>>(`/v1/videos/sessions/${lessonId}`),
        get<ApiCollection<QuizType>>(`/v1/quizzes/sessions/${lessonId}`),
      ]);

      if (videoRes.status === "fulfilled") {
        setVideo(extractCollection(videoRes.value.data));
      } else {
         
        setVideo(undefined);
        setError("Không thể tải video cho bài học này.");
      }

      if (quizRes.status === "fulfilled") {
        setQuiz(extractCollection(quizRes.value.data));
      } else {
         
        setQuiz(undefined);
        setError((prev) =>
          prev
            ? `${prev}\nKhông thể tải quiz cho bài học này.`
            : "Không thể tải quiz cho bài học này."
        );
      }
    } catch (err) {
       
      setError("Đã xảy ra lỗi khi tải tài nguyên của bài học.");
      setVideo(undefined);
      setQuiz(undefined);
    } finally {
      setLoading(false);
    }
  }, [canFetch, lessonId]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  return {
    quiz,
    video,
    loading,
    error,
    refresh: fetchResources,
  };
};

export default useLessonResources;
