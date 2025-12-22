export interface AiSubjectGeneration {
  id: number;
  prompt: string;
  generatedData: AiSubjectGenerationResponse;
  status: AiSubjectGenerationStatus;
  requestedBy: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string | null;
  };
  createdSubject?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AiSubjectGenerationResponse {
  name: string;
  description: string;
  level: PickleballLevel;
  lessons: {
    name: string;
    description: string;
    lessonNumber: number;
    video: {
      title: string;
      description: string;
      tags?: string[];
      drillName?: string;
      drillDescription?: string;
      drillPracticeSets?: string;
      createInstructions?: string;
    };
    quiz: {
      title: string;
      description: string;
      questions: {
        title: string;
        explanation: string;
        options: {
          content: string;
          isCorrect: boolean;
        }[];
      }[];
    };
  }[];
}

export enum AiSubjectGenerationStatus {
  PENDING = "PENDING",
  USED = "USED",
}

export enum PickleballLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export interface PaginatedAiGenerations {
  items: AiSubjectGeneration[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage?: number;
  previousPage?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
