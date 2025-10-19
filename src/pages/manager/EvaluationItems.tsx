import { useEffect, useState } from 'react';
import { getEvaluationItems, saveEvaluationItem, deleteEvaluationItem } from '@/lib/api';
import { EvaluationItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EvaluationItemFormDialog from '@/components/manager/EvaluationItemFormDialog';
import { Badge } from '@/components/ui/badge';

const EvaluationItemsPage = () => {
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<EvaluationItem> | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await getEvaluationItems();
      setItems(data);
    } catch (err) {
      setError('Failed to fetch evaluation items.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: EvaluationItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا البند؟')) {
      try {
        await deleteEvaluationItem(itemId);
        toast({ title: 'تم الحذف بنجاح' });
        fetchItems(); // Refresh list
      } catch (error) {
        toast({ title: 'فشل الحذف', description: 'حدث خطأ أثناء حذف البند.', variant: 'destructive' });
      }
    }
  };

  const handleSave = async (itemData: Partial<EvaluationItem>) => {
    try {
      await saveEvaluationItem({ ...itemData, id: selectedItem?.id });
      toast({
        title: 'تم الحفظ بنجاح',
        description: `تم ${selectedItem ? 'تحديث' : 'إنشاء'} البند بنجاح.`,
      });
      fetchItems();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'فشل الحفظ', description: 'حدث خطأ أثناء حفظ البند.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div>Loading evaluation items...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <Card>
        <CardHeader className="text-right">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>إدارة بنود التقييم</CardTitle>
              <CardDescription>عرض وتعديل وإضافة بنود تقييم جديدة للنظام.</CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة بند جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السؤال (البند)</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-md">{item.question}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.evaluation_types?.map(type => (
                        <Badge key={type} variant={type === 'monthly' ? 'default' : 'secondary'}>
                          {type === 'monthly' ? 'شهري' : 'أسبوعي'}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => handleEdit(item)}>
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EvaluationItemFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        item={selectedItem}
      />
    </div>
  );
};

export default EvaluationItemsPage;
