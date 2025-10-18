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
import { saveEvaluation } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

type EvaluationStep = 'SELECT_NURSE' | 'SELECT_TYPE' | 'FILL_FORM' | 'CONFIRMATION';

const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedType = location.state?.evaluationType as EvaluationType | undefined;

  const [step, setStep] = useState<EvaluationStep>(preselectedType ? 'SELECT_NURSE' : 'SELECT_TYPE');
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [evaluationType, setEvaluationType] = useState<EvaluationType | null>(preselectedType || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load saved evaluation on mount
  useEffect(() => {
    const savedEvaluation = loadInProgressEvaluation();
    if (savedEvaluation?.nurse && savedEvaluation?.evaluationType) {
      // If coming from a direct link, ignore saved evaluations
      if (preselectedType) {
        clearInProgressEvaluation();
        return;
      }

      if (window.confirm('لديك تقييم غير مكتمل. هل تود استكماله؟')) {
        setSelectedNurse(savedEvaluation.nurse);
        setEvaluationType(savedEvaluation.evaluationType);
        setStep('FILL_FORM');
      } else {
        clearInProgressEvaluation();
      }
    }
  }, [preselectedType]);

  // Save progress whenever nurse or type changes
  useEffect(() => {
    if (selectedNurse) {
      saveInProgressEvaluation({
        nurse: selectedNurse,
        evaluationType: evaluationType ?? undefined,
        step: evaluationType ? 'FILL_FORM' : 'SELECT_TYPE',
      });
    }
  }, [selectedNurse, evaluationType]);

  const handleNurseSelect = (nurse: Nurse) => {
    setSelectedNurse(nurse);
    if (evaluationType) {
      setStep('FILL_FORM');
    } else {
      setStep('SELECT_TYPE');
    }
  };

  const handleTypeSelect = (type: EvaluationType) => {
    setEvaluationType(type);
    setStep('FILL_FORM');
  };

  const handleSubmit = async (scores: Record<string, number>, notes: string) => {
    if (!selectedNurse || !evaluationType || !user) return;

    setIsSubmitting(true);
    try {
      // The final_score is no longer calculated on the client-side.
      // The new saveEvaluation function handles the new structure.
      await saveEvaluation({
        nurse_id: selectedNurse.id,
        supervisor_id: user.id,
        evaluation_type: evaluationType,
        notes,
        scores, // Pass scores object as per the new EvaluationSubmission type
      });

      toast({
        title: 'تم إرسال التقييم بنجاح',
        description: `تم حفظ تقييم ${selectedNurse.name} بنجاح.`,
      });
      clearInProgressEvaluation(); // Clear storage on success
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
      // If for some reason we are at SELECT_TYPE but have no nurse, go back.
      setStep('SELECT_NURSE');
    }

    // If a type is pre-selected, we don't need to show the type selector.
    // The main flow will handle moving from nurse selection to the form.
    if (step === 'SELECT_TYPE' && preselectedType) {
       setStep('FILL_FORM');
       return null; // Render nothing this cycle, will re-render with form
    }

    switch (step) {
      case 'SELECT_NURSE':
        return (
          <Card>
            <CardHeader>
              <CardTitle>الخطوة 1: اختيار الممرض</CardTitle>
              <CardDescription>اختر الممرض الذي تود تقييمه.</CardDescription>
            </CardHeader>
            <CardContent>
              <NurseSelector onNurseSelect={handleNurseSelect} />
            </CardContent>
          </Card>
        );
      case 'SELECT_TYPE':
        return (
          <Card>
            <CardHeader>
              <CardTitle>الخطوة 2: اختيار نوع التقييم</CardTitle>
              <CardDescription>اختر نوع التقييم للممرض: {selectedNurse?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <EvaluationTypeSelector onTypeSelect={handleTypeSelect} />
            </CardContent>
          </Card>
        );
      case 'FILL_FORM':
        if (!evaluationType || !selectedNurse) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle>الخطوة 3: ملء الاستبيان</CardTitle>
              <CardDescription>
                تقييم {evaluationType === 'weekly' ? 'أسبوعي' : 'شهري'} للممرض: {selectedNurse?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvaluationForm 
                evaluationType={evaluationType} 
                onSubmit={handleSubmit}
                nurseName={selectedNurse.name}
              />
            </CardContent>
          </Card>
        );
      case 'CONFIRMATION':
        return (
          <Card className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">تم إرسال التقييم بنجاح!</CardTitle>
            <CardDescription className="mb-6">
              تم حفظ تقييم الممرض "{selectedNurse?.name}" بنجاح.
            </CardDescription>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/supervisor/dashboard')}>العودة للوحة التحكم</Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset state for a new evaluation
                  setStep('SELECT_NURSE');
                  setSelectedNurse(null);
                  setEvaluationType(null);
                  clearInProgressEvaluation(); // Ensure storage is cleared
                }}
              >
                بدء تقييم جديد
              </Button>
            </div>
          </Card>
        );
      default:
        return <NurseSelector onNurseSelect={handleNurseSelect} />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-2 sm:p-4">
      {renderStep()}
    </div>
  );
};

export default Evaluate;
