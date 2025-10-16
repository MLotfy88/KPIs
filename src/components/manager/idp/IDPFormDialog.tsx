import React, { useState, useEffect } from 'react';
import { ImprovementPlan, ImprovementPlanAction } from '@/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  goal: z.string().min(10, { message: 'الهدف يجب أن يكون 10 أحرف على الأقل.' }),
  actions: z.array(z.object({
    description: z.string().min(5, { message: 'الإجراء يجب أن يكون 5 أحرف على الأقل.' }),
    due_date: z.string().min(1, { message: 'يجب تحديد تاريخ الاستحقاق.' }),
    completed: z.boolean(),
  })).min(1, { message: 'يجب إضافة إجراء واحد على الأقل.' }),
});

type FormData = z.infer<typeof formSchema>;

interface IDPFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  plan?: ImprovementPlan | null;
}

export const IDPFormDialog: React.FC<IDPFormDialogProps> = ({ isOpen, onClose, onSave, plan }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: '',
      actions: [{ description: '', due_date: '', completed: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        goal: plan.goal,
        actions: plan.actions,
      });
    } else {
      form.reset({
        goal: '',
        actions: [{ description: '', due_date: '', completed: false }],
      });
    }
  }, [plan, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{plan ? 'تعديل خطة التحسين' : 'إنشاء خطة تحسين جديدة'}</DialogTitle>
          <DialogDescription>
            املأ التفاصيل أدناه لإنشاء أو تحديث خطة التحسين الفردية.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الهدف الرئيسي للخطة</FormLabel>
                  <FormControl>
                    <Textarea placeholder="مثال: تحسين مهارات التواصل مع المرضى" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>الإجراءات المطلوبة</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`actions.${index}.completed`}
                      render={({ field }) => (
                        <FormItem className="flex items-center h-10">
                           <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                           </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex-grow space-y-2">
                       <FormField
                          control={form.control}
                          name={`actions.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="وصف الإجراء" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`actions.${index}.due_date`}
                          render={({ field }) => (
                            <FormItem>
                               <FormControl>
                                <Input type="date" {...field} />
                               </FormControl>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ description: '', due_date: '', completed: false })}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                إضافة إجراء
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button>
              <Button type="submit">حفظ الخطة</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
