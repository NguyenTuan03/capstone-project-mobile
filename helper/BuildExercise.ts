import { Exercise, Session } from "@/types/session";

export const BuildExercise = (session: Session): Exercise[] => {
  const due = session.scheduleDate; // tạm dùng ngày buổi học làm hạn nộp
  const exercises: Exercise[] = [];

  // Map VIDEO => Bài tập video
  if (session.video) {
    const v = session.video;
    exercises.push({
      id: `video-${v.id}`,
      type: "video",
      title: `Bài tập Video: ${v.title}`,
      subtitle: v.description ?? undefined,
      hasSample: !!v.publicUrl,
      dueDate: due,
      submittedCount: 0, // TODO: map từ API submissions nếu có
    });
  }

  // Map QUIZ => Bài tập quiz
  if (session.quiz) {
    const q = session.quiz;
    exercises.push({
      id: `quiz-${q.id}`,
      type: "quiz",
      title: `Quiz: ${q.title}`,
      subtitle: q.description ?? undefined,
      hasSample: false,
      dueDate: due,
      submittedCount: 0, // TODO
    });
  }

  return exercises;
};
