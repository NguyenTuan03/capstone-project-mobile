export interface QuizOptionType {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface QuizQuestionType {
  id: number;
  title: string;
  explanation?: string | null;
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

