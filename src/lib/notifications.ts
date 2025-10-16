import { apiFetch } from './api';
import { Notification, User } from '@/types';

const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
  const newNotification = {
    ...notification,
    createdAt: new Date().toISOString(),
    read: false,
  };
  return apiFetch('notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNotification),
  });
};

export const notifyNewEvaluation = async (evaluationId: string, nurseName: string, supervisor: User) => {
  // Notify the manager
  const managers = await apiFetch('users?role=manager');
  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      message: `تقييم جديد للممرضة ${nurseName} من قبل ${supervisor.name}`,
      link: `/manager/evaluations/${evaluationId}`,
    });
  }
};

export const notifyEvaluationAudited = async (evaluationId: string, nurseName: string, auditor: User, decision: string) => {
  // Notify the supervisor who created the evaluation
  const evaluation = await apiFetch(`evaluations/${evaluationId}`);
  if (evaluation && evaluation.supervisor_id) {
    await createNotification({
      userId: evaluation.supervisor_id,
      message: `تمت مراجعة تقييم الممرضة ${nurseName}. القرار: ${decision}`,
      link: `/supervisor/history/${evaluationId}`,
    });
  }
};

export const notifyBadgeAwarded = async (userId: string, badgeName: string, nurseName: string) => {
  // Notify the manager
  const managers = await apiFetch('users?role=manager');
  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      message: `تم منح شارة "${badgeName}" للممرضة ${nurseName}`,
      link: `/manager/nurses/${userId}`,
    });
  }
  // Notify the nurse (if nurses have accounts in the future)
};
