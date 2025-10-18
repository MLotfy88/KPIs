import { useEffect, useState } from 'react';
import { getBadges } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Icon from '@/components/ui/Icon';

const BadgesPage = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setIsLoading(true);
        const data = await getBadges();
        setBadges(data);
      } catch (err) {
        setError('Failed to fetch badges.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, []);

  if (isLoading) return <div>Loading badges...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>إدارة الشارات</CardTitle>
              <CardDescription>عرض وتعديل وإضافة شارات جديدة للنظام.</CardDescription>
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة شارة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الأيقونة</TableHead>
                <TableHead>اسم الشارة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>نوع المعيار</TableHead>
                <TableHead>الدورة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((badge) => (
                <TableRow key={badge.badge_id}>
                  <TableCell>
                    <Icon name={badge.badge_icon || 'HelpCircle'} />
                  </TableCell>
                  <TableCell>{badge.badge_name}</TableCell>
                  <TableCell>{badge.description}</TableCell>
                  <TableCell>{badge.criteria_type}</TableCell>
                  <TableCell>{badge.period_type}</TableCell>
                  <TableCell>{badge.active ? 'نشطة' : 'غير نشطة'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">تعديل</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgesPage;
