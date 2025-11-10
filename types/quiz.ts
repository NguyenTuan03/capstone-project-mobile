// /d:/Code/Project/capstone-project-mobile/types/quiz.ts
// Lightweight TypeScript types for the Quiz entity (use in frontend / shared code)

export interface QuestionType {
  id: number;
  // question text / prompt
  content: string;
  // optional: array of option texts (if applicable)
  options?: string[];
  // index of correct option (if applicable)
  correctIndex?: number | null;
  // relation back to quiz (optional for client-side)
  quizId?: number;
}

export interface UserSummary {
  id: number;
  name?: string;
  email?: string;
}

export interface LessonSummary {
  id: number;
  title?: string;
}

export interface SessionSummary {
  id: number;
  title?: string;
  startsAt?: string; // ISO datetime
}

/**
 * Quiz type used across the app.
 * - Mirrors the DB entity but uses simpler nested summaries to avoid circular imports.
 */
export interface QuizType {
  id: number;
  title: string;
  description?: string | null;
  totalQuestions: number;
  questions: QuestionType[];
  createdBy: UserSummary;
  deletedAt?: string | null;
  lesson?: LessonSummary | null;
  session?: SessionSummary | null;
}

/**
 * DTO used when creating/updating a quiz from the client.
 * Questions can be provided inline; id should be omitted for new items.
 */
export interface QuizFormDTO {
  title: string;
  description?: string | null;
  totalQuestions: number;
  // for create/update, question ids are optional (new questions have no id)
  questions: (Partial<Omit<QuestionType, "quizId" | "id">> & {
    id?: number;
  })[];
  // either lessonId or sessionId (mutually exclusive)
  lessonId?: number | null;
  sessionId?: number | null;
}

export interface QuestionOptionType {
  id: number;
  content: string;
  isCorrect: boolean;
  // optional relation back to question (client-side)
  questionId?: number;
}

/**
 * Helper DTO for question option when used in forms (create/update).
 * New items omit id.
 */
export type QuestionOptionFormDTO = Partial<
  Omit<QuestionOptionType, "questionId" | "id">
> & {
  id?: number;
};
