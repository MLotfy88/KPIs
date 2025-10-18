import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Nurse } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TopPerformersProps {
  topPerformers: (Nurse & { average_score: number })[];
}

const TopPerformers = ({ topPerformers }: TopPerformersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الأعلى أداءً</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPerformers.map((nurse, index) => (
            <div key={nurse.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={nurse.photo_url} alt={nurse.name} />
                  <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{nurse.name}</span>
              </div>
              <Badge variant={index === 0 ? 'success' : index === 1 ? 'default' : 'secondary'}>
                {nurse.average_score.toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformers;
