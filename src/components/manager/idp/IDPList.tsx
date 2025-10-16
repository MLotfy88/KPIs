import React from 'react';
import { ImprovementPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IDPCard } from './IDPCard';

interface IDPListProps {
  plans: ImprovementPlan[];
  onAddPlan: () => void;
  onEditPlan: (plan: ImprovementPlan) => void;
}

export const IDPList: React.FC<IDPListProps> = ({ plans, onAddPlan, onEditPlan }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>خطط التحسين الفردية</CardTitle>
        <Button onClick={onAddPlan}>إضافة خطة جديدة</Button>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="text-center text-gray-500">لا توجد خطط تحسين حالية لهذه الممرضة.</p>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <IDPCard key={plan.id} plan={plan} onEdit={onEditPlan} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
