// src/lib/api.ts

/**
 * This file will abstract the data access layer.
 * It will have two modes: 'local' and 'supabase'.
 * Based on a configuration flag, it will either use mock data (local)
 * or the actual Supabase client.
 */

import { supabase } from './supabase';
import { Evaluation, Nurse, User, Audit, Badge, NurseBadge, Notification, ImprovementPlan } from '@/types';
import { MODE, API_URL } from '@/config';
import { notifyNewEvaluation, notifyEvaluationAudited, notifyBadgeAwarded } from './notifications';

// --- Helper Functions ---
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

// --- Auth Functions ---
export const getUserByEmail = async (email: string): Promise<User | null> => {
    if (MODE === 'local') {
        const users: User[] = await apiFetch(`users?email=${email}`);
        return users[0] || null;
    }
    // Supabase logic remains unchanged for now
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
}


// --- API Functions ---

export const getActiveNurses = async (): Promise<Nurse[]> => {
  if (MODE === 'local') {
    return apiFetch('nurses?is_active=true');
  }
  const { data, error } = await supabase.from('nurses').select('*').eq('is_active', true);
  if (error) throw new Error(error.message);
  return data;
};

export const saveEvaluation = async (evaluation: Omit<Evaluation, 'id' | 'created_at' | 'nurse_name'>): Promise<Evaluation> => {
    if (MODE === 'local') {
        const nurses = await getActiveNurses();
        const nurseName = nurses.find(n => n.id === evaluation.nurse_id)?.name || 'Unknown';
        
        const newEvaluation = {
            ...evaluation,
            created_at: new Date().toISOString(),
            nurse_name: nurseName,
        };

        const savedEvaluation = await apiFetch('evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvaluation),
        });
        
        // Assuming supervisor details are available or can be fetched
        const supervisor = await apiFetch(`users/${evaluation.supervisor_id}`);
        if (supervisor) {
            await notifyNewEvaluation(savedEvaluation.id, nurseName, supervisor);
        }

        return savedEvaluation;
    }

    const { data, error } = await supabase.from('evaluations').insert(evaluation).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const getSupervisorEvaluations = async (supervisorId: string): Promise<Evaluation[]> => {
    if (MODE === 'local') {
        const evaluations: Evaluation[] = await apiFetch(`evaluations?supervisor_id=${supervisorId}&_sort=created_at&_order=desc`);
        const nurses: Nurse[] = await apiFetch('nurses');
        
        return evaluations.map(e => ({
            ...e,
            nurse_name: nurses.find(n => n.id === e.nurse_id)?.name || 'Unknown',
        }));
    }
    const { data, error } = await supabase
        .from('evaluations')
        .select(`*, nurses (name)`)
        .eq('supervisor_id', supervisorId);

    if (error) throw new Error(error.message);

    // @ts-ignore
    return data.map(e => ({ ...e, nurse_name: e.nurses.name }));
};

export const getAllNurses = async (): Promise<Nurse[]> => {
  if (MODE === 'local') {
    return apiFetch('nurses');
  }
  const { data, error } = await supabase.from('nurses').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const addNurse = async (nurseData: Omit<Nurse, 'id' | 'created_at' | 'updated_at'>): Promise<Nurse> => {
  if (MODE === 'local') {
    const newNurse = {
      ...nurseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return apiFetch('nurses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNurse),
    });
  }
  const { data, error } = await supabase.from('nurses').insert(nurseData).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export const updateNurse = async (nurseId: string, nurseData: Partial<Omit<Nurse, 'id' | 'created_at'>>): Promise<Nurse> => {
  if (MODE === 'local') {
    const updatedNurse = {
      ...nurseData,
      updated_at: new Date().toISOString(),
    };
    return apiFetch(`nurses/${nurseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedNurse),
    });
  }
  const { data, error } = await supabase.from('nurses').update(nurseData).eq('id', nurseId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteNurse = async (nurseId: string): Promise<void> => {
  if (MODE === 'local') {
    await apiFetch(`nurses/${nurseId}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from('nurses').delete().eq('id', nurseId);
  if (error) throw new Error(error.message);
};

export const getSupervisorById = async (id: string): Promise<User | null> => {
    if (MODE === 'local') {
        const users: User[] = await apiFetch(`users?id=${id}`);
        return users[0] || null;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
}

export const getNurseById = async (id: string): Promise<Nurse | null> => {
  if (MODE === 'local') {
    const nurses: Nurse[] = await apiFetch(`nurses?id=${id}`);
    return nurses[0] || null;
  }
  const { data, error } = await supabase.from('nurses').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
};

export const getEvaluationsByNurseId = async (nurseId: string): Promise<Evaluation[]> => {
  if (MODE === 'local') {
    return apiFetch(`evaluations?nurse_id=${nurseId}&_sort=created_at&_order=desc`);
  }
  const { data, error } = await supabase.from('evaluations').select('*').eq('nurse_id', nurseId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getAllEvaluations = async (): Promise<Evaluation[]> => {
    if (MODE === 'local') {
        return apiFetch('evaluations');
    }
    const { data, error } = await supabase.from('evaluations').select('*');
    if (error) throw new Error(error.message);
    return data;
}

export const getAllAudits = async (): Promise<Audit[]> => {
  if (MODE === 'local') {
    return apiFetch('audits?_sort=created_at&_order=desc');
  }
  const { data, error } = await supabase.from('audits').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getAllUsers = async (): Promise<User[]> => {
  if (MODE === 'local') {
    return apiFetch('users');
  }
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const saveAudit = async (auditData: Omit<Audit, 'id' | 'created_at'>): Promise<Audit> => {
  if (MODE === 'local') {
    const newAudit = {
      ...auditData,
      created_at: new Date().toISOString(),
    };
    const savedAudit = await apiFetch('audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAudit),
    });

    const evaluation = await apiFetch(`evaluations/${auditData.evaluation_id}`);
    const auditor = await apiFetch(`users/${auditData.auditor_id}`);
    const nurse = await apiFetch(`nurses/${evaluation.nurse_id}`);

    if (evaluation && auditor && nurse) {
      await notifyEvaluationAudited(evaluation.id, nurse.name, auditor, auditData.decision);
    }

    return savedAudit;
  }
  const { data, error } = await supabase.from('audits').insert(auditData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  if (MODE === 'local') {
    return apiFetch('users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  }
  // This assumes you have a 'profiles' table for users in Supabase
  const { data, error: supabaseError } = await supabase.from('profiles').insert(userData).select().single();
  if (supabaseError) throw new Error(supabaseError.message);
  return data;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
  if (MODE === 'local') {
    return apiFetch(`users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  }
  const { data, error } = await supabase.from('profiles').update(userData).eq('id', userId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- Badge Functions ---

export const getBadges = async (): Promise<Badge[]> => {
  if (MODE === 'local') {
    return apiFetch('badges');
  }
  const { data, error } = await supabase.from('badges').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const addBadge = async (badgeData: Omit<Badge, 'id'>): Promise<Badge> => {
  if (MODE === 'local') {
    return apiFetch('badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badgeData),
    });
  }
  const { data, error } = await supabase.from('badges').insert(badgeData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateBadge = async (badgeId: string, badgeData: Partial<Omit<Badge, 'id'>>): Promise<Badge> => {
  if (MODE === 'local') {
    return apiFetch(`badges/${badgeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badgeData),
    });
  }
  const { data, error } = await supabase.from('badges').update(badgeData).eq('id', badgeId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteBadge = async (badgeId: string): Promise<void> => {
  if (MODE === 'local') {
    await apiFetch(`badges/${badgeId}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from('badges').delete().eq('id', badgeId);
  if (error) throw new Error(error.message);
};

// --- NurseBadge Functions ---

export const getBadgesForNurse = async (nurseId: string): Promise<NurseBadge[]> => {
  if (MODE === 'local') {
    return apiFetch(`nurse_badges?nurse_id=${nurseId}`);
  }
  const { data, error } = await supabase.from('nurse_badges').select('*').eq('nurse_id', nurseId);
  if (error) throw new Error(error.message);
  return data;
};

export const awardBadgeToNurse = async (badgeData: Omit<NurseBadge, 'id' | 'awarded_at'>): Promise<NurseBadge> => {
  if (MODE === 'local') {
    // Check if the badge tier has already been awarded to prevent duplicates
    const existingBadges = await getBadgesForNurse(badgeData.nurse_id);
    const alreadyAwarded = existingBadges.some(b => b.badge_id === badgeData.badge_id && b.tier === badgeData.tier);

    if (alreadyAwarded) {
      console.log(`Badge ${badgeData.badge_id} tier ${badgeData.tier} already awarded to nurse ${badgeData.nurse_id}.`);
      // Find and return the existing badge
      return existingBadges.find(b => b.badge_id === badgeData.badge_id && b.tier === badgeData.tier)!;
    }
    
    const newBadge = {
      ...badgeData,
      awarded_at: new Date().toISOString(),
    };
    const awardedBadge = await apiFetch('nurse_badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBadge),
    });

    const nurse = await apiFetch(`nurses/${badgeData.nurse_id}`);
    const badge = await apiFetch(`badges/${badgeData.badge_id}`);

    if (nurse && badge) {
      await notifyBadgeAwarded(nurse.id, `${badge.name} (${badgeData.tier})`, nurse.name);
    }

    return awardedBadge;
  }
  const { data, error } = await supabase.from('nurse_badges').insert({ ...badgeData, awarded_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- Notifications API ---

// Get notifications for a user
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  if (MODE === 'local') {
    return apiFetch(`notifications?userId=${userId}&_sort=createdAt&_order=desc`);
  }
  const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId).order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
  if (MODE === 'local') {
    return apiFetch(`notifications/${notificationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
  }
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  if (MODE === 'local') {
    const notifications = await getNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.read);

    const promises = unreadNotifications.map(n => 
        fetch(`${API_URL}/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
        })
    );

    const responses = await Promise.all(promises);
    const failedResponse = responses.find(res => !res.ok);

    if (failedResponse) {
        throw new Error('Failed to mark all notifications as read');
    }
    return;
  }
  const { error } = await supabase.from('notifications').update({ read: true }).eq('userId', userId).eq('read', false);
  if (error) throw new Error(error.message);
};

// --- Improvement Plan Functions ---

export const getImprovementPlansForNurse = async (nurseId: string): Promise<ImprovementPlan[]> => {
  if (MODE === 'local') {
    return apiFetch(`improvement_plans?nurse_id=${nurseId}&_sort=created_at&_order=desc`);
  }
  // TODO: Implement Supabase logic
  return [];
};

export const createImprovementPlan = async (planData: Omit<ImprovementPlan, 'id' | 'created_at'>): Promise<ImprovementPlan> => {
  if (MODE === 'local') {
    const newPlan = {
      ...planData,
      created_at: new Date().toISOString(),
    };
    return apiFetch('improvement_plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlan),
    });
  }
  // TODO: Implement Supabase logic
  const { data, error } = await supabase.from('improvement_plans').insert(planData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateImprovementPlan = async (planId: string, updateData: Partial<ImprovementPlan>): Promise<ImprovementPlan> => {
  if (MODE === 'local') {
    return apiFetch(`improvement_plans/${planId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  }
  // TODO: Implement Supabase logic
  const { data, error } = await supabase.from('improvement_plans').update(updateData).eq('id', planId).select().single();
  if (error) throw new Error(error.message);
  return data;
};
