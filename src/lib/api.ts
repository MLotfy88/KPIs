// src/lib/api.ts

/**
 * This file will abstract the data access layer.
 * It will have two modes: 'local' and 'supabase'.
 * Based on a configuration flag, it will either use mock data (local)
 * or the actual Supabase client.
 */

import { supabase } from './supabase';
import { Evaluation, Nurse, User, Audit, Badge, NurseBadge, Notification, ImprovementPlan } from '@/types';
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

export const saveEvaluation = async (evaluation: Omit<Evaluation, 'id' | 'created_at' | 'nurse_name'>): Promise<Evaluation> => {
    const { data, error } = await supabase.from('evaluations').insert(evaluation).select().single();
    if (error) throw new Error(error.message);
    
    // Assuming supervisor and nurse details are available to be fetched for notification
    const { data: nurseData, error: nurseError } = await supabase.from('nurses').select('name').eq('id', evaluation.nurse_id).single();
    if (nurseError) console.error('Error fetching nurse name for notification:', nurseError);

    const { data: supervisorData, error: supervisorError } = await supabase.from('profiles').select('*').eq('id', evaluation.supervisor_id).single();
    if (supervisorError) console.error('Error fetching supervisor for notification:', supervisorError);

    if (data && nurseData && supervisorData) {
        await notifyNewEvaluation(data.id, nurseData.name, supervisorData);
    }

    return data;
};

export const getSupervisorEvaluations = async (supervisorId: string): Promise<Evaluation[]> => {
    const { data, error } = await supabase
        .from('evaluations')
        .select(`*, nurse:nurses (name)`)
        .eq('supervisor_id', supervisorId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // @ts-ignore
    return data.map(e => ({ ...e, nurse_name: e.nurse.name, nurses: undefined }));
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
  const { data, error } = await supabase.from('evaluations').select('*').eq('nurse_id', nurseId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getAllEvaluations = async (): Promise<Evaluation[]> => {
    const { data, error } = await supabase.from('evaluations').select('*');
    if (error) throw new Error(error.message);
    return data;
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

  const { data: evaluationData, error: evalError } = await supabase.from('evaluations').select('nurse_id').eq('id', auditData.evaluation_id).single();
  if (evalError) console.error('Error fetching evaluation for notification:', evalError);

  const { data: auditorData, error: auditorError } = await supabase.from('profiles').select('*').eq('id', auditData.auditor_id).single();
  if (auditorError) console.error('Error fetching auditor for notification:', auditorError);
  
  if (data && evaluationData && auditorData) {
    const { data: nurseData, error: nurseError } = await supabase.from('nurses').select('name').eq('id', evaluationData.nurse_id).single();
    if (nurseError) console.error('Error fetching nurse for notification:', nurseError);
    
    if (nurseData) {
        await notifyEvaluationAudited(data.id, nurseData.name, auditorData, auditData.decision);
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
    await notifyBadgeAwarded(badgeData.nurse_id, `${badgeInfo.name} (${badgeData.tier})`, nurseData.name);
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
