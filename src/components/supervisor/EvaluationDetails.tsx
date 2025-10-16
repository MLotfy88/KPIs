import { Evaluation, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { weeklyItems, monthlyItems } from '@/lib/evaluationItems';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EvaluationDetailsProps {
  evaluation: Evaluation | null;
  isOpen: boolean;
  onClose: () => void;
  supervisors: User[];
}

const EvaluationDetails = ({ evaluation, isOpen, onClose, supervisors }: EvaluationDetailsProps) => {
  if (!evaluation) return null;

  const items = evaluation.evaluation_type === 'weekly' ? weeklyItems : monthlyItems;
  const supervisorName = supervisors.find(s => s.id === evaluation.supervisor_id)?.name || 'غير معروف';

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
            {items.map(item => (
              <div key={item.id} className="p-3 border rounded-md">
                <p className="font-medium">{item.text}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  التقييم: {evaluation.scores[item.id] || 'N/A'} / 5
                </p>
              </div>
            ))}
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
