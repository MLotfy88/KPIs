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
        // Optionally, show a toast or error message to the user
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

  const renderEvaluationItem = (item: EvaluationItem, index: number) => (
    <div key={item.id} className="p-4 md:p-6 rounded-lg bg-muted/50 mb-4">
      <p className="font-bold mb-4 text-lg md:text-xl">{index + 1}. {item.question}</p>
      <RadioGroup
        value={scores[item.item_key]?.toString() || ''}
        onValueChange={(value) => handleScoreChange(item.item_key, parseInt(value, 10))}
        className="grid grid-cols-5 gap-2 md:gap-4"
      >
        {[1, 2, 3, 4, 5].map(score => (
          <div key={score} className="flex flex-col items-center space-y-2">
            <RadioGroupItem value={score.toString()} id={`item-${item.id}-score-${score}`} />
            <Label htmlFor={`item-${item.id}-score-${score}`} className="font-bold text-lg">{score}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  const renderMobileView = () => {
    const currentItem = items[currentStep];
    return (
      <>
        {renderEvaluationItem(currentItem)}
        <div className="flex justify-between mt-6">
          <Button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
            السابق
          </Button>
          {currentStep < items.length - 1 ? (
            <Button onClick={() => setCurrentStep(s => s + 1)}>
              التالي
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={completedItems < items.length}>
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>الملاحظات العامة</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="أضف أي ملاحظات عامة حول التقييم هنا..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
      <Button onClick={handleSubmit} size="lg" className="w-full mt-6" disabled={completedItems < items.length}>
        إرسال التقييم
      </Button>
    </>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-8 text-center">
        <CardTitle>جاري تحميل بنود التقييم...</CardTitle>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-0 md:border md:shadow-sm">
      <CardHeader className="text-center px-2 pt-4 md:px-6 md:pt-6">
        <CardTitle className="text-xl md:text-2xl font-bold">تقييم: {nurseName}</CardTitle>
        <CardDescription className="text-sm md:text-base">
          {evaluationType === 'weekly' ? 'تقييم أسبوعي' : 'تقييم شهري'} - ({completedItems} / {items.length} مكتمل)
        </CardDescription>
        <div className="flex items-center gap-4 pt-3 w-full max-w-sm mx-auto">
          <Progress value={progress} />
          <span className="font-bold text-primary text-base">{Math.round(progress)}%</span>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
};

export default EvaluationForm;
