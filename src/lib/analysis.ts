import { Evaluation, EvaluationItem } from '@/types';
import { evaluationItems } from './evaluationItems';

export interface PerformanceAnalysis {
  strengths: EvaluationItem[];
  weaknesses: EvaluationItem[];
}

export const analyzePerformanceStrengthsAndWeaknesses = (
  evaluations: Evaluation[]
): PerformanceAnalysis => {
  if (evaluations.length === 0) {
    return { strengths: [], weaknesses: [] };
  }

  const itemScores: { [key: string]: { total: number; count: number; average: number } } = {};

  // Initialize with all possible items to handle cases where an item was never scored
  evaluationItems.forEach(item => {
    itemScores[item.id] = { total: 0, count: 0, average: 0 };
  });

  // Aggregate scores from all evaluations
  evaluations.forEach(evaluation => {
    // We only analyze weekly evaluations for specific item feedback
    if (evaluation.evaluation_type === 'weekly') {
      for (const itemId in evaluation.scores) {
        if (itemScores[itemId]) {
          itemScores[itemId].total += evaluation.scores[itemId];
          itemScores[itemId].count++;
        }
      }
    }
  });

  // Calculate average for each item
  for (const itemId in itemScores) {
    const item = itemScores[itemId];
    if (item.count > 0) {
      item.average = item.total / item.count;
    }
  }

  // Filter out items that were never scored and map to a sortable array
  const sortedItems = Object.entries(itemScores)
    .filter(([, data]) => data.count > 0)
    .map(([id, data]) => ({
      id: parseInt(id, 10),
      average: data.average,
    }))
    .sort((a, b) => b.average - a.average);

  // Get top 3 strengths
  const top3Ids = sortedItems.slice(0, 3).map(item => item.id);
  const strengths = evaluationItems.filter(item => top3Ids.includes(item.id));

  // Get bottom 3 weaknesses
  const bottom3Ids = sortedItems.slice(-3).reverse().map(item => item.id);
  const weaknesses = evaluationItems.filter(item => bottom3Ids.includes(item.id));

  return { strengths, weaknesses };
};
