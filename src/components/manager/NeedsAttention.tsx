import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Evaluation, User, Nurse } from '@/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NeedsAttentionProps {
  evaluations: Evaluation[];
  nurses: (User | Nurse)[];
}

const NeedsAttention = ({ evaluations, nurses }: NeedsAttentionProps) => {
  const needsAttention = useMemo(() => {
    const nurseScores: { [key: number]: { total: number; count: number; name: string; photo_url: string } } = {};

    evaluations.forEach(e => {
      if (!nurseScores[e.nurse_id]) {
        const nurse = nurses.find(n => n.id === e.nurse_id);
        nurseScores[e.nurse_id] = { total: 0, count: 0, name: nurse?.name || 'Unknown', photo_url: nurse?.photo_url || '' };
      }
      nurseScores[e.nurse_id].total += e.final_score;
      nurseScores[e.nurse_id].count++;
    });

    return Object.entries(nurseScores)
      .map(([id, data]) => ({
        id: parseInt(id),
        name: data.name,
        photo_url: data.photo_url,
        average: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => a.average - b.average)
      .slice(0, 3);
  }, [evaluations, nurses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>تحت المجهر</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {needsAttention.map((nurse) => (
            <div key={nurse.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={nurse.photo_url} alt={nurse.name} />
                  <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{nurse.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {nurse.average.toFixed(1)}%
                </Badge>
                <Button variant="outline" size="sm">
                  خطة تحسين
                </Button>
              </div>
            </div>
          ))}
          <div className="pt-4 text-sm text-muted-foreground">
            <p><strong>اقتراح:</strong> يمكن جدولة جلسة تدريبية للممرضين الأقل أداءً في المحاور الفنية.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeedsAttention;
