import { useState, useMemo, useEffect } from 'react';
import { EvaluationType, EvaluationItem } from '@/types';
import { getEvaluationItems } from '@/lib/api';
import { loadInProgressEvaluation, saveInProgressEvaluation } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

// Hardcoded descriptions based on the provided HTML files
const monthlyDescriptions: Record<string, string[]> = {
  'infection_control': ["مخالفة جسيمة تعرض للعدوى", "أخطاء متكررة في التعقيم", "التزام مقبول (75-89%)", "التزام عالٍ (أكثر من 90%)", "التزام مثالي ويُذكّر الآخرين"],
  'patient_prep_checklist': ["إهمال أدى لخطر/تأخير", "إغفال بنود مهمة", "تدارك الخلل لاحقًا", "نقص بند غير جوهري", "تنفيذ كامل ودقيق 100%"],
  'cannula_insertion': ["خطأ جسيم أدى لمضاعفة", "تركيب ضعيف سبب إزعاج", "تركيب مقبول", "تركيب جيد", "تركيب مثالي من أول مرة"],
  'medication_admin': ["خطأ جرعي/توقيت يسبب مشكلة", "تأخير/خطأ بسيط", "دقة مقبولة", "دقة عالية", "دقة وتوقيت مثاليان"],
  'patient_support_monitoring': ["غياب متكرر", "غياب جزئي", "متواجد عند الطلب", "متواجد وفعّال", "ملازم ويطمئن المريض"],
  'sterile_field_maintenance': ["انتهاك جسيم للحقل المعقم", "اختراق ملحوظ", "اختراق بسيط", "اختراق طفيف تم تداركه", "لا يوجد أي اختراق للحقل"],
  'vitals_recording': ["سجلات غائبة/مزورة", "تسجيل غير دقيق", "تسجيل مقبول", "تسجيل دقيق", "تسجيل فوري ودقيق وموثّق"],
  'insertion_site_monitoring': ["إهمال أدى لمضاعفات", "مراقبة غير كافية", "مراقبة مقبولة", "مراقبة جيدة", "فحص منتظم وتدخل فوري"],
  'equipment_cleaning': ["إهمال متكرر للنظافة", "تنظيف غير كامل", "تنظيف مقبول", "تنظيف جيد ومنتظم", "تنظيف وتعقيم ممنهج وفوري"],
  'attendance_punctuality': ["غياب/ترك الوردية بدون إذن", "تأخير متكرر", "تأخير أحيانًا", "التزام تام بالمواعيد", "قدوة ويحضر مبكرًا"],
  'calmness_discipline': ["مصدر إزعاج مستمر", "يسبب ضوضاء أحيانًا", "هادئ غالبًا", "ملتزم بالهدوء", "قدوة في الهدوء والانضباط"],
  'uniform_appearance': ["مظهر غير لائق متكرر", "يحتاج لتذكير", "مظهر مقبول", "زي نظيف ومرتب", "مظهر مثالي (زي، بطاقة)"],
  'respect_admin_instructions': ["يعترض ويعرقل التعليمات", "يتذمر وينفذ ببطء", "ينفذ التعليمات", "ينفذ بسرعة", "ينفذ فورًا ويشجع الآخرين"],
  'cooperation_colleagues': ["يرفض المساعدة/يخلق صراعات", "غير متعاون", "يتعاون عند الطلب", "متعاون بشكل جيد", "مبادر ورحّب بالمساعدة"],
  'phone_usage_policy': ["استخدام مستمر يؤثر على العمل", "استخدام شخصي متكرر", "يستخدمه أحيانًا", "لا يستخدم إلا للضرورة", "لا يستخدم إلا للضرورة المهنية"],
  'patient_confidentiality': ["خرق خطير للسرية", "إهمال في السرية", "يحافظ على السرية", "حريص جدًا على السرية", "قدوة في حفظ أسرار المرضى"],
  'handling_pressure': ["يفقد السيطرة ويعرقل العمل", "يتوتر ويتردد", "يؤدي عمله تحت الضغط", "هادئ وفعّال تحت الضغط", "يقود ويدعم الفريق في الأزمات"],
  'patient_welcoming': ["تعامل فظ أو إهمال للمريض", "تعامل جاف", "يرحب بالمريض", "يرحب ويهدئ المريض", "يكسب ثقة المريض ويطمئنه"],
  'procedure_explanation': ["لا يشرح أو يعطي معلومات مضللة", "لا يشرح إلا عند السؤال", "يشرح بشكل مختصر", "يشرح الخطوات بوضوح", "يشرح ويتأكد من فهم المريض"],
  'recovery_phase_presence': ["غياب/إهمال المريض", "تواجد متقطع", "متواجد معظم الوقت", "متواجد ومراقب بشكل جيد", "متواجد ومراقب دائمًا"],
  'patient_request_response': ["تجاهل/تأخر خطير", "استجابة بطيئة", "استجابة مقبولة", "استجابة سريعة", "استجابة فورية واهتمام كامل"],
  'medication_timing_accuracy': ["أخطاء جرعية أو عزوف", "تأخير متكرر", "يعطي العلاج في وقته", "دقيق في المواعيد", "دقة كاملة بالجرعات والمواعيد"],
  'charting_documentation_accuracy': ["سجلات وهمية/مزورة", "تسجيل غير دقيق", "تسجيل مقبول", "سجلات دقيقة", "سجلات دقيقة ومتطابقة"],
  'handover_reporting': ["لا يسلم أو يسلم مزور", "تسليم متأخر/ناقص", "يسلم الشيت", "يسلم مع ملاحظات شفهية", "تسليم فوري ومراجع وشامل"],
  'doctor_communication': ["لا يبلغ/تأخر يعرض للخطر", "يبلغ متأخرًا", "يبلغ عن التغيرات", "يبلغ فورًا", "يبلغ فورًا ويتابع التعليمات"],
  'initiative_helping': ["لا يبادر أبدًا", "نادرًا ما يبادر", "يبادر أحيانًا", "يبادر غالبًا", "يبادر باستمرار ويخفف الحمل"],
  'improvement_suggestions': ["سلبي/يرفض التغيير", "لا يقدم اقتراحات", "يقدم اقتراحات عامة", "يقدم اقتراحات جيدة", "يقدم اقتراحات عملية قابلة للتطبيق"],
  'training_participation': ["يهمل الحضور", "يحضر دون مشاركة", "يشارك في التدريب", "يشارك بفعالية", "يبادر بالتدريب ويدرب الآخرين"],
  'role_model_discipline': ["يخلق مشاكل متكررة", "يحتاج لتوجيه مستمر", "منضبط بشكل عام", "مثال جيد للزملاء", "مثال يحتذى به للآخرين"],
};

const weeklyDescriptions: Record<string, string[]> = {
  'infection_control_weekly': ["لا يلتزم بإجراءات الوقاية", "يلتزم أحيانًا دون متابعة", "يلتزم جزئيًا عند التذكير", "يلتزم بمعظم الإجراءات", "يلتزم تمامًا ويبادر بتصحيح الآخرين"],
  'patient_prep_checklist_weekly': ["يتجاهل التحضيرات الأساسية", "ينفذ جزئيًا ويغفل بعض الخطوات", "ينفذ أغلب التحضيرات", "ينفذ جميع التحضيرات المطلوبة", "ينفذها بدقة ويتأكد من جاهزية المريض"],
  'patient_support_monitoring_weekly': ["غير متواجد أو سلبي", "يتواجد جزئيًا دون تفاعل", "يتواجد ويستجيب عند الطلب", "يساعد الطبيب بفاعلية", "متفاعل إيجابيًا ويوفر دعم نفسى"],
  'post_procedure_instructions_weekly': ["يتأخر أو ينسى التعليمات", "ينفذ بتأخير متكرر", "ينفذ بشكل مقبول", "ينفذ بسرعة ودقة", "ينفذ فورًا وبكفاءة عالية"],
  'vitals_recording_weekly': ["لا يسجل أو يعطى بيانات غير صحيحة", "يسجل بشكل غير منتظم", "يسجل عند التذكير", "يسجل بانتظام ودقة جيدة", "يسجل بدقة عالية وفي الوقت"],
  'attendance_punctuality_weekly': ["يتأخر بانتظام", "يتأخر أحيانًا ويغادر مبكرًا", "يلتزم أغلب الأيام", "منضبط بالحضور والانصراف", "قدوة في الانضباط"],
  'calmness_discipline_weekly': ["يتسبب في ضوضاء", "يتحدث بصوت مرتفع", "يحافظ نسبيًا على الهدوء", "يحترم الهدوء العام", "يصنع بيئة هادئة وقدوة"],
  'patient_request_response_weekly': ["يتجاهل نداءات المرضى", "يستجيب بعد تأخير", "يستجيب عند التكرار", "يستجيب بسرعة مناسبة", "يستجيب فورًا وباهتمام كامل"],
  'charting_documentation_accuracy_weekly': ["يسجل بيانات عشوائية", "يسجل دون مراجعة", "يسجل بانتظام", "يسجل بدقة", "توثيق مثالي ودقيق جدًا"],
};

interface EvaluationFormProps {
  evaluationType: EvaluationType;
  onSubmit: (scores: Record<string, number>, notes: string) => void;
  nurseName: string;
}

const EvaluationForm = ({ evaluationType, onSubmit, nurseName }: EvaluationFormProps) => {
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const fetchedItems = await getEvaluationItems(evaluationType);
        setItems(fetchedItems);
        const savedData = loadInProgressEvaluation();
        if (savedData) {
          setScores(savedData.scores || {});
          setNotes(savedData.notes || '');
        }
      } catch (error) {
        console.error("Failed to fetch evaluation items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [evaluationType]);

  useEffect(() => {
    const currentData = loadInProgressEvaluation() || {};
    saveInProgressEvaluation({ ...currentData, scores, notes });
  }, [scores, notes]);

  const completedItems = useMemo(() => Object.keys(scores).length, [scores]);
  const progress = (completedItems / items.length) * 100;

  const handleScoreChange = (itemKey: string, score: number) => {
    setScores(prev => ({ ...prev, [itemKey]: score }));
  };

  const handleSubmit = () => {
    if (completedItems < items.length) {
      alert('يرجى تقييم جميع البنود قبل الإرسال.');
      return;
    }
    onSubmit(scores, notes);
  };

  const renderEvaluationItem = (item: EvaluationItem, index: number) => {
    const descriptions = evaluationType === 'monthly'
      ? monthlyDescriptions[item.item_key]
      : weeklyDescriptions[item.item_key];

    return (
      <div key={item.id} className="w-full bg-background py-4 px-2 sm:px-4 border-b">
        <p className="font-bold mb-4 text-sm sm:text-base break-words">{index + 1}. {item.question}</p>
        <RadioGroup
          value={scores[item.item_key]?.toString() || ''}
          onValueChange={(value) => handleScoreChange(item.item_key, parseInt(value, 10))}
          className="space-y-2 sm:space-y-4"
        >
          {[5, 4, 3, 2, 1].map(score => (
            <div key={score} className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="flex-1 min-w-0 w-full">
                <p className="text-xs sm:text-sm font-bold text-muted-foreground text-right break-words pr-2">
                  {descriptions?.[score - 1] || `وصف الدرجة ${score}`}
                </p>
              </div>
              <div className="flex items-center flex-shrink-0 self-end sm:self-auto">
                <RadioGroupItem
                  value={score.toString()}
                  id={`item-${item.id}-score-${score}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`item-${item.id}-score-${score}`}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-muted-foreground bg-background text-lg sm:text-xl font-bold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer"
                >
                  {score}
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  const renderMobileView = () => {
    if (items.length === 0) return null;
    const isLastStep = currentStep === items.length;
    const currentItem = isLastStep ? null : items[currentStep];

    return (
      <>
        <div className="pb-20 w-full overflow-hidden"> 
          {currentItem ? renderEvaluationItem(currentItem, currentStep) : (
            <div className="p-3 sm:p-4 md:p-6 w-full">
              <h3 className="text-lg sm:text-xl font-bold mb-4 break-words">الخطوة الأخيرة: الملاحظات العامة</h3>
              <Textarea
                placeholder="أضف أي ملاحظات عامة حول التقييم هنا..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full resize-none"
              />
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 w-full flex flex-col-reverse sm:flex-row justify-between gap-2 p-3 sm:p-4 border-t bg-background">
          <Button 
            onClick={() => setCurrentStep(s => s - 1)} 
            disabled={currentStep === 0} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            السابق
          </Button>
          {currentStep < items.length ? (
            <Button 
              onClick={() => setCurrentStep(s => s + 1)} 
              disabled={!scores[items[currentStep]?.item_key]}
              className="w-full sm:w-auto"
            >
              التالي
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={completedItems < items.length} 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              إرسال التقييم
            </Button>
          )}
        </div>
      </>
    );
  };

  const renderDesktopView = () => (
    <>
      {items.map((item, index) => renderEvaluationItem(item, index))}
      <div className="p-4 md:p-6">
        <h3 className="text-xl font-bold mb-4">الملاحظات العامة</h3>
        <Textarea
          placeholder="أضف أي ملاحظات عامة حول التقييم هنا..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>
      <div className="p-4 md:p-6">
        <Button onClick={handleSubmit} size="lg" className="w-full" disabled={completedItems < items.length}>
          إرسال التقييم
        </Button>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">جاري تحميل بنود التقييم...</p>
      </div>
    );
  }

  const progressSteps = items.length + 1; // +1 for notes step
  const mobileProgress = ((currentStep + 1) / progressSteps) * 100;


  return (
    <div dir="rtl" className="w-full bg-card flex flex-col h-full">
      <header className="flex-shrink-0 text-right p-4 border-b">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold break-words">
          تقييم: {nurseName}
          <span className="text-sm sm:text-lg text-muted-foreground font-medium mr-2">
            ({evaluationType === 'weekly' ? 'أسبوعي' : 'شهري'})
          </span>
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2 w-full">
          {isMobile ? (
            <>
              <span className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap">
                الخطوة {currentStep + 1} / {progressSteps}
              </span>
              <Progress value={mobileProgress} className="w-full" />
              <span className="font-bold text-primary text-xs sm:text-sm">{Math.round(mobileProgress)}%</span>
            </>
          ) : (
            <>
              <span className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap">
                {completedItems} / {items.length} مكتمل
              </span>
              <Progress value={progress} className="w-full max-w-xs" />
              <span className="font-bold text-primary text-xs sm:text-sm">{Math.round(progress)}%</span>
            </>
          )}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto overflow-x-hidden px-2 md:px-4">
        {isMobile ? renderMobileView() : renderDesktopView()}
      </main>
    </div>
  );
};

export default EvaluationForm;
