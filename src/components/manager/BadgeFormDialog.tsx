import { useState, useEffect } from 'react';
import { Badge, BadgeTier, BadgeIcon, BadgeColor } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Star, Zap, Shield, TrendingUp, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const icons: Record<BadgeIcon, React.ReactNode> = {
  Award: <Award className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
};

const badgeColors: Record<BadgeColor, string> = {
  bronze: 'text-[#cd7f32]',
  silver: 'text-[#c0c0c0]',
  gold: 'text-[#ffd700]',
  platinum: 'text-[#e5e4e2]',
};

interface BadgeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (badge: Partial<Badge>) => void;
  badge: Partial<Badge> | null;
  isSaving: boolean;
}

const BadgeFormDialog = ({ isOpen, onOpenChange, onSave, badge, isSaving }: BadgeFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<Badge>>({});
  const { toast } = useToast();

  useEffect(() => {
    setFormData(badge || {});
  }, [badge]);

  const handleTierChange = (index: number, field: keyof BadgeTier, value: any) => {
    const newTiers = [...(formData.tiers || [])];
    // @ts-ignore
    newTiers[index][field] = value;
    setFormData({ ...formData, tiers: newTiers });
  };
  
  const handleCriteriaChange = (index: number, field: keyof BadgeTier['criteria'], value: any) => {
    const newTiers = [...(formData.tiers || [])];
    newTiers[index].criteria[field] = value;
    setFormData({ ...formData, tiers: newTiers });
  };

  const addTier = () => {
    const newTier: BadgeTier = {
      name: 'bronze',
      criteria: { type: 'average_score', value: 70, operator: 'gte' },
    };
    setFormData({ ...formData, tiers: [...(formData.tiers || []), newTier] });
  };

  const removeTier = (index: number) => {
    const newTiers = [...(formData.tiers || [])];
    newTiers.splice(index, 1);
    setFormData({ ...formData, tiers: newTiers });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.icon || !formData.tiers || formData.tiers.length === 0) {
      toast({ title: 'خطأ', description: 'الرجاء ملء جميع الحقول الأساسية وإضافة مستوى واحد على الأقل.', variant: 'destructive' });
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'تعديل الشارة' : 'شارة جديدة'}</DialogTitle>
          <DialogDescription>أدخل تفاصيل الشارة والمعايير المطلوبة للحصول عليها.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">اسم الشارة</Label>
            <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Input id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <Label>الأيقونة</Label>
            <div className="flex gap-2 flex-wrap p-2 border rounded-md">
              {Object.keys(icons).map((iconKey) => (
                <Button
                  key={iconKey}
                  variant={formData.icon === iconKey ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setFormData({ ...formData, icon: iconKey as BadgeIcon })}
                >
                  {icons[iconKey as BadgeIcon]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">مستويات الشارة</h4>
            {formData.tiers?.map((tier, index) => (
              <div key={index} className="p-4 border rounded-md space-y-3 bg-muted/50">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold">المستوى {index + 1}</h5>
                  <Button variant="ghost" size="icon" onClick={() => removeTier(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>اللون</Label>
                    <Select value={tier.name} onValueChange={(value) => handleTierChange(index, 'name', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللون..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(badgeColors).map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع المعيار</Label>
                    <Select value={tier.criteria.type} onValueChange={(value) => handleCriteriaChange(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="average_score">متوسط النقاط</SelectItem>
                        <SelectItem value="consistency">الاستمرارية</SelectItem>
                        <SelectItem value="specific_score">نقاط محددة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>القيمة</Label>
                    <Input type="number" value={tier.criteria.value} onChange={(e) => handleCriteriaChange(index, 'value', parseInt(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addTier}>إضافة مستوى</Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeFormDialog;
