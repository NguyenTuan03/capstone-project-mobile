export interface AchievementStats {
  totalEarned: number;
  totalInProgress: number;
  completionRate: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
  createdAt: string;
  eventName?: string;
  entityName?: string;
  propertyName?: string;
  comparisonOperator?: string;
  targetValue?: string;
  type?: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  currentProgress: number;
  updatedAt: string;
  isEarned: boolean;
}

export interface EarnedAchievement {
  id: number;
  achievement: Achievement;
  earnedAt: string;
  userId: number;
  userFullName: string;
}

export interface EarnedAchievementsResponse {
  data: EarnedAchievement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AllAchievementsResponse {
  data: AchievementProgress[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TabType = "all" | "earned" | "progress";

