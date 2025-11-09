export type Session = {
  id: number;
  name: string;
  description: string;
  sessionNumber: number;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  durationInMinutes: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  completedAt: string | null;
  lesson: {
    id: number;
    name: string;
    description: string;
    lessonNumber: number;
    duration: number;
    videos: {
      id: number;
      title: string;
      description: string;
      duration: number;
      publicUrl: string;
      thumbnailUrl: string;
      status: string;
    }[];
    quizzes: {
      id: number;
      title: string;
      description: string;
      totalQuestions: number;
    }[];
  } | null;
  attendances: unknown[];
  quizzes: unknown[];
  videos: unknown[];
};
