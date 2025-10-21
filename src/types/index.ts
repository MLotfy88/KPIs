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
  gender: 'male' | 'female';
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
  notes?: string;
  nurse_name?: string;
  // scores and final_score are now in separate tables
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

// Represents a record in the new evaluation_items table
export interface EvaluationItem {
  id: string; // uuid
  item_key: string;
  question: string;
  category: string;
  evaluation_types?: EvaluationType[]; // Add this if not already present and needed
  rubrics?: Record<string, string>; // Add this
  created_at: string;
  updated_at?: string; // Add this for upsert operations
}

// Represents a record in the new evaluation_scores table
export interface EvaluationScore {
  id: string; // uuid
  evaluation_id: string;
  item_id: string;
  score: number;
}

// Represents the new structure of the badges table
export interface Badge {
  badge_id: string;
  badge_name: string;
  badge_icon?: string;
  description?: string;
  linked_metrics: string[]; // Array of item_key from evaluation_items
  criteria_type: 'average' | 'percentage' | 'improvement' | 'direct_assessment';
  thresholds: Record<string, any>; // Flexible JSONB for different criteria
  period_type: 'weekly' | 'monthly' | 'quarterly' | 'all_time';
  active: boolean;
  editable: boolean;
  created_at: string;
  updated_at: string;
}

export interface NurseBadge {
  id: string;
  nurse_id: string;
  badge_id: string;
  tier?: string;
  awarded_at: string;
  evaluation_id?: string;
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
