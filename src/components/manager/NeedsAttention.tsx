import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Nurse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NeedsAttentionProps {
  needsAttention: (Nurse & { average_score: number })[];
}

const NeedsAttention = ({ needsAttention }: NeedsAttentionProps) => {
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
                  {nurse.average_score.toFixed(1)}%
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
