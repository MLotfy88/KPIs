import { useState, useEffect } from 'react';
import { Badge, BadgeIcon, EvaluationItem } from '@/types';
import { getEvaluationItems } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/Icon';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const icons: BadgeIcon[] = [
  'Award', 'Star', 'Zap', 'Shield', 'TrendingUp', 'Anchor', 'Aperture', 'Bike', 'BookOpen', 'Briefcase',
  'Camera', 'CheckCircle', 'Clipboard', 'Cloud', 'Code', 'Compass', 'Cpu', 'CreditCard', 'Database', 'Disc',
  'Feather', 'Figma', 'FileText', 'Film', 'Flag', 'Gift', 'GitBranch', 'Globe', 'Heart', 'Home',
  'Image', 'Key', 'Layers', 'LifeBuoy', 'Link', 'Lock', 'MapPin', 'Maximize', 'Mic', 'Moon',
  'MousePointer', 'Music', 'Package', 'PenTool', 'Phone', 'PieChart', 'Power', 'Radio', 'Save', 'Settings',
  'Share2', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Tag', 'Target', 'Terminal', 'ThumbsUp', 'Tool',
  'Trello', 'Truck', 'Umbrella', 'Video', 'Watch', 'Wifi', 'Wind', 'Youtube'
];

const tierNames = ['bronze', 'silver', 'gold', 'platinum'];

interface BadgeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badgeData: Omit<Badge, 'badge_id' | 'created_at' | 'updated_at'>) => void;
  badge: Badge | null;
}

const BadgeFormDialog = ({ isOpen, onClose, onSave, badge }: BadgeFormDialogProps) => {
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([]);
  const [formData, setFormData] = useState<Omit<Badge, 'badge_id' | 'created_at' | 'updated_at'>>({
    badge_name: '',
    description: '',
    badge_icon: 'Award',
    criteria_type: 'average_score',
    period_type: 'monthly',
    active: true,
    thresholds: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await getEvaluationItems();
        setEvaluationItems(items);
      } catch (error) {
        console.error("Failed to fetch evaluation items", error);
        toast({ title: "Failed to load evaluation items", variant: "destructive" });
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (badge) {
      setFormData({
        badge_name: badge.badge_name,
        description: badge.description,
        badge_icon: badge.badge_icon,
        criteria_type: badge.criteria_type,
        period_type: badge.period_type,
        active: badge.active,
        thresholds: {
          bronze: badge.thresholds?.bronze ?? 0,
          silver: badge.thresholds?.silver ?? 0,
          gold: badge.thresholds?.gold ?? 0,
          platinum: badge.thresholds?.platinum ?? 0,
        },
        linked_metrics: badge.linked_metrics || [],
      });
    } else {
      // Reset for new badge
      setFormData({
        badge_name: '',
        description: '',
        badge_icon: 'Award',
        criteria_type: 'average_score',
        period_type: 'monthly',
        active: true,
        thresholds: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        linked_metrics: [],
      });
    }
  }, [badge, isOpen]);

  const handleThresholdChange = (tier: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        thresholds: {
          ...prev.thresholds,
          [tier]: numValue,
        },
      }));
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.badge_name || !formData.description) {
       toast({ title: 'خطأ', description: 'الرجاء ملء اسم الشارة ووصفها.', variant: 'destructive' });
      return;
    }
    onSave(formData);
  };

  const handleMetricToggle = (metricKey: string) => {
    setFormData(prev => {
      const newMetrics = prev.linked_metrics?.includes(metricKey)
        ? prev.linked_metrics.filter(m => m !== metricKey)
        : [...(prev.linked_metrics || []), metricKey];
      return { ...prev, linked_metrics: newMetrics };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{badge ? 'تعديل الشارة' : 'شارة جديدة'}</DialogTitle>
          <DialogDescription>أدخل تفاصيل الشارة والمعايير المطلوبة للحصول عليها.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">اسم الشارة</Label>
            <Input id="name" value={formData.badge_name || ''} onChange={(e) => setFormData({ ...formData, badge_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Input id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <Label>الأيقونة</Label>
            <Select value={formData.badge_icon} onValueChange={(value) => setFormData({ ...formData, badge_icon: value as BadgeIcon })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر أيقونة..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {icons.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      <Icon name={iconName} />
                      <span>{iconName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نوع المعيار</Label>
              <Select value={formData.criteria_type} onValueChange={(value) => setFormData({ ...formData, criteria_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="average_score">متوسط النقاط</SelectItem>
                  <SelectItem value="total_evaluations">عدد التقييمات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الفترة</Label>
              <Select value={formData.period_type} onValueChange={(value) => setFormData({ ...formData, period_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">المستويات (الدرجة المطلوبة)</h4>
            <div className="grid grid-cols-2 gap-4">
              {tierNames.map(tier => (
                <div key={tier}>
                  <Label htmlFor={`threshold-${tier}`} className="capitalize">{tier}</Label>
                  <Input
                    id={`threshold-${tier}`}
                    type="number"
                    value={formData.thresholds?.[tier as keyof typeof formData.thresholds] || 0}
                    onChange={(e) => handleThresholdChange(tier, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active-mode"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active-mode">شارة نشطة</Label>
          </div>

          <div>
            <Label>بنود التقييم المرتبطة</Label>
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="ابحث عن بند..." />
              <CommandList className="max-h-[150px]">
                <CommandEmpty>لم يتم العثور على بنود.</CommandEmpty>
                <CommandGroup>
                  {evaluationItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleMetricToggle(item.item_key)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.linked_metrics?.includes(item.item_key)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {item.question}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <p className="text-xs text-muted-foreground mt-1">
              سيتم حساب متوسط النقاط لهذه البنود فقط لمنح الشارة.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeFormDialog;
