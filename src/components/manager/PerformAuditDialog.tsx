import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Evaluation, Audit } from '@/types';
import { saveAudit } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface PerformAuditDialogProps {
  evaluations: Evaluation[];
  audits: Audit[];
  onAuditSuccess: () => void;
}

const PerformAuditDialog: React.FC<PerformAuditDialogProps> = ({ evaluations, audits, onAuditSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  
  // Form state
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [auditorNotes, setAuditorNotes] = useState('');
  const [decision, setDecision] = useState<Audit['decision'] | ''>('');

  const unauditedEvaluations = useMemo(() => {
    const auditedEvalIds = new Set(audits.map(a => a.evaluation_id));
    return evaluations.filter(e => !auditedEvalIds.has(e.id));
  }, [evaluations, audits]);

  const selectRandomEvaluation = () => {
    if (unauditedEvaluations.length === 0) {
      setSelectedEvaluation(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * unauditedEvaluations.length);
    setSelectedEvaluation(unauditedEvaluations[randomIndex]);
  };

  const resetForm = () => {
    setIsMatch(null);
    setAuditorNotes('');
    setDecision('');
  };

  useEffect(() => {
    if (selectedEvaluation) {
      resetForm();
    }
  }, [selectedEvaluation]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      selectRandomEvaluation();
    } else {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!selectedEvaluation || isMatch === null || !decision || !user) {
      toast({ title: "خطأ", description: "الرجاء تعبئة جميع الحقول المطلوبة.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const auditData: Omit<Audit, 'id' | 'created_at'> = {
        evaluation_id: selectedEvaluation.id,
        auditor_id: user.id,
        is_match: isMatch,
        auditor_notes: auditorNotes,
        decision: decision,
      };
      await saveAudit(auditData);
      toast({ title: "نجاح", description: "تم حفظ المراجعة بنجاح." });
      onAuditSuccess();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to save audit:", error);
      toast({ title: "خطأ", description: "فشل حفظ المراجعة. الرجاء المحاولة مرة أخرى.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>إجراء مراجعة جديدة</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>إجراء مراجعة جديدة</DialogTitle>
        </DialogHeader>
        {selectedEvaluation ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">تقييم عشوائي للمراجعة</h3>
              <Button variant="ghost" size="sm" onClick={selectRandomEvaluation} disabled={unauditedEvaluations.length <= 1}>
                <RefreshCw className="h-4 w-4 ml-2" />
                اختيار تقييم آخر
              </Button>
            </div>
            <div className="p-4 border rounded-md bg-muted text-sm">
              <p><strong>الممرض:</strong> {selectedEvaluation.nurse_name || 'غير معروف'}</p>
              <p><strong>تاريخ التقييم:</strong> {new Date(selectedEvaluation.created_at).toLocaleDateString('ar-EG')}</p>
              <p><strong>الدرجة النهائية:</strong> {selectedEvaluation.final_score.toFixed(1)}%</p>
            </div>
            
            <div className="space-y-2">
              <Label>هل التقييم يتطابق مع ملاحظاتك؟</Label>
              <RadioGroup onValueChange={(value) => setIsMatch(value === 'true')} value={isMatch === null ? '' : String(isMatch)}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="true" id="match-yes" />
                  <Label htmlFor="match-yes">نعم، متطابق</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="false" id="match-no" />
                  <Label htmlFor="match-no">لا، غير متطابق</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات المدقق</Label>
              <Textarea id="notes" value={auditorNotes} onChange={(e) => setAuditorNotes(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decision">القرار النهائي</Label>
              <Select onValueChange={(value: Audit['decision']) => setDecision(value)} value={decision}>
                <SelectTrigger id="decision">
                  <SelectValue placeholder="اختر قرارًا..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">قبول التقييم كما هو</SelectItem>
                  <SelectItem value="modified">تعديل التقييم</SelectItem>
                  <SelectItem value="rejected">رفض التقييم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-center py-8">لا توجد تقييمات جديدة متاحة للمراجعة.</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving || !selectedEvaluation}>
            {isSaving ? "جاري الحفظ..." : "حفظ المراجعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PerformAuditDialog;
