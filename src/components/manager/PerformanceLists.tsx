import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Evaluation, Nurse } from '@/types';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface PerformanceListsProps {
  evaluations: Evaluation[];
  nurses: Nurse[];
}

const PerformanceLists = ({ evaluations, nurses }: PerformanceListsProps) => {
  const nursePerformance = useMemo(() => {
    const performanceMap = new Map<string, { totalScore: number; count: number; name: string; photo_url?: string }>();

    evaluations.forEach(evaluation => {
      if (!performanceMap.has(evaluation.nurse_id)) {
        const nurse = nurses.find(n => n.id === evaluation.nurse_id);
        performanceMap.set(evaluation.nurse_id, {
          totalScore: 0,
          count: 0,
          name: nurse?.name || 'Unknown',
          photo_url: nurse?.photo_url,
        });
      }
      const data = performanceMap.get(evaluation.nurse_id)!;
      data.totalScore += evaluation.final_score;
      data.count += 1;
    });

    const averages = Array.from(performanceMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      photo_url: data.photo_url,
      average: data.totalScore / data.count,
    }));

    return averages.sort((a, b) => b.average - a.average);
  }, [evaluations, nurses]);

  const topPerformers = nursePerformance.slice(0, 3);
  const needsAttention = nursePerformance.slice(-3).reverse();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="text-green-500" />
            أفضل أداء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topPerformers.map(nurse => (
            <div key={nurse.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={nurse.photo_url} />
                  <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{nurse.name}</p>
              </div>
              <p className="font-bold text-lg text-green-500">{nurse.average.toFixed(1)}%</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="text-red-500" />
            بحاجة للمتابعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {needsAttention.map(nurse => (
            <div key={nurse.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={nurse.photo_url} />
                  <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{nurse.name}</p>
              </div>
              <p className="font-bold text-lg text-red-500">{nurse.average.toFixed(1)}%</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceLists;
