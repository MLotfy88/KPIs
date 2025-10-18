import React, { useState, useEffect } from 'react';
import { getBadges, addBadge, updateBadge, deleteBadge } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Edit, Trash2, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Partial<BadgeType> | null>(null);
  const { toast } = useToast();

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const data = await getBadges();
      setBadges(data);
    } catch (err) {
      setError('فشل في تحميل الشارات.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleSave = async () => {
    if (!currentBadge || !currentBadge.name || !currentBadge.description) {
      toast({ title: 'خطأ', description: 'الرجاء ملء جميع الحقول.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentBadge.id) {
        await updateBadge(currentBadge.id, currentBadge);
        toast({ title: 'نجاح', description: 'تم تحديث الشارة بنجاح.' });
      } else {
        // @ts-ignore
        await addBadge(currentBadge);
        toast({ title: 'نجاح', description: 'تمت إضافة الشارة بنجاح.' });
      }
      setIsDialogOpen(false);
      setCurrentBadge(null);
      fetchBadges();
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حفظ الشارة.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (badgeId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الشارة؟')) {
      try {
        await deleteBadge(badgeId);
        toast({ title: 'نجاح', description: 'تم حذف الشارة بنجاح.' });
        fetchBadges();
      } catch (err) {
        toast({ title: 'خطأ', description: 'فشل في حذف الشارة.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الشارات</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCurrentBadge({ name: '', description: '', tiers: [{ name: 'bronze', criteria: { type: 'average_score', value: 70 } }, { name: 'silver', criteria: { type: 'average_score', value: 80 } }, { name: 'gold', criteria: { type: 'average_score', value: 90 } }] })}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة شارة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentBadge?.id ? 'تعديل الشارة' : 'شارة جديدة'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل الشارة هنا.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">اسم الشارة</Label>
                <Input id="name" value={currentBadge?.name || ''} onChange={(e) => setCurrentBadge({ ...currentBadge, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input id="description" value={currentBadge?.description || ''} onChange={(e) => setCurrentBadge({ ...currentBadge, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-primary" />
                    <span>{badge.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setCurrentBadge(badge); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(badge.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgesPage;
