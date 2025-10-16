import { EvaluationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ClipboardList } from 'lucide-react';

interface EvaluationTypeSelectorProps {
  onTypeSelect: (type: EvaluationType) => void;
}

const EvaluationTypeSelector = ({ onTypeSelect }: EvaluationTypeSelectorProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card
        className="cursor-pointer hover:border-primary transition-all group"
        onClick={() => onTypeSelect('weekly')}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            <Calendar className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <CardTitle>تقييم أسبوعي</CardTitle>
              <CardDescription>تقييم سريع يركز على 9 بنود أساسية.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card
        className="cursor-pointer hover:border-primary transition-all group"
        onClick={() => onTypeSelect('monthly')}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            <ClipboardList className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <CardTitle>تقييم شهري</CardTitle>
              <CardDescription>تقييم شامل يغطي 29 بندًا تفصيليًا.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default EvaluationTypeSelector;
