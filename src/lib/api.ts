// src/lib/api.ts

/**
 * This file will abstract the data access layer.
 * It will have two modes: 'local' and 'supabase'.
 * Based on a configuration flag, it will either use mock data (local)
 * or the actual Supabase client.
 */

import { supabase } from './supabase';
import { Evaluation, EvaluationItem, Nurse, User, Audit, Badge, NurseBadge, Notification, ImprovementPlan } from '@/types';
import { notifyNewEvaluation, notifyEvaluationAudited, notifyBadgeAwarded } from './notifications';

// --- Auth Functions ---
export const getUserByEmail = async (email: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
}


// --- API Functions ---

export const getActiveNurses = async (): Promise<Nurse[]> => {
  const { data, error } = await supabase.from('nurses').select('*').eq('is_active', true);
  if (error) throw new Error(error.message);
  return data;
};

export const getEvaluationItems = async (evaluationType: 'weekly' | 'monthly'): Promise<EvaluationItem[]> => {
  const { data, error } = await supabase
    .from('evaluation_items')
    .select('*')
    .contains('evaluation_types', [evaluationType]);
  
  if (error) throw new Error(error.message);
  return data;
};

// This is the new type for the function argument, reflecting the UI data structure
type EvaluationSubmission = Omit<Evaluation, 'id' | 'created_at' | 'nurse_name'> & {
  scores: Record<string, number>; // e.g., { "uniform_check": 5, "patient_care": 4 }
};

export const saveEvaluation = async (evaluationData: EvaluationSubmission): Promise<Evaluation> => {
  const { scores, ...evaluationCore } = evaluationData;

  // Step 1: Insert the core evaluation record without scores
  const { data: newEvaluation, error: evaluationError } = await supabase
    .from('evaluations')
    .insert(evaluationCore)
    .select()
    .single();

  if (evaluationError) throw new Error(`Failed to save evaluation: ${evaluationError.message}`);
  if (!newEvaluation) throw new Error('Failed to get new evaluation record.');

  // Step 2: Fetch the IDs for the evaluation items based on their keys (from the scores object)
  const itemKeys = Object.keys(scores);
  const { data: items, error: itemsError } = await supabase
    .from('evaluation_items')
    .select('id, item_key')
    .in('item_key', itemKeys);
  
  if (itemsError) throw new Error(`Failed to fetch evaluation items: ${itemsError.message}`);
  if (!items || items.length !== itemKeys.length) throw new Error('Mismatch in evaluation items found.');

  const itemIdMap = new Map(items.map(item => [item.item_key, item.id]));

  // Step 3: Prepare and insert the individual scores into the evaluation_scores table
  const scoresToInsert = itemKeys.map(key => ({
    evaluation_id: newEvaluation.id,
    item_id: itemIdMap.get(key),
    score: scores[key],
  }));

  const { error: scoresError } = await supabase.from('evaluation_scores').insert(scoresToInsert);
  if (scoresError) throw new Error(`Failed to save scores: ${scoresError.message}`);

  // Step 4: Handle notifications (existing logic)
  const { data: nurseData, error: nurseError } = await supabase.from('nurses').select('name').eq('id', newEvaluation.nurse_id).single();
  if (nurseError) console.error('Error fetching nurse name for notification:', nurseError);

  const { data: supervisorData, error: supervisorError } = await supabase.from('profiles').select('*').eq('id', newEvaluation.supervisor_id).single();
  if (supervisorError) console.error('Error fetching supervisor for notification:', supervisorError);

  if (newEvaluation && nurseData && supervisorData) {
      const { data: managers, error: managersError } = await supabase.from('profiles').select('*').eq('role', 'manager');
      if (managersError) console.error('Error fetching managers for notification:', managersError);
      if (managers) {
          await notifyNewEvaluation(newEvaluation.id, nurseData.name, supervisorData, managers);
      }
  }

  return newEvaluation;
};

export const getSupervisorEvaluations = async (supervisorId: string): Promise<Evaluation[]> => {
    const { data, error } = await supabase
        .from('evaluations')
        .select(`
            *, 
            nurse:nurses (name),
            scores:evaluation_scores ( score, item:evaluation_items (item_key) )
        `)
        .eq('supervisor_id', supervisorId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // @ts-ignore
    return data.map(e => {
        const scoresObj = e.scores.reduce((acc, s) => {
            // @ts-ignore
            acc[s.item.item_key] = s.score;
            return acc;
        }, {});
        const final_score = Object.values(scoresObj).reduce((sum: number, score: any) => sum + score, 0) / Object.values(scoresObj).length;

        return { 
            ...e, 
            nurse_name: e.nurse.name, 
            scores: scoresObj,
            final_score: isNaN(final_score) ? 0 : final_score,
            nurses: undefined 
        };
    });
};

export const getAllNurses = async (): Promise<Nurse[]> => {
  const { data, error } = await supabase.from('nurses').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const addNurse = async (nurseData: Omit<Nurse, 'id' | 'created_at' | 'updated_at'>): Promise<Nurse> => {
  const { data, error } = await supabase.from('nurses').insert(nurseData).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export const updateNurse = async (nurseId: string, nurseData: Partial<Omit<Nurse, 'id' | 'created_at'>>): Promise<Nurse> => {
  const { data, error } = await supabase.from('nurses').update(nurseData).eq('id', nurseId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteNurse = async (nurseId: string): Promise<void> => {
  const { error } = await supabase.from('nurses').delete().eq('id', nurseId);
  if (error) throw new Error(error.message);
};

export const getSupervisorById = async (id: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
}

export const getNurseById = async (id: string): Promise<Nurse | null> => {
  const { data, error } = await supabase.from('nurses').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
};

export const getEvaluationsByNurseId = async (nurseId: string): Promise<Evaluation[]> => {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
        *,
        scores:evaluation_scores ( score, item:evaluation_items (item_key, question, category) )
    `)
    .eq('nurse_id', nurseId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // @ts-ignore
  return data.map(e => {
    const scoresObj = e.scores.reduce((acc, s) => {
        // @ts-ignore
        acc[s.item.item_key] = s.score;
        return acc;
    }, {});
    const final_score = Object.values(scoresObj).reduce((sum: number, score: any) => sum + score, 0) / Object.values(scoresObj).length;

    return { 
        ...e, 
        scores: scoresObj,
        final_score: isNaN(final_score) ? 0 : final_score,
    };
  });
};

export const getAllEvaluations = async (): Promise<Evaluation[]> => {
    const { data, error } = await supabase
        .from('evaluations')
        .select(`
            *,
            nurse:nurses (name),
            supervisor:profiles (name),
            scores:evaluation_scores ( score, item:evaluation_items (item_key) )
        `);
        
    if (error) throw new Error(error.message);

    // @ts-ignore
    return data.map(e => {
        const scoresObj = e.scores.reduce((acc, s) => {
            // @ts-ignore
            acc[s.item.item_key] = s.score;
            return acc;
        }, {});
        const final_score = Object.values(scoresObj).reduce((sum: number, score: any) => sum + score, 0) / Object.values(scoresObj).length;

        return { 
            ...e, 
            nurse_name: e.nurse.name,
            supervisor_name: e.supervisor.name,
            scores: scoresObj,
            final_score: isNaN(final_score) ? 0 : final_score,
        };
    });
}

export const getAllAudits = async (): Promise<Audit[]> => {
  const { data, error } = await supabase.from('audits').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const saveAudit = async (auditData: Omit<Audit, 'id' | 'created_at'>): Promise<Audit> => {
  const { data, error } = await supabase.from('audits').insert(auditData).select().single();
  if (error) throw new Error(error.message);

  const { data: evaluationData, error: evalError } = await supabase.from('evaluations').select('nurse_id, supervisor_id').eq('id', auditData.evaluation_id).single();
  if (evalError) console.error('Error fetching evaluation for notification:', evalError);

  const { data: auditorData, error: auditorError } = await supabase.from('profiles').select('*').eq('id', auditData.auditor_id).single();
  if (auditorError) console.error('Error fetching auditor for notification:', auditorError);
  
  if (data && evaluationData && auditorData) {
    const { data: nurseData, error: nurseError } = await supabase.from('nurses').select('name').eq('id', evaluationData.nurse_id).single();
    if (nurseError) console.error('Error fetching nurse for notification:', nurseError);
    
    if (nurseData) {
        await notifyEvaluationAudited(auditData.evaluation_id, nurseData.name, evaluationData.supervisor_id, auditData.decision);
    }
  }

  return data;
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  // This assumes you have a 'profiles' table for users in Supabase
  const { data, error: supabaseError } = await supabase.from('profiles').insert(userData).select().single();
  if (supabaseError) throw new Error(supabaseError.message);
  return data;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
  const { data, error } = await supabase.from('profiles').update(userData).eq('id', userId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- Badge Functions ---

export const getBadges = async (): Promise<Badge[]> => {
  const { data, error } = await supabase.from('badges').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const saveBadge = async (badgeData: Partial<Badge>): Promise<Badge> => {
  // Supabase upsert will insert a new row if badge_id is not provided or doesn't exist,
  // and update it if it does.
  const { data, error } = await supabase
    .from('badges')
    .upsert({ ...badgeData, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error("Error saving badge:", error);
    throw new Error(error.message);
  }
  return data;
};

export const addBadge = async (badgeData: Omit<Badge, 'id'>): Promise<Badge> => {
  const { data, error } = await supabase.from('badges').insert(badgeData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateBadge = async (badgeId: string, badgeData: Partial<Omit<Badge, 'id'>>): Promise<Badge> => {
  const { data, error } = await supabase.from('badges').update(badgeData).eq('id', badgeId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteBadge = async (badgeId: string): Promise<void> => {
  const { error } = await supabase.from('badges').delete().eq('id', badgeId);
  if (error) throw new Error(error.message);
};

// --- NurseBadge Functions ---

export const getBadgesForNurse = async (nurseId: string): Promise<NurseBadge[]> => {
  const { data, error } = await supabase.from('nurse_badges').select('*').eq('nurse_id', nurseId);
  if (error) throw new Error(error.message);
  return data;
};

export const awardBadgeToNurse = async (badgeData: Omit<NurseBadge, 'id' | 'awarded_at'>): Promise<NurseBadge> => {
  const { data: existingBadges, error: fetchError } = await supabase
    .from('nurse_badges')
    .select('id')
    .eq('nurse_id', badgeData.nurse_id)
    .eq('badge_id', badgeData.badge_id)
    .eq('tier', badgeData.tier)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw new Error(fetchError.message);
  }

  if (existingBadges) {
    console.log(`Badge ${badgeData.badge_id} tier ${badgeData.tier} already awarded to nurse ${badgeData.nurse_id}.`);
    const { data: fullBadge, error } = await supabase.from('nurse_badges').select('*').eq('id', existingBadges.id).single();
    if (error) throw new Error(error.message);
    return fullBadge;
  }

  const { data, error } = await supabase.from('nurse_badges').insert({ ...badgeData, awarded_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);

  const { data: nurseData, error: nurseError } = await supabase.from('nurses').select('name').eq('id', badgeData.nurse_id).single();
  if (nurseError) console.error('Error fetching nurse for notification:', nurseError);

  const { data: badgeInfo, error: badgeError } = await supabase.from('badges').select('name').eq('id', badgeData.badge_id).single();
  if (badgeError) console.error('Error fetching badge for notification:', badgeError);

  if (data && nurseData && badgeInfo) {
    const { data: managers, error: managersError } = await supabase.from('profiles').select('*').eq('role', 'manager');
    if (managersError) console.error('Error fetching managers for notification:', managersError);
    if (managers) {
        await notifyBadgeAwarded(badgeData.nurse_id, `${badgeInfo.name} (${badgeData.tier})`, nurseData.name, managers);
    }
  }

  return data;
};

// --- Notifications API ---

// Get notifications for a user
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId).order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('userId', userId).eq('read', false);
  if (error) throw new Error(error.message);
};

// --- Improvement Plan Functions ---

export const getImprovementPlansForNurse = async (nurseId: string): Promise<ImprovementPlan[]> => {
  const { data, error } = await supabase.from('improvement_plans').select('*').eq('nurse_id', nurseId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

export const createImprovementPlan = async (planData: Omit<ImprovementPlan, 'id' | 'created_at'>): Promise<ImprovementPlan> => {
  const { data, error } = await supabase.from('improvement_plans').insert(planData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateImprovementPlan = async (planId: string, updateData: Partial<ImprovementPlan>): Promise<ImprovementPlan> => {
  const { data, error } = await supabase.from('improvement_plans').update(updateData).eq('id', planId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- Leaderboard Functions ---

export interface LeaderboardEntry {
  nurse_id: string;
  nurse_name: string;
  nurse_photo_url?: string;
  nurse_gender: 'male' | 'female';
  week1_score: number | null;
  week2_score: number | null;
  week3_score: number | null;
  week4_score: number | null;
  monthly_score: number;
  week1_change: number | null;
  week2_change: number | null;
  week3_change: number | null;
  week4_change: number | null;
  monthly_change: number | null;
  badges: { name: string; icon: string; tier: string }[];
}

export const getMonthlyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase.rpc('get_monthly_leaderboard');

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    throw new Error(error.message);
  }
  
  return data;
};
