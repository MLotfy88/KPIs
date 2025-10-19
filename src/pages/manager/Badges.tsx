import { useEffect, useState } from 'react';
import { getBadges, saveBadge } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import BadgeFormDialog from '@/components/manager/BadgeFormDialog';
import { useToast } from '@/hooks/use-toast';

const BadgesPage = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleAddNew = () => {
    setSelectedBadge(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (badge: BadgeType) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };

  const handleSave = async (badgeData: Omit<BadgeType, 'badge_id' | 'created_at' | 'updated_at'>) => {
    try {
      await saveBadge({ ...badgeData, badge_id: selectedBadge?.badge_id });
      toast({
        title: 'تم الحفظ بنجاح',
        description: `تم ${selectedBadge ? 'تحديث' : 'إنشاء'} الشارة بنجاح.`,
      });
      fetchBadges(); // Refresh the list
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save badge:', error);
      toast({
        title: 'فشل الحفظ',
        description: 'حدث خطأ أثناء حفظ الشارة.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div>Loading badges...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <Card>
        <CardHeader className="text-right">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>إدارة الشارات</CardTitle>
              <CardDescription>عرض وتعديل وإضافة شارات جديدة للنظام.</CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة شارة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الأيقونة</TableHead>
                <TableHead className="text-right">اسم الشارة</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">نوع المعيار</TableHead>
                <TableHead className="text-right">الدورة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((badge) => (
                <TableRow key={badge.badge_id}>
                  <TableCell>
                    <Icon name={badge.badge_icon || 'HelpCircle'} />
                  </TableCell>
                  <TableCell>{badge.badge_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{badge.description}</TableCell>
                  <TableCell>{badge.criteria_type}</TableCell>
                  <TableCell>{badge.period_type}</TableCell>
                  <TableCell>{badge.active ? 'نشطة' : 'غير نشطة'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(badge)}>
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <BadgeFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        badge={selectedBadge}
      />
    </div>
  );
};

export default BadgesPage;
