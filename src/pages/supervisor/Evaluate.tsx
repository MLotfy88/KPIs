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

  useEffect(() => {
    const savedEvaluation = loadInProgressEvaluation();
    if (savedEvaluation?.nurse && savedEvaluation?.evaluationType) {
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
      clearInProgressEvaluation();
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
                      setEvaluationType(null);
                      clearInProgressEvaluation();
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
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {renderStep()}
    </div>
  );
};

export default Evaluate;
