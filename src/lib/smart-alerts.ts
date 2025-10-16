import { Evaluation, Nurse } from '@/types';
import { getEvaluationsByNurseId } from './api';

const PERFORMANCE_THRESHOLD = -10; // A 10% drop in performance is considered significant

interface PerformanceTrend {
  trend: 'stable' | 'improving' | 'declining';
  percentageChange: number;
  recentAverage: number;
  historicalAverage: number;
}

/**
 * Analyzes a nurse's performance trend by comparing recent evaluations to historical ones.
 * @param nurseId The ID of the nurse to analyze.
 * @returns An object containing the performance trend and relevant data.
 */
export const analyzePerformanceTrend = async (nurseId: string): Promise<PerformanceTrend | null> => {
  const evaluations = await getEvaluationsByNurseId(nurseId);

  if (evaluations.length < 6) {
    // Not enough data for a meaningful trend analysis
    return null;
  }

  // Sort evaluations by date, oldest first
  evaluations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const recentEvaluations = evaluations.slice(-3);
  const historicalEvaluations = evaluations.slice(0, -3);

  const recentAverage = recentEvaluations.reduce((sum, e) => sum + e.final_score, 0) / recentEvaluations.length;
  const historicalAverage = historicalEvaluations.reduce((sum, e) => sum + e.final_score, 0) / historicalEvaluations.length;

  if (historicalAverage === 0) {
    return {
        trend: recentAverage > 0 ? 'improving' : 'stable',
        percentageChange: recentAverage > 0 ? 100 : 0,
        recentAverage,
        historicalAverage,
    };
  }

  const percentageChange = ((recentAverage - historicalAverage) / historicalAverage) * 100;

  let trend: 'stable' | 'improving' | 'declining' = 'stable';
  if (percentageChange > 5) {
    trend = 'improving';
  } else if (percentageChange < PERFORMANCE_THRESHOLD) {
    trend = 'declining';
  }

  return {
    trend,
    percentageChange,
    recentAverage,
    historicalAverage,
  };
};

/**
 * Checks for any smart alerts for a given nurse.
 * @param nurse The nurse to check alerts for.
 * @returns An array of alert messages.
 */
export const checkForSmartAlerts = async (nurse: Nurse): Promise<string[]> => {
    const alerts: string[] = [];
    
    const performanceTrend = await analyzePerformanceTrend(nurse.id);

    if (performanceTrend?.trend === 'declining') {
        alerts.push(`انخفاض ملحوظ في الأداء بنسبة ${Math.abs(Math.round(performanceTrend.percentageChange))}% خلال التقييمات الأخيرة.`);
    }

    // Future checks for repeated errors or training needs can be added here.

    return alerts;
}
