import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { Badge, BadgeTier, BadgeIcon, BadgeColor } from '@/types';

const iconOptions: BadgeIcon[] = ["Award", "Star", "TrendingUp", "Zap", "Shield"];
const colorOptions: BadgeColor[] = ["bronze", "silver", "gold", "platinum"];


interface BadgeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  badge?: Badge | null;
  onSave: (badgeData: Omit<Badge, 'id'>) => void;
}

const BadgeFormDialog: React.FC<BadgeFormDialogProps> = ({
  isOpen,
  onClose,
  badge,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<BadgeIcon>('Award');
  const [tiers, setTiers] = useState<BadgeTier[]>([]);

  useEffect(() => {
    if (badge) {
      setName(badge.name);
      setDescription(badge.description);
      setIcon(badge.icon);
      setTiers(badge.tiers);
    } else {
      // Reset form for new badge
      setName('');
      setDescription('');
      setIcon('Award');
      setTiers([{ name: 'bronze', criteria: { type: 'average_score', value: 80, period: 3, operator: 'gte' } }]);
    }
  }, [badge, isOpen]);

  const handleTierChange = (index: number, field: keyof BadgeTier, value: string | number) => {
    const newTiers = [...tiers];
    if (field === 'name') {
      newTiers[index][field] = value as BadgeColor;
    } else if (field === 'criteria') {
      // This assumes we only change the value for now. A more complex form could change type, operator etc.
      newTiers[index].criteria = { ...newTiers[index].criteria, value: Number(value) };
    }
    setTiers(newTiers);
  };

  const addTier = () => {
    // Add a new tier with a default color that isn't already used, if possible
    const usedColors = tiers.map(t => t.name);
    const nextColor = colorOptions.find(c => !usedColors.includes(c)) || 'gold';
    setTiers([...tiers, { name: nextColor, criteria: { type: 'average_score', value: 90, period: 3, operator: 'gte' } }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const badgeData = {
      name,
      description,
      icon,
      tiers,
    };
    onSave(badgeData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{badge ? 'تعديل الشارة' : 'إضافة شارة جديدة'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">الاسم</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">الوصف</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">الأيقونة</Label>
            <Select onValueChange={(value: BadgeIcon) => setIcon(value)} defaultValue={icon}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر أيقونة" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-center">المستويات</h4>
            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-2 p-3 rounded-md border">
                  <div className="col-span-5">
                    <Select onValueChange={(value: BadgeColor) => handleTierChange(index, 'name', value)} defaultValue={tier.name}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="col-span-6">
                    <Input
                      type="number"
                      placeholder="قيمة الشرط"
                      value={tier.criteria.value}
                      onChange={(e) => handleTierChange(index, 'criteria', e.target.value)}
                      className="text-center"
                    />
                   </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeTier(index)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addTier} className="mt-4 w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة مستوى
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeFormDialog;
