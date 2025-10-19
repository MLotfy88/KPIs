import { supabase } from './supabase';
import { Badge } from '@/types';

const predefinedBadges: Omit<Badge, 'badge_id' | 'created_at' | 'updated_at'>[] = [
  {
    badge_name: 'بطل مكافحة العدوى',
    description: 'يُمنح للتميز المستمر في تطبيق معايير مكافحة العدوى.',
    icon: 'Shield',
    tiers: [
      { name: 'bronze', criteria: { type: 'specific_score', value: 4, operator: 'gte', evaluation_type: 'monthly' } },
      { name: 'silver', criteria: { type: 'specific_score', value: 5, operator: 'gte', evaluation_type: 'monthly' } },
      { name: 'gold', criteria: { type: 'consistency', value: 3, operator: 'gte', evaluation_type: 'monthly' } }, // 3 months in a row with score 5
    ],
  },
  {
    badge_name: 'نجم التوثيق',
    description: 'يُمنح للدقة الاستثنائية والالتزام الكامل بالتوثيق الصحيح.',
    icon: 'Star',
    tiers: [
      { name: 'bronze', criteria: { type: 'average_score', value: 85, operator: 'gte', evaluation_type: 'monthly' } },
      { name: 'gold', criteria: { type: 'average_score', value: 95, operator: 'gte', evaluation_type: 'monthly' } },
    ],
  },
  {
    badge_name: 'روح المبادرة',
    description: 'يُمنح للممرضين الذين يظهرون مبادرة استباقية في مساعدة الفريق وتقديم الاقتراحات.',
    icon: 'Zap',
    tiers: [
      { name: 'silver', criteria: { type: 'consistency', value: 4, operator: 'gte' } }, // 4 weeks in a row with high initiative scores
    ],
  },
  {
    badge_name: 'قدوة الالتزام',
    description: 'يُمنح للالتزام التام بالمواعيد، الزي الرسمي، والسلوك المهني.',
    icon: 'Award',
    tiers: [
      { name: 'gold', criteria: { type: 'average_score', value: 98, operator: 'gte', evaluation_type: 'monthly' } },
    ],
  },
];

export const seedBadges = async () => {
  try {
    // Check if badges already exist to prevent duplicates
    const { data: existingBadges, error: fetchError } = await supabase.from('badges').select('badge_name');
    if (fetchError) throw fetchError;

    const existingBadgeNames = existingBadges.map(b => b.badge_name);
    const badgesToInsert = predefinedBadges.filter(b => !existingBadgeNames.includes(b.badge_name));

    if (badgesToInsert.length > 0) {
      const { error: insertError } = await supabase.from('badges').insert(badgesToInsert);
      if (insertError) throw insertError;
      console.log('Predefined badges have been seeded successfully.');
    } else {
      console.log('Predefined badges already exist. No seeding needed.');
    }
  } catch (error) {
    console.error('Error seeding badges:', error);
  }
};
