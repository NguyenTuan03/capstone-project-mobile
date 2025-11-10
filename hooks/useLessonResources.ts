import { useCallback, useEffect, useMemo, useState } from "react";

import { get } from "@/services/http/httpService";
import { QuizType } from "@/types/quiz";
import { VideoType } from "@/types/video";

type ApiCollection<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      metadata?: T[];
    };

const extractCollection = <T,>(payload: ApiCollection<T> | undefined): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.metadata)) return payload.metadata;
  return [];
};

export interface LessonResourcesState {
  quizzes: QuizType[];
  videos: VideoType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLessonResources = (
  lessonId?: number | null
): LessonResourcesState => {
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(() => typeof lessonId === "number" && lessonId > 0, [lessonId]);

  const fetchResources = useCallback(async () => {
    if (!canFetch) {
      setQuizzes([]);
      setVideos([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [videosRes, quizzesRes] = await Promise.allSettled([
        get<ApiCollection<VideoType>>(`/v1/videos/lessons/${lessonId}`),
        get<ApiCollection<QuizType>>(`/v1/quizzes/lessons/${lessonId}`),
      ]);

      if (videosRes.status === "fulfilled") {
        setVideos(extractCollection(videosRes.value.data));
      } else {
        console.error("Failed to fetch lesson videos:", videosRes.reason);
        setVideos([]);
        setError("Không thể tải video cho bài học này.");
      }

      if (quizzesRes.status === "fulfilled") {
        setQuizzes(extractCollection(quizzesRes.value.data));
      } else {
        console.error("Failed to fetch lesson quizzes:", quizzesRes.reason);
        setQuizzes([]);
        setError((prev) =>
          prev ? `${prev}\nKhông thể tải quiz cho bài học này.` : "Không thể tải quiz cho bài học này."
        );
      }
    } catch (err) {
      console.error("Unexpected error while fetching lesson resources:", err);
      setError("Đã xảy ra lỗi khi tải tài nguyên của bài học.");
      setVideos([]);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, lessonId]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  return {
    quizzes,
    videos,
    loading,
    error,
    refresh: fetchResources,
  };
};

export default useLessonResources;

