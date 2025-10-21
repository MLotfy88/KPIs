import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  saveInProgressEvaluation,
  loadInProgressEvaluation,
  clearInProgressEvaluation,
} from '@/lib/storage';
import { Nurse, EvaluationType } from '@/types';
import NurseSelector from '@/components/supervisor/NurseSelector';
import EvaluationTypeSelector from '@/components/supervisor/EvaluationTypeSelector';
import EvaluationForm from '@/components/supervisor/EvaluationForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { saveEvaluation, checkIfEvaluationExists } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Info } from 'lucide-react';

type EvaluationStep = 'SELECT_NURSE' | 'SELECT_TYPE' | 'FILL_FORM' | 'CONFIRMATION' | 'ALREADY_EVALUATED';

const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedType = location.state?.evaluationType as EvaluationType | undefined;

  const [step, setStep] = useState<EvaluationStep>(preselectedType ? 'SELECT_NURSE' : 'SELECT_TYPE');
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [evaluationType, setEvaluationType] = useState<EvaluationType | null>(preselectedType || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // This effect is now primarily for handling pre-selected types from other pages
    if (preselectedType) {
      setEvaluationType(preselectedType);
      setStep('SELECT_NURSE');
    }
  }, [preselectedType]);

  const handleNurseSelect = async (nurse: Nurse) => {
    setSelectedNurse(nurse);
    if (evaluationType) {
      await checkAndProceed(nurse, evaluationType);
    } else {
      setStep('SELECT_TYPE');
    }
  };

  const handleTypeSelect = async (type: EvaluationType) => {
    setEvaluationType(type);
    if (selectedNurse) {
      await checkAndProceed(selectedNurse, type);
    }
  };

  const checkAndProceed = async (nurse: Nurse, type: EvaluationType) => {
    try {
      // First, check if an evaluation has already been submitted and finalized
      const exists = await checkIfEvaluationExists(nurse.id, type);
      if (exists) {
        const now = new Date();
        if (type === 'weekly') {
          const dayOfWeek = now.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
          setDaysUntilNext(daysUntilSaturday === 0 ? 7 : daysUntilSaturday);
        } else {
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysUntilNext(daysRemaining);
        }
        setStep('ALREADY_EVALUATED');
        return; // Stop further execution
      }

      // If not submitted, check for in-progress evaluation in localStorage
      const inProgress = loadInProgressEvaluation(nurse.id, type);
      if (inProgress && Object.keys(inProgress.scores).length > 0) {
        if (window.confirm('لديك تقييم غير مكتمل لهذا الممرض. هل تود استكماله؟')) {
          setStep('FILL_FORM');
        } else {
          // User chose not to continue, so clear the saved progress and start fresh
          clearInProgressEvaluation(nurse.id, type);
          setStep('FILL_FORM');
        }
      } else {
        // No saved progress, just proceed to the form
        setStep('FILL_FORM');
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'فشل التحقق من التقييمات السابقة.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (scores: Record<string, number>, notes: string) => {
    if (!selectedNurse || !evaluationType || !user) return;

    setIsSubmitting(true);
    try {
      await saveEvaluation({
        nurse_id: selectedNurse.id,
        supervisor_id: user.id,
        evaluation_type: evaluationType,
        notes,
        scores,
      });

      toast({
        title: 'تم إرسال التقييم بنجاح',
        description: `تم حفظ تقييم ${selectedNurse.name} بنجاح.`,
      });
      
      // Clear the specific in-progress evaluation from localStorage
      clearInProgressEvaluation(selectedNurse.id, evaluationType);
      
      setStep('CONFIRMATION');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم يتم حفظ التقييم. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 'SELECT_TYPE' && !selectedNurse) {
      setStep('SELECT_NURSE');
    }

    if (step === 'SELECT_TYPE' && preselectedType) {
       setStep('FILL_FORM');
       return null;
    }

    switch (step) {
      case 'SELECT_NURSE':
        return (
          <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="mb-6 text-right">
                <h2 className="text-xl font-bold">الخطوة 1: اختيار الممرض</h2>
                <p className="text-muted-foreground">اختر الممرض الذي تود تقييمه.</p>
              </div>
              <NurseSelector onNurseSelect={handleNurseSelect} />
            </div>
          </div>
        );
      case 'SELECT_TYPE':
        return (
          <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>الخطوة 2: اختيار نوع التقييم</CardTitle>
                  <CardDescription>اختر نوع التقييم للممرض: {selectedNurse?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationTypeSelector onTypeSelect={handleTypeSelect} />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'FILL_FORM':
        if (!evaluationType || !selectedNurse) return null;
        return (
          <div className="w-full min-h-screen">
            <EvaluationForm
              nurseId={selectedNurse.id}
              evaluationType={evaluationType}
              onSubmit={handleSubmit}
              nurseName={selectedNurse.name}
            />
          </div>
        );
      case 'CONFIRMATION':
        return (
          <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-2xl mx-auto">
              <Card className="text-center p-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl mb-2">تم إرسال التقييم بنجاح!</CardTitle>
                <CardDescription className="mb-6">
                  تم حفظ تقييم الممرض "{selectedNurse?.name}" بنجاح.
                </CardDescription>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => navigate(user?.role === 'manager' ? '/manager/dashboard' : '/supervisor/dashboard')}>العودة للوحة التحكم</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('SELECT_NURSE');
                      setSelectedNurse(null);
                      // Reset evaluation type only if it wasn't pre-selected
                      if (!preselectedType) {
                        setEvaluationType(null);
                      }
                    }}
                  >
                    بدء تقييم جديد
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );
      default:
        return <NurseSelector onNurseSelect={handleNurseSelect} />;
      case 'ALREADY_EVALUATED':
        return (
          <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-2xl mx-auto">
              <Card className="text-center p-8">
                <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-2xl mb-2">التقييم مكتمل</CardTitle>
                <CardDescription className="mb-6">
                  لقد قمت بالفعل بتقييم الممرض "{selectedNurse?.name}" لهذا {evaluationType === 'weekly' ? 'الأسبوع' : 'الشهر'}.
                  <br />
                  التقييم الجديد سيكون متاحًا خلال <strong>{daysUntilNext} يوم(أيام)</strong>.
                </CardDescription>
                <div className="flex gap-4 justify-center">
                   <Button onClick={() => navigate(user?.role === 'manager' ? '/manager/dashboard' : '/supervisor/dashboard')}>العودة للوحة التحكم</Button>
                   <Button
                    variant="outline"
                    onClick={() => {
                      setStep('SELECT_NURSE');
                      setSelectedNurse(null);
                      setEvaluationType(null);
                    }}
                  >
                    تقييم ممرض آخر
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {renderStep()}
    </div>
  );
};

export default Evaluate;
