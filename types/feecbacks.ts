export type Feedback = {
  id?: number;
  comment: string;
  rating: number;
  isAnonymous: boolean;
  course_id: number;
  created_by: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
};
