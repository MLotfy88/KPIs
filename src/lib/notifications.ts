import { supabase } from './supabase';
import { Notification, User } from '@/types';

// This is an internal function to create a notification record in the database.
const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error(error.message);
  }
  return data;
};

export const notifyNewEvaluation = async (evaluationId: string, nurseName: string, supervisor: User, managers: User[]) => {
  // Notify all managers
  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      message: `تقييم جديد للممرضة ${nurseName} من قبل ${supervisor.name}`,
      link: `/manager/evaluations/${evaluationId}`,
    });
  }
};

export const notifyEvaluationAudited = async (evaluationId: string, nurseName: string, supervisorId: string, decision: string) => {
  // Notify the supervisor who created the evaluation
  await createNotification({
    userId: supervisorId,
    message: `تمت مراجعة تقييم الممرضة ${nurseName}. القرار: ${decision}`,
    link: `/supervisor/history/${evaluationId}`,
  });
};

export const notifyBadgeAwarded = async (nurseId: string, badgeName: string, nurseName: string, managers: User[]) => {
  // Notify all managers
  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      message: `تم منح شارة "${badgeName}" للممرضة ${nurseName}`,
      link: `/manager/nurses/${nurseId}`,
    });
  }
  // Notify the nurse (if nurses have accounts in the future)
};
