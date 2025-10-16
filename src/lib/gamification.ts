import { Badge, Evaluation, Nurse, NurseBadge } from '@/types';
import { getBadges, getEvaluationsByNurseId, getBadgesForNurse, awardBadgeToNurse } from './api';

/**
 * Checks all nurses' performance and awards badges if criteria are met.
 * This function would be triggered periodically in a real application (e.g., via a cron job or after each evaluation).
 */
export const processBadgeAwards = async (nurses: Nurse[]): Promise<void> => {
  console.log("Starting badge award processing...");
  const badges = await getBadges();
  
  for (const nurse of nurses) {
    const evaluations = await getEvaluationsByNurseId(nurse.id);
    if (evaluations.length === 0) continue;

    const awardedBadges = await getBadgesForNurse(nurse.id);

    for (const badge of badges) {
      await checkAndAwardBadge(nurse, badge, evaluations, awardedBadges);
    }
  }
  console.log("Badge award processing finished.");
};

/**
 * Checks if a nurse qualifies for a specific badge and awards it.
 */
const checkAndAwardBadge = async (nurse: Nurse, badge: Badge, evaluations: Evaluation[], awardedBadges: NurseBadge[]): Promise<void> => {
  // Sort tiers by value, assuming higher is better
  const sortedTiers = [...badge.tiers].sort((a, b) => b.criteria.value - a.criteria.value);

  for (const tier of sortedTiers) {
    const { criteria } = tier;
    let isEligible = false;

    if (criteria.type === 'average_score') {
      const recentEvaluations = evaluations.slice(-criteria.period!);
      if (recentEvaluations.length >= criteria.period!) {
        const avgScore = recentEvaluations.reduce((sum, e) => sum + e.final_score, 0) / recentEvaluations.length;
        
        if (criteria.operator === 'gte' && avgScore >= criteria.value) {
          isEligible = true;
        }
        // Add other operators as needed...
      }
    }
    // Add other criteria types as needed...

    if (isEligible) {
      const alreadyHasTier = awardedBadges.some(b => b.badge_id === badge.id && b.tier === tier.name);
      if (!alreadyHasTier) {
        await awardBadgeToNurse({
          nurse_id: nurse.id,
          badge_id: badge.id,
          tier: tier.name,
        });
        console.log(`Awarded badge ${badge.id} tier ${tier.name} to nurse ${nurse.id}`);
      }
      // Once the highest eligible tier is awarded, stop checking for this badge
      return;
    }
  }
};
