import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User } from '@/types';
import { updateUser } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface EditSupervisorDialogProps {
  supervisor: User;
  children: React.ReactNode;
  onSupervisorUpdated: () => void;
}

const EditSupervisorDialog: React.FC<EditSupervisorDialogProps> = ({ supervisor, children, onSupervisorUpdated }) => {
  const [name, setName] = useState(supervisor.name);
  const [email, setEmail] = useState(supervisor.email);
  const [photoUrl, setPhotoUrl] = useState(supervisor.photo_url || '');
  const [isActive, setIsActive] = useState(supervisor.is_active);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(supervisor.name);
      setEmail(supervisor.email);
      setPhotoUrl(supervisor.photo_url || '');
      setIsActive(supervisor.is_active);
    }
  }, [isOpen, supervisor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(supervisor.id, {
        name,
        email,
        photo_url: photoUrl,
        is_active: isActive,
        role: 'supervisor',
      });
      toast({
        title: "نجاح",
        description: "تم تحديث بيانات المشرف بنجاح.",
      });
      onSupervisorUpdated();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات المشرف.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المشرف</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                الاسم
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                البريد الإلكتروني
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="photo_url" className="text-right">
                رابط الصورة
              </Label>
              <Input id="photo_url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                الحالة
              </Label>
              <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSupervisorDialog;
