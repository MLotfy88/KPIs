import { useState, useMemo, useEffect } from 'react';
import { EvaluationType, EvaluationItem } from '@/types';
import { weeklyItems, monthlyItems } from '@/lib/evaluationItems';
import { loadInProgressEvaluation, saveInProgressEvaluation } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RatingCircles } from '@/components/ui/rating-circles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface EvaluationFormProps {
  evaluationType: EvaluationType;
  onSubmit: (scores: Record<string, number>, notes: string) => void;
}

const EvaluationForm = ({ evaluationType, onSubmit }: EvaluationFormProps) => {
  const items: EvaluationItem[] = evaluationType === 'weekly' ? weeklyItems : monthlyItems;
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const savedData = loadInProgressEvaluation();
    if (savedData) {
      setScores(savedData.scores || {});
      setNotes(savedData.notes || '');
    }
  }, []);

  useEffect(() => {
    const currentData = loadInProgressEvaluation() || {};
    saveInProgressEvaluation({ ...currentData, scores, notes });
  }, [scores, notes]);

  const completedItems = useMemo(() => Object.keys(scores).length, [scores]);
  const progress = (completedItems / items.length) * 100;

  const handleScoreChange = (itemId: number, score: number) => {
    setScores(prev => ({ ...prev, [itemId]: score }));
  };

  const handleSubmit = () => {
    if (completedItems < items.length) {
      alert('يرجى تقييم جميع البنود قبل الإرسال.');
      return;
    }
    onSubmit(scores, notes);
  };

  const groupedItems = useMemo(() => {
    if (evaluationType === 'weekly') {
      return { 'التقييم الأسبوعي': items };
    }
    return items.reduce((acc, item) => {
      const category = item.category || 'عام';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, EvaluationItem[]>);
  }, [items, evaluationType]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تقدم التقييم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={progress} />
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedItems} / {items.length} بنود مكتملة
          </p>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={Object.keys(groupedItems)} className="w-full space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category} as="div">
            <AccordionItem value={category} className="border-0">
              <AccordionTrigger className="p-6">
                <h3 className="text-xl font-bold">{category}</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-4">
                {categoryItems.map((item, index) => (
                  <div key={item.id} className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-muted/50' : ''}`}>
                    <p className="font-semibold mb-3">{item.id}. {item.text}</p>
                    <RatingCircles
                      value={scores[item.id] || 0}
                      onChange={(value) => handleScoreChange(item.id, value)}
                    />
                    <div className="grid grid-cols-5 gap-1 text-xs text-center text-muted-foreground mt-2">
                      {item.rubrics.map(rubric => (
                        <div key={rubric.score}>{rubric.description}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>

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
