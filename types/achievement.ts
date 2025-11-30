export enum AchievementType {
  EVENT_COUNT = "EVENT_COUNT",
  PROPERTY_CHECK = "PROPERTY_CHECK",
  STREAK = "STREAK",
}

export interface Achievement {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LearnerAchievement {
  id: number;
  earnedAt: string;
  achievement: Achievement;
}

export interface PaginatedEarnedAchievements {
  items: LearnerAchievement[];
  page: number;
  pageSize: number;
  total: number;
}
