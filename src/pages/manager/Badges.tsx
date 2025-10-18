import React, { useState, useEffect } from 'react';
import { getBadges, addBadge, updateBadge, deleteBadge } from '@/lib/api';
import { Badge as BadgeType, BadgeIcon, BadgeColor } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Edit, Trash2, Award, Star, Zap, Shield, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BadgeFormDialog from '@/components/manager/BadgeFormDialog';

const icons: Record<BadgeIcon, React.ReactNode> = {
  Award: <Award className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
};

const badgeColors: Record<BadgeColor, string> = {
  bronze: 'text-[#cd7f32]',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-blue-300',
};

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

  const handleSave = async (badgeData: Partial<BadgeType>) => {
    setIsSaving(true);
    try {
      if (badgeData.id) {
        await updateBadge(badgeData.id, badgeData);
        toast({ title: 'نجاح', description: 'تم تحديث الشارة بنجاح.' });
      } else {
        await addBadge(badgeData as BadgeType);
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

  const handleAddNew = () => {
    setCurrentBadge({
      name: '',
      description: '',
      icon: 'Award',
      tiers: [{ name: 'bronze', criteria: { type: 'average_score', value: 70, operator: 'gte' } }],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الشارات</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة شارة جديدة
        </Button>
      </div>

      <BadgeFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        badge={currentBadge}
        isSaving={isSaving}
      />

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
                    <span className={badgeColors[badge.tiers[0]?.name || 'bronze']}>
                      {icons[badge.icon]}
                    </span>
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
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">المستويات</h4>
                  {badge.tiers.map(tier => (
                    <div key={tier.name} className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${badgeColors[tier.name]}`}>{tier.name}</span>
                      <span className="text-muted-foreground">
                        ({tier.criteria.type === 'average_score' ? 'متوسط' : 'استمرارية'} {'>='} {tier.criteria.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgesPage;
