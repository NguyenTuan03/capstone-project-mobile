// /d:/Code/Project/capstone-project-mobile/types/question-option.ts
// Lightweight TypeScript types for QuestionOption (separated for single-responsibility)

export interface QuestionOptionType {
  id?: number;
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
  Omit<QuestionOptionType, 'questionId' | 'id'>
> & {
  id?: number;
};
