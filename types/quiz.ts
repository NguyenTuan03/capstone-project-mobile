export interface QuizOptionType {
  id?: number;
  content: string;
  isCorrect: boolean;
  createdAt?: string;
}

export interface QuizQuestionType {
  id: number;
  title: string;
  explanation?: string | null;
  createdAt?: string;
  options: QuizOptionType[];
}

export interface QuizCreatorSummary {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  profilePicture?: string | null;
}

export interface QuizType {
  id: number;
  title: string;
  description?: string | null;
  totalQuestions: number;
  questions: QuizQuestionType[];
  createdBy?: QuizCreatorSummary | null;
  deletedAt?: string | null;
}

export interface QuizFormDTO {
  title: string;
  description?: string | null;
  totalQuestions: number;
  questions: (Partial<Omit<QuizQuestionType, "quizId" | "id">> & {
    id?: number;
  })[];
  lessonId?: number | null;
  sessionId?: number | null;
}

export interface QuestionOptionType {
  id: number;
  content: string;
  isCorrect: boolean;
  questionId?: number;
}
