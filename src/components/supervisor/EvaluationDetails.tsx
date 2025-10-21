import { Evaluation, User, EvaluationItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getEvaluationItems } from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useEffect } from 'react';

interface EvaluationDetailsProps {
  evaluation: Evaluation | null;
  isOpen: boolean;
  onClose: () => void;
  supervisors: User[];
}

const EvaluationDetails = ({ evaluation, isOpen, onClose, supervisors }: EvaluationDetailsProps) => {
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (evaluation) {
      const fetchItems = async () => {
        try {
          setIsLoading(true);
          const fetchedItems = await getEvaluationItems(evaluation.evaluation_type);
          setItems(fetchedItems);
        } catch (error) {
          console.error("Failed to fetch evaluation items for details:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchItems();
    }
  }, [evaluation]);

  if (!evaluation) return null;

  const supervisorName = evaluation.supervisor_name || supervisors.find(s => s.id === evaluation.supervisor_id)?.name || 'غير معروف';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تفاصيل تقييم: {evaluation.nurse_name}</DialogTitle>
          <DialogDescription>
            {evaluation.evaluation_type === 'weekly' ? 'تقييم أسبوعي' : 'تقييم شهري'} - {format(new Date(evaluation.created_at), 'PPP', { locale: ar })}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">النتيجة النهائية</p>
              <p className="text-2xl font-bold text-primary">
                {evaluation.final_score.toFixed(1)}
                <span className="text-sm text-muted-foreground ml-1">
                  {evaluation.evaluation_type === 'monthly' ? '%' : '/ 5'}
                </span>
              </p>
            </div>
             <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">المشرف</p>
              <p className="text-xl font-bold">{supervisorName}</p>
            </div>
          </div>

          <h3 className="font-bold mt-6 mb-2">تفاصيل البنود</h3>
          <div className="space-y-3">
            {isLoading ? (
              <p>جاري تحميل البنود...</p>
            ) : (
              items.map(item => (
                <div key={item.id} className="p-3 border rounded-md">
                  <p className="font-medium">{item.question}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    التقييم: {evaluation.scores[item.item_key] || 'N/A'} / 5
                  </p>
                </div>
              ))
            )}
          </div>

          {evaluation.notes && (
             <div className="mt-6">
                <h3 className="font-bold mb-2">الملاحظات العامة</h3>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    <p>{evaluation.notes}</p>
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationDetails;
