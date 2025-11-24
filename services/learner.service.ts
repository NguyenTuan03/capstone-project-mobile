import { get } from "@/services/http/httpService";
import { CourseStatus } from "@/types/course";
import {
  LearnerProgress,
  LearnerProgressDetails,
} from "@/types/learner-progress";

export const getAllCoachLearnerProgress = async (
  status: CourseStatus = CourseStatus.ON_GOING
): Promise<LearnerProgress[]> => {
  try {
    const res = await get<LearnerProgress[]>(
      `/v1/learner-progresses/coaches?courseStatus=${status}`
    );
    return (res.data as any).metadata || [];
  } catch (error) {
    console.error("Failed to fetch all coach learner progress:", error);
    return [];
  }
};

export const getLearnerProgressDetails = async (
  userId: number,
  courseId: number
): Promise<LearnerProgressDetails | null> => {
  try {
    const res = await get<LearnerProgressDetails>(
      `/v1/learner-progresses/coaches/details?userId=${userId}&courseId=${courseId}`
    );
    console.log("res.data", res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch learner progress details:", error);
    return null;
  }
};
