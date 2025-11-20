import { Exercise, Session } from "@/types/session";
import type { VideoType } from "@/types/video";

export const BuildExercise = (session: Session): Exercise[] => {
  const due = session.scheduleDate; // tạm dùng ngày buổi học làm hạn nộp
  const exercises: Exercise[] = [];

  const getCoachVideos = (): VideoType[] => {
    return Array.isArray(session.videos) ? session.videos : [];
  };

  // Map VIDEO => Bài tập video
  getCoachVideos().forEach((v, idx) => {
    exercises.push({
      id: `video-${v.id}`,
      type: "video",
      title: `Bài tập ${idx + 1}: ${v.title}`,
      subtitle: v.description ?? undefined,
      hasSample: !!v.publicUrl,
      dueDate: due,
      submittedCount: 0, // TODO: map từ API submissions nếu có
      // Handlers are injected at the component layer to avoid hooks in helpers
    });
  });

  // Map QUIZ => Bài tập quiz
  (session?.quizzes ?? []).forEach((q, idx) => {
    exercises.push({
      id: `quiz-${q.id}`,
      type: "quiz",
      title: `Quiz ${idx + 1}: ${q.title}`,
      subtitle: q.description ?? undefined,
      hasSample: false,
      dueDate: due,
      submittedCount: 0, // TODO
      // Handlers are injected at the component layer to avoid hooks in helpers
    });
  });

  return exercises;
};
