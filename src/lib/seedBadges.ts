import { supabase } from './supabase';
import { Badge } from '@/types';

// This new structure matches the 'Badge' type in src/types/index.ts
// and the schema in docs/supabase_schema.sql
const predefinedBadges: Omit<Badge, 'badge_id' | 'created_at' | 'updated_at'>[] = [
  {
    badge_name: 'بطل مكافحة العدوى',
    description: 'يُمنح للتميز المستمر في تطبيق معايير مكافحة العدوى.',
    badge_icon: 'Shield',
    linked_metrics: ['infection_control', 'sterile_field_maintenance', 'equipment_cleaning'],
    criteria_type: 'average',
    thresholds: { "bronze": 4.0, "silver": 4.5, "gold": 4.8 },
    period_type: 'monthly',
    active: true,
    editable: true,
  },
  {
    badge_name: 'نجم التوثيق',
    description: 'يُمنح للدقة الاستثنائية والالتزام الكامل بالتوثيق الصحيح.',
    badge_icon: 'Star',
    linked_metrics: ['charting_documentation_accuracy', 'handover_reporting'],
    criteria_type: 'average',
    thresholds: { "silver": 4.5, "gold": 5.0 },
    period_type: 'monthly',
    active: true,
    editable: true,
  },
  {
    badge_name: 'روح المبادرة',
    description: 'يُمنح للممرضين الذين يظهرون مبادرة استباقية في مساعدة الفريق وتقديم الاقتراحات.',
    badge_icon: 'Zap',
    linked_metrics: ['initiative_helping', 'improvement_suggestions'],
    criteria_type: 'average',
    thresholds: { "silver": 4.0, "gold": 4.5 },
    period_type: 'monthly',
    active: true,
    editable: true,
  },
  {
    badge_name: 'قدوة الالتزام',
    description: 'يُمنح للالتزام التام بالمواعيد، الزي الرسمي، والسلوك المهني.',
    badge_icon: 'Award',
    linked_metrics: ['attendance_punctuality', 'uniform_appearance', 'respect_admin_instructions'],
    criteria_type: 'average',
    thresholds: { "gold": 4.8 },
    period_type: 'monthly',
    active: true,
    editable: true,
  },
  {
    badge_name: 'خبير رعاية المريض',
    description: 'يُمنح للتميز في التواصل مع المرضى وتلبية احتياجاتهم.',
    badge_icon: 'Heart',
    linked_metrics: ['patient_welcoming', 'procedure_explanation', 'patient_request_response'],
    criteria_type: 'average',
    thresholds: { "bronze": 4.0, "silver": 4.5, "gold": 4.8 },
    period_type: 'monthly',
    active: true,
    editable: true,
  }
];

export const seedBadges = async () => {
  try {
    // Check if badges already exist to prevent duplicates
    const { data: existingBadges, error: fetchError } = await supabase.from('badges').select('badge_name');
    if (fetchError) throw fetchError;

    const existingBadgeNames = existingBadges.map(b => b.badge_name);
    const badgesToInsert = predefinedBadges.filter(b => !existingBadgeNames.includes(b.badge_name));

    if (badgesToInsert.length > 0) {
      // The object structure now matches the database schema, so this should succeed.
      const { error: insertError } = await supabase.from('badges').insert(badgesToInsert);
      if (insertError) throw insertError;
      console.log('Predefined badges have been seeded successfully.');
    } else {
      console.log('Predefined badges already exist. No seeding needed.');
    }
  } catch (error) {
    // This will now provide a more accurate error if the schema is still mismatched.
    console.error('Error seeding badges:', error);
  }
};
