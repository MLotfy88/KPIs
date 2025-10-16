import React from 'react';
import { ImprovementPlan } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';

interface IDPCardProps {
  plan: ImprovementPlan;
  onEdit: (plan: ImprovementPlan) => void;
}

const statusMap: Record<ImprovementPlan['status'], { text: string; color: 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500' }> = {
  active: { text: 'نشطة', color: 'bg-yellow-500' },
  completed: { text: 'مكتملة', color: 'bg-green-500' },
  cancelled: { text: 'ملغاة', color: 'bg-red-500' },
};

export const IDPCard: React.FC<IDPCardProps> = ({ plan, onEdit }) => {
  const statusInfo = statusMap[plan.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.goal}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} text-white`}>{statusInfo.text}</Badge>
            <span className="text-sm text-gray-500">
              {new Date(plan.created_at).toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-semibold">الإجراءات المطلوبة:</h4>
          <ul className="space-y-2">
            {plan.actions.map((action, index) => (
              <li key={index} className="flex items-center gap-2">
                {action.completed ? <CheckSquare className="text-green-500" /> : <Square className="text-gray-400" />}
                <span>{action.description}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  (تاريخ الاستحقاق: {new Date(action.due_date).toLocaleDateString('ar-EG')})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={() => onEdit(plan)}>
          عرض التفاصيل / تعديل
        </Button>
      </CardFooter>
    </Card>
  );
};
