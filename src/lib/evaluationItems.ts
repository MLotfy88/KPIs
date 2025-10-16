import { EvaluationItem } from '@/types';

export const weeklyItems: EvaluationItem[] = [
  { id: 1, text: 'الالتزام بمعايير مكافحة العدوى', category: 'technical' },
  { id: 2, text: 'التحضير الصحيح لغرفة القسطرة', category: 'technical' },
  { id: 3, text: 'التعامل الآمن مع الأجهزة والمعدات', category: 'technical' },
  { id: 4, text: 'الالتزام بفحوصات السلامة قبل الإجراء', category: 'technical' },
  { id: 5, text: 'دقة التوثيق في السجلات الطبية', category: 'technical' },
  { id: 6, text: 'الالتزام بالزي الرسمي والمظهر المهني', category: 'behavioral' },
  { id: 7, text: 'الحضور في الوقت المحدد', category: 'behavioral' },
  { id: 8, text: 'التواصل الفعال مع الفريق', category: 'behavioral' },
  { id: 9, text: 'الاستجابة السريعة في حالات الطوارئ', category: 'care' },
];

export const monthlyItems: EvaluationItem[] = [
  // المحور الفني (البنود 1-9) - وزن 30%
  { id: 1, text: 'الالتزام بمعايير مكافحة العدوى', category: 'technical', weight: 0.3 },
  { id: 2, text: 'التحضير الصحيح لغرفة القسطرة', category: 'technical', weight: 0.3 },
  { id: 3, text: 'التعامل الآمن مع الأجهزة والمعدات', category: 'technical', weight: 0.3 },
  { id: 4, text: 'الالتزام بفحوصات السلامة قبل الإجراء', category: 'technical', weight: 0.3 },
  { id: 5, text: 'دقة التوثيق في السجلات الطبية', category: 'technical', weight: 0.3 },
  { id: 6, text: 'المعرفة بأدوية القسطرة وتفاعلاتها', category: 'technical', weight: 0.3 },
  { id: 7, text: 'مهارة المساعدة في الحالات المعقدة', category: 'technical', weight: 0.3 },
  { id: 8, text: 'التعامل مع المواد المشعة بأمان', category: 'technical', weight: 0.3 },
  { id: 9, text: 'إتقان إجراءات الإنعاش القلبي', category: 'technical', weight: 0.3 },
  
  // المحور السلوكي (البنود 10-17) - وزن 30%
  { id: 10, text: 'الالتزام بالزي الرسمي والمظهر المهني', category: 'behavioral', weight: 0.3 },
  { id: 11, text: 'الحضور في الوقت المحدد', category: 'behavioral', weight: 0.3 },
  { id: 12, text: 'التواصل الفعال مع الفريق', category: 'behavioral', weight: 0.3 },
  { id: 13, text: 'احترام المرضى والزملاء', category: 'behavioral', weight: 0.3 },
  { id: 14, text: 'الحفاظ على سرية معلومات المرضى', category: 'behavioral', weight: 0.3 },
  { id: 15, text: 'القدرة على العمل تحت الضغط', category: 'behavioral', weight: 0.3 },
  { id: 16, text: 'المرونة في التعامل مع المواقف الطارئة', category: 'behavioral', weight: 0.3 },
  { id: 17, text: 'الالتزام بأخلاقيات المهنة', category: 'behavioral', weight: 0.3 },
  
  // محور الرعاية (البنود 18-25) - وزن 30%
  { id: 18, text: 'تقديم الدعم النفسي للمرضى', category: 'care', weight: 0.3 },
  { id: 19, text: 'شرح الإجراءات للمريض بوضوح', category: 'care', weight: 0.3 },
  { id: 20, text: 'مراقبة العلامات الحيوية بدقة', category: 'care', weight: 0.3 },
  { id: 21, text: 'الاستجابة السريعة في حالات الطوارئ', category: 'care', weight: 0.3 },
  { id: 22, text: 'العناية بالمريض بعد الإجراء', category: 'care', weight: 0.3 },
  { id: 23, text: 'التعامل مع مخاوف المرضى بحساسية', category: 'care', weight: 0.3 },
  { id: 24, text: 'ضمان راحة المريض أثناء الإجراء', category: 'care', weight: 0.3 },
  { id: 25, text: 'تثقيف المرضى حول الرعاية الذاتية', category: 'care', weight: 0.3 },
  
  // محور المبادرة (البنود 26-29) - وزن 10%
  { id: 26, text: 'المشاركة في برامج التطوير المهني', category: 'initiative', weight: 0.1 },
  { id: 27, text: 'اقتراح تحسينات في العمل', category: 'initiative', weight: 0.1 },
  { id: 28, text: 'المبادرة في مساعدة الزملاء', category: 'initiative', weight: 0.1 },
  { id: 29, text: 'المشاركة في الأنشطة البحثية', category: 'initiative', weight: 0.1 },
];

const allItems = [...weeklyItems, ...monthlyItems];
export const evaluationItems = allItems.filter((item, index, self) =>
  index === self.findIndex((t) => (
    t.id === item.id
  ))
);
