import { Award, Star, Zap, Shield, TrendingUp } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  criteria: (evaluations: any[]) => boolean;
}

export const badges: Badge[] = [
  {
    id: 'high_performer',
    name: 'أداء متميز',
    description: 'الحصول على متوسط أداء 95% أو أعلى في 3 تقييمات متتالية.',
    icon: Award,
    criteria: (evaluations) => {
      // Logic to be implemented
      return false;
    },
  },
  {
    id: 'consistency_king',
    name: 'ملك الالتزام',
    description: 'إكمال جميع التقييمات الشهرية لمدة 3 أشهر متتالية.',
    icon: Star,
    criteria: (evaluations) => {
      // Logic to be implemented
      return false;
    },
  },
  {
    id: 'fast_improver',
    name: 'تحسن سريع',
    description: 'زيادة متوسط الأداء بنسبة 10% خلال شهر واحد.',
    icon: TrendingUp,
    criteria: (evaluations) => {
      // Logic to be implemented
      return false;
    },
  },
  {
    id: 'perfect_score',
    name: 'العلامة الكاملة',
    description: 'الحصول على درجة 100% في تقييم شهري.',
    icon: Zap,
    criteria: (evaluations) => {
      // Logic to be implemented
      return false;
    },
  },
  {
    id: 'quality_focus',
    name: 'تركيز على الجودة',
    description: 'الحصول على متوسط 98% أو أعلى في محور "الجودة الفنية".',
    icon: Shield,
    criteria: (evaluations) => {
      // Logic to be implemented
      return false;
    },
  },
];
