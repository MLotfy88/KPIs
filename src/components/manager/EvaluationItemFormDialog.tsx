import { useState, useEffect } from 'react';
import { EvaluationItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface EvaluationItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<EvaluationItem>) => void;
  item: Partial<EvaluationItem> | null;
}

const EvaluationItemFormDialog = ({ isOpen, onClose, onSave, item }: EvaluationItemFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<EvaluationItem>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        rubrics: item.rubrics || { '1': '', '2': '', '3': '', '4': '', '5': '' },
        evaluation_types: item.evaluation_types || ['monthly'],
      });
    } else {
      setFormData({
        question: '',
        category: 'technical',
        evaluation_types: ['monthly'],
        rubrics: { '1': '', '2': '', '3': '', '4': '', '5': '' },
      });
    }
  }, [item, isOpen]);

  const handleSubmit = () => {
    if (!formData.question || !formData.category || !formData.evaluation_types?.length) {
      toast({ title: 'خطأ', description: 'الرجاء ملء جميع الحقول الأساسية.', variant: 'destructive' });
      return;
    }
    // Further validation for rubrics can be added here
    onSave(formData);
  };

  const handleRubricChange = (score: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      rubrics: {
        ...prev.rubrics,
        [score]: text,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item?.id ? 'تعديل بند التقييم' : 'بند تقييم جديد'}</DialogTitle>
          <DialogDescription>أدخل تفاصيل البند والنصوص الوصفية للدرجات.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="question">السؤال (البند)</Label>
            <Input id="question" value={formData.question || ''} onChange={(e) => setFormData({ ...formData, question: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="category">التصنيف</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">فني</SelectItem>
                <SelectItem value="behavioral">سلوكي</SelectItem>
                <SelectItem value="care">رعاية</SelectItem>
                <SelectItem value="initiative">مبادرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>أنواع التقييم</Label>
            <div className="flex items-center space-x-4 space-x-reverse mt-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id="weekly" checked={formData.evaluation_types?.includes('weekly')} onCheckedChange={(checked) => {
                        const types = formData.evaluation_types || [];
                        if (checked) setFormData({...formData, evaluation_types: [...types, 'weekly']});
                        else setFormData({...formData, evaluation_types: types.filter(t => t !== 'weekly')});
                    }}/>
                    <Label htmlFor="weekly">أسبوعي</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id="monthly" checked={formData.evaluation_types?.includes('monthly')} onCheckedChange={(checked) => {
                        const types = formData.evaluation_types || [];
                        if (checked) setFormData({...formData, evaluation_types: [...types, 'monthly']});
                        else setFormData({...formData, evaluation_types: types.filter(t => t !== 'monthly')});
                    }}/>
                    <Label htmlFor="monthly">شهري</Label>
                </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">النصوص الوصفية للدرجات (Rubrics)</h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score}>
                  <Label htmlFor={`rubric-${score}`}>درجة {score}</Label>
                  <Input
                    id={`rubric-${score}`}
                    value={formData.rubrics?.[score] || ''}
                    onChange={(e) => handleRubricChange(score.toString(), e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationItemFormDialog;
