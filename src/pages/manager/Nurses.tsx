import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getAllNurses, addNurse, getAllEvaluations, updateNurse, deleteNurse } from '@/lib/api';
import { Nurse, Evaluation } from '@/types';
import { Loader2, Search, ArrowUpDown, PlusCircle, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const nurseFormSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل." }),
  gender: z.enum(["male", "female"], {
    required_error: "الرجاء تحديد الجنس.",
  }),
  photo_url: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

type NurseFormValues = z.infer<typeof nurseFormSchema>;

type SortKey = 'name' | 'is_active' | 'created_at' | 'average_score';

interface NurseWithPerformance extends Nurse {
  average_score: number;
  performance_change: number | null;
}

const NursesPage: React.FC = () => {
  const [nurses, setNurses] = useState<NurseWithPerformance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [nurseToDelete, setNurseToDelete] = useState<Nurse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const { toast } = useToast();

  const form = useForm<NurseFormValues>({
    resolver: zodResolver(nurseFormSchema),
    defaultValues: {
      name: "",
      gender: "female",
      photo_url: "",
      is_active: true,
    },
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const cachedEvals = localStorage.getItem('evaluationsCache');
      let evalsData: Evaluation[];

      if (cachedEvals) {
        const { timestamp, data } = JSON.parse(cachedEvals);
        const isCacheValid = (new Date().getTime() - timestamp) < 5 * 60 * 1000; // 5 minutes
        if (isCacheValid) {
          evalsData = data;
        } else {
          evalsData = await getAllEvaluations();
          localStorage.setItem('evaluationsCache', JSON.stringify({ timestamp: new Date().getTime(), data: evalsData }));
        }
      } else {
        evalsData = await getAllEvaluations();
        localStorage.setItem('evaluationsCache', JSON.stringify({ timestamp: new Date().getTime(), data: evalsData }));
      }
      
      const nursesData = await getAllNurses();
      setEvaluations(evalsData);

      const nursesWithPerformance = nursesData.map(nurse => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        const lastMonthEvals = evalsData.filter(e => e.nurse_id === nurse.id && new Date(e.created_at) >= lastMonth && new Date(e.created_at) < now);
        const prevMonthEvals = evalsData.filter(e => e.nurse_id === nurse.id && new Date(e.created_at) >= twoMonthsAgo && new Date(e.created_at) < lastMonth);

        const lastMonthAvg = lastMonthEvals.length > 0 ? lastMonthEvals.reduce((acc, curr) => acc + curr.final_score, 0) / lastMonthEvals.length : 0;
        const prevMonthAvg = prevMonthEvals.length > 0 ? prevMonthEvals.reduce((acc, curr) => acc + curr.final_score, 0) / prevMonthEvals.length : 0;
        
        let performance_change: number | null = null;
        if (lastMonthAvg > 0 && prevMonthAvg > 0) {
          performance_change = ((lastMonthAvg - prevMonthAvg) / prevMonthAvg) * 100;
        }

        return {
          ...nurse,
          average_score: lastMonthAvg,
          performance_change,
        };
      });
      setNurses(nursesWithPerformance);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: NurseFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingNurse) {
        await updateNurse(editingNurse.id, values);
        toast({
          title: "نجاح",
          description: "تم تحديث بيانات الممرض بنجاح.",
        });
      } else {
        await addNurse(values);
        toast({
          title: "نجاح",
          description: "تمت إضافة الممرض بنجاح.",
        });
      }
      form.reset();
      setIsDialogOpen(false);
      setEditingNurse(null);
      localStorage.removeItem('evaluationsCache'); // Invalidate cache on change
      fetchData();
    } catch (error) {
      console.error("Failed to save nurse:", error);
      toast({
        title: "خطأ",
        description: `فشل في ${editingNurse ? 'تحديث' : 'إضافة'} الممرض.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (nurse: Nurse) => {
    setEditingNurse(nurse);
    form.reset({
      name: nurse.name,
      gender: nurse.gender,
      photo_url: nurse.photo_url,
      is_active: nurse.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (nurse: Nurse) => {
    try {
      await updateNurse(nurse.id, { is_active: !nurse.is_active });
      toast({
        title: "نجاح",
        description: `تم تغيير حالة الممرض ${nurse.name} إلى ${!nurse.is_active ? 'نشط' : 'غير نشط'}.`,
      });
      localStorage.removeItem('evaluationsCache'); // Invalidate cache on change
      fetchData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تغيير حالة الممرض.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!nurseToDelete) return;
    try {
      await deleteNurse(nurseToDelete.id);
      toast({
        title: "نجاح",
        description: `تم حذف الممرض ${nurseToDelete.name} بنجاح.`,
      });
      localStorage.removeItem('evaluationsCache'); // Invalidate cache on change
      fetchData();
      setNurseToDelete(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الممرض.",
        variant: "destructive",
      });
    }
  };

  const sortedAndFilteredNurses = useMemo(() => {
    let sortableNurses = [...nurses].filter(nurse =>
      nurse.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      sortableNurses.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableNurses;
  }, [nurses, searchTerm, sortConfig]);

  const paginatedNurses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredNurses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredNurses, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredNurses.length / ITEMS_PER_PAGE);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">إدارة فريق التمريض</h1>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setEditingNurse(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة ممرض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingNurse ? 'تعديل بيانات الممرض' : 'إضافة ممرض جديد'}</DialogTitle>
              <DialogDescription>
                {editingNurse ? 'قم بتحديث بيانات الممرض هنا.' : 'أدخل بيانات الممرض الجديد هنا.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم الممرض" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>الجنس</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="female" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              أنثى
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="male" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              ذكر
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الصورة</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>الحالة</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حفظ
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="ابحث عن ممرض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search for a nurse"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصورة</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('name')} aria-label={`Sort by Name ${sortConfig?.key === 'name' ? (sortConfig.direction === 'ascending' ? '(ascending)' : '(descending)') : ''}`}>
                  الاسم
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                 <Button variant="ghost" onClick={() => requestSort('average_score')} aria-label={`Sort by Average Score ${sortConfig?.key === 'average_score' ? (sortConfig.direction === 'ascending' ? '(ascending)' : '(descending)') : ''}`}>
                  متوسط الأداء
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>مؤشر الأداء</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('created_at')} aria-label={`Sort by Join Date ${sortConfig?.key === 'created_at' ? (sortConfig.direction === 'ascending' ? '(ascending)' : '(descending)') : ''}`}>
                  تاريخ الانضمام
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNurses.map((nurse) => (
              <TableRow key={nurse.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={nurse.photo_url} alt={nurse.name} loading="lazy" />
                    <AvatarFallback>
                      {nurse.gender === 'male' ? 'M' : 'F'}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Link to={`/manager/nurses/${nurse.id}`} className="font-medium text-primary hover:underline">
                    {nurse.name}
                  </Link>
                </TableCell>
                <TableCell>{nurse.average_score.toFixed(1)}%</TableCell>
                <TableCell>
                  {nurse.performance_change !== null ? (
                    <span className={`flex items-center ${nurse.performance_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {nurse.performance_change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      {Math.abs(nurse.performance_change).toFixed(1)}%
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell>{nurse.is_active ? 'نشط' : 'غير نشط'}</TableCell>
                <TableCell>{new Date(nurse.created_at).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${nurse.name}`}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/manager/evaluate" state={{ evaluationType: 'weekly', nurse }}>تقييم أسبوعي</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/manager/evaluate" state={{ evaluationType: 'monthly', nurse }}>تقييم شهري</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(nurse)}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(nurse)}>
                        {nurse.is_active ? 'جعله غير نشط' : 'جعله نشط'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setNurseToDelete(nurse)}>
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} aria-label="Go to previous page" />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={i + 1 === currentPage} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }} aria-label={`Go to page ${i + 1}`}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} aria-label="Go to next page" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <AlertDialog open={!!nurseToDelete} onOpenChange={(isOpen) => !isOpen && setNurseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الممرض بشكل دائم
              ({nurseToDelete?.name}) وجميع بياناته المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              نعم، قم بالحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NursesPage;
