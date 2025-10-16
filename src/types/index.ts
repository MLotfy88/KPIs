export type UserRole = 'manager' | 'supervisor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photo_url?: string;
  is_active: boolean;
}

export interface Nurse {
  id: string;
  name: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EvaluationType = 'weekly' | 'monthly';

export interface Evaluation {
  id: string;
  nurse_id: string;
  supervisor_id: string;
  evaluation_type: EvaluationType;
  created_at: string;
  scores: Record<string, number>;
  notes: string;
  final_score: number;
  nurse_name?: string;
}

export interface Audit {
  id: string;
  evaluation_id: string;
  auditor_id: string;
  is_match: boolean;
  auditor_notes: string;
  decision: 'accepted' | 'modified' | 'rejected';
  created_at: string;
}

export interface EvaluationItem {
  id: number;
  text: string;
  category: 'technical' | 'behavioral' | 'care' | 'initiative';
  weight?: number;
}

export type BadgeIcon = 'Award' | 'Star' | 'Zap' | 'Shield' | 'TrendingUp';
export type BadgeColor = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeCriteria {
  type: 'average_score' | 'specific_score' | 'consistency';
  value: number;
  period?: number; // e.g., number of evaluations
  operator: 'gte' | 'lte' | 'eq';
  evaluation_type?: EvaluationType;
}

export interface BadgeTier {
  name: BadgeColor;
  criteria: BadgeCriteria;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  tiers: BadgeTier[];
}

export interface NurseBadge {
  id: string;
  nurse_id: string;
  badge_id: string;
  tier: string;
  awarded_at: string;
}

export interface Notification {
  id: number;
  userId: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface ImprovementPlanAction {
  description: string;
  due_date: string;
  completed: boolean;
}

export interface ImprovementPlanUpdate {
  date: string;
  notes: string;
  author_id: string;
}

export interface ImprovementPlan {
  id: string;
  nurse_id: string;
  manager_id: string;
  created_at: string;
  goal: string;
  status: 'active' | 'completed' | 'cancelled';
  actions: ImprovementPlanAction[];
  progress_updates: ImprovementPlanUpdate[];
  nurse_name?: string; 
}
