import { useState, useMemo, useEffect } from 'react';
import { EvaluationType, EvaluationItem } from '@/types';
import { weeklyItems, monthlyItems } from '@/lib/evaluationItems';
import { loadInProgressEvaluation, saveInProgressEvaluation } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RatingCircles } from '@/components/ui/rating-circles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EvaluationFormProps {
  evaluationType: EvaluationType;
  onSubmit: (scores: Record<string, number>, notes: string) => void;
}

const EvaluationForm = ({ evaluationType, onSubmit }: EvaluationFormProps) => {
  const items: EvaluationItem[] = evaluationType === 'weekly' ? weeklyItems : monthlyItems;
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  // Load scores and notes from localStorage on initial render
  useEffect(() => {
    const savedData = loadInProgressEvaluation();
    if (savedData) {
      setScores(savedData.scores || {});
      setNotes(savedData.notes || '');
    }
  }, []);

  // Save scores and notes to localStorage whenever they change
  useEffect(() => {
    const currentData = loadInProgressEvaluation() || {};
    saveInProgressEvaluation({
      ...currentData,
      scores,
      notes,
    });
  }, [scores, notes]);

  const completedItems = useMemo(() => Object.keys(scores).length, [scores]);
  const progress = (completedItems / items.length) * 100;

  const handleScoreChange = (itemId: number, score: number) => {
    setScores(prev => ({ ...prev, [itemId]: score }));
  };

  const handleSubmit = () => {
    // Basic validation to ensure all items are scored
    if (completedItems < items.length) {
      alert('يرجى تقييم جميع البنود قبل الإرسال.');
      return;
    }
    onSubmit(scores, notes);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تقدم التقييم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="w-full" />
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedItems} / {items.length} بنود مكتملة
          </p>
        </CardContent>
      </Card>

      {items.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="text-lg">{item.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">التقييم (من 1 إلى 5)</label>
              <RatingCircles
                value={scores[item.id] || 0}
                onChange={(value) => handleScoreChange(item.id, value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
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

      <Button onClick={handleSubmit} size="lg" className="w-full" disabled={completedItems < items.length}>
        إرسال التقييم
      </Button>
    </div>
  );
};

export default EvaluationForm;
