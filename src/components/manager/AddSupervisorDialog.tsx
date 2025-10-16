import React, { useState } from 'react';
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
import { addUser } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface AddSupervisorDialogProps {
  children: React.ReactNode;
  onSupervisorAdded: () => void;
}

const AddSupervisorDialog: React.FC<AddSupervisorDialogProps> = ({ children, onSupervisorAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser({
        name,
        email,
        photo_url: photoUrl,
        is_active: isActive,
        role: 'supervisor',
      });
      toast({
        title: "نجاح",
        description: "تمت إضافة المشرف بنجاح.",
      });
      onSupervisorAdded();
      setIsOpen(false);
      // Reset form
      setName('');
      setEmail('');
      setPhotoUrl('');
      setIsActive(true);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المشرف.",
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
            <DialogTitle>إضافة مشرف جديد</DialogTitle>
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
            <Button type="submit">حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupervisorDialog;
