// /d:/Code/Project/capstone-project-mobile/types/question.ts
// Lightweight TypeScript types for the Question entity (use in frontend / shared code)


import {
    QuestionOptionFormDTO,
    QuestionOptionType,
} from './question-option';

export interface LearnerAnswerType {
  id: number;
  learnerId?: number;
  questionId?: number;
  // selected option (if multiple choice)
  selectedOptionId?: number | null;
  // free text answer (if applicable)
  textAnswer?: string | null;
  createdAt?: string; // ISO datetime
}

/**
 * Question type used across the app.
 * - Mirrors the DB entity but uses simpler nested summaries to avoid circular imports.
 */
export interface QuestionType {
  id: number;
  title: string;
  explanation?: string | null;
  // eager-loaded options from the server
  options: QuestionOptionType[];
  // relation back to quiz (optional for client-side)
  quizId?: number;
  // learner answers (optional for views that include them)
  learnerAnswers?: LearnerAnswerType[];
}

/**
 * DTO used when creating/updating a question from the client.
 * Options can be provided inline; id should be omitted for new items.
 */
export interface QuestionFormDTO {
  title: string;
  explanation?: string | null;
  options: (Partial<Omit<QuestionOptionType, 'questionId' | 'id'>> & {
    id?: number;
  })[];
  quizId?: number | null;
}

export { QuestionOptionFormDTO, QuestionOptionType };

