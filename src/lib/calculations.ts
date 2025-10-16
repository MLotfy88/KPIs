import { Evaluation, EvaluationType } from '@/types';
import { monthlyItems } from './evaluationItems';

export const calculateWeeklyScore = (scores: Record<string, number>): number => {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

export const calculateMonthlyScore = (scores: Record<string, number>): number => {
  // Calculate average for each category
  const technicalItems = monthlyItems.filter(item => item.category === 'technical');
  const behavioralItems = monthlyItems.filter(item => item.category === 'behavioral');
  const careItems = monthlyItems.filter(item => item.category === 'care');
  const initiativeItems = monthlyItems.filter(item => item.category === 'initiative');

  const avgTechnical = calculateCategoryAverage(scores, technicalItems.map(i => i.id));
  const avgBehavioral = calculateCategoryAverage(scores, behavioralItems.map(i => i.id));
  const avgCare = calculateCategoryAverage(scores, careItems.map(i => i.id));
  const avgInitiative = calculateCategoryAverage(scores, initiativeItems.map(i => i.id));

  // Apply weights (30%, 30%, 30%, 10%)
  const weightedScore = (avgTechnical * 0.3) + (avgBehavioral * 0.3) + (avgCare * 0.3) + (avgInitiative * 0.1);

  // Convert to percentage
  return (weightedScore / 5) * 100;
};

const calculateCategoryAverage = (scores: Record<string, number>, itemIds: number[]): number => {
  const categoryScores = itemIds
    .map(id => scores[id.toString()])
    .filter(score => score !== undefined);
  
  if (categoryScores.length === 0) return 0;
  return categoryScores.reduce((acc, val) => acc + val, 0) / categoryScores.length;
};

export const calculateFinalScore = (type: EvaluationType, scores: Record<string, number>): number => {
  if (type === 'weekly') {
    return calculateWeeklyScore(scores);
  }
  return calculateMonthlyScore(scores);
};

export const getNurseAverageScore = (evaluations: Evaluation[]): number => {
  if (evaluations.length === 0) return 0;
  const sum = evaluations.reduce((acc, ev) => acc + ev.final_score, 0);
  return sum / evaluations.length;
};

export const getCategoryAverages = (evaluations: Evaluation[]): Record<string, number> => {
  const monthlyEvals = evaluations.filter(e => e.type === 'monthly');
  if (monthlyEvals.length === 0) {
    return { technical: 0, behavioral: 0, care: 0, initiative: 0 };
  }

  const categories = {
    technical: [] as number[],
    behavioral: [] as number[],
    care: [] as number[],
    initiative: [] as number[],
  };

  monthlyEvals.forEach(ev => {
    const technicalItems = monthlyItems.filter(item => item.category === 'technical');
    const behavioralItems = monthlyItems.filter(item => item.category === 'behavioral');
    const careItems = monthlyItems.filter(item => item.category === 'care');
    const initiativeItems = monthlyItems.filter(item => item.category === 'initiative');

    categories.technical.push(calculateCategoryAverage(ev.scores, technicalItems.map(i => i.id)));
    categories.behavioral.push(calculateCategoryAverage(ev.scores, behavioralItems.map(i => i.id)));
    categories.care.push(calculateCategoryAverage(ev.scores, careItems.map(i => i.id)));
    categories.initiative.push(calculateCategoryAverage(ev.scores, initiativeItems.map(i => i.id)));
  });

  return {
    technical: categories.technical.reduce((a, b) => a + b, 0) / categories.technical.length,
    behavioral: categories.behavioral.reduce((a, b) => a + b, 0) / categories.behavioral.length,
    care: categories.care.reduce((a, b) => a + b, 0) / categories.care.length,
    initiative: categories.initiative.reduce((a, b) => a + b, 0) / categories.initiative.length,
  };
};

export const getTopStrengths = (evaluations: Evaluation[], count: number = 3): Array<{ id: number; text: string; average: number }> => {
  const itemAverages = new Map<number, number[]>();

  evaluations.forEach(evaluation => {
    Object.entries(evaluation.scores).forEach(([itemId, score]) => {
      const id = parseInt(itemId);
      if (!itemAverages.has(id)) {
        itemAverages.set(id, []);
      }
      itemAverages.get(id)!.push(score);
    });
  });

  const averages = Array.from(itemAverages.entries()).map(([id, scores]) => ({
    id,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const sorted = averages.sort((a, b) => b.average - a.average);
  const topItems = sorted.slice(0, count);

  return topItems.map(item => {
    const itemData = monthlyItems.find(i => i.id === item.id);
    return {
      id: item.id,
      text: itemData?.text || '',
      average: item.average,
    };
  });
};

export const getImprovementAreas = (evaluations: Evaluation[], count: number = 3): Array<{ id: number; text: string; average: number }> => {
  const itemAverages = new Map<number, number[]>();

  evaluations.forEach(evaluation => {
    Object.entries(evaluation.scores).forEach(([itemId, score]) => {
      const id = parseInt(itemId);
      if (!itemAverages.has(id)) {
        itemAverages.set(id, []);
      }
      itemAverages.get(id)!.push(score);
    });
  });

  const averages = Array.from(itemAverages.entries()).map(([id, scores]) => ({
    id,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const sorted = averages.sort((a, b) => a.average - b.average);
  const bottomItems = sorted.slice(0, count);

  return bottomItems.map(item => {
    const itemData = monthlyItems.find(i => i.id === item.id);
    return {
      id: item.id,
      text: itemData?.text || '',
      average: item.average,
    };
  });
};
