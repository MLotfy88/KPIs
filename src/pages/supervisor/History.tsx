import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupervisorEvaluations, getAllNurses, getAllUsers } from '@/lib/api';
import { Evaluation, Nurse, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, SlidersHorizontal, X, FileDown } from 'lucide-react';
import EvaluationDetails from '@/components/supervisor/EvaluationDetails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SupervisorHistory = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  // Filter states
  const [selectedNurse, setSelectedNurse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const [evalData, nursesData, usersData] = await Promise.all([
          getSupervisorEvaluations(user.id),
          getAllNurses(),
          getAllUsers(),
        ]);
        const sortedData = evalData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setEvaluations(sortedData);
        setNurses(nursesData);
        setSupervisors(usersData.filter(u => u.role === 'supervisor'));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      const evaluationDate = new Date(e.created_at);
      const isNurseMatch = selectedNurse === 'all' || String(e.nurse_id) === selectedNurse;
      const isTypeMatch = selectedType === 'all' || e.evaluation_type === selectedType;
      const isDateMatch = !dateRange || (
        (!dateRange.from || evaluationDate >= dateRange.from) &&
        (!dateRange.to || evaluationDate <= dateRange.to)
      );
      return isNurseMatch && isTypeMatch && isDateMatch;
    });
  }, [evaluations, selectedNurse, selectedType, dateRange]);

  const resetFilters = () => {
    setSelectedNurse('all');
    setSelectedType('all');
    setDateRange(undefined);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // This is a placeholder for a real Arabic font.
    // For production, you would need to host a .ttf file (e.g., in /public/fonts)
    // and load it using doc.addFileToVFS and doc.addFont.
    // doc.setFont('Amiri'); // Set font after loading

    doc.setR2L(true); // Enable right-to-left text direction
    doc.text("سجل التقييمات", 200, 16, { align: 'right' });

    autoTable(doc, {
      startY: 20,
      head: [['النتيجة', 'النوع', 'التاريخ', 'اسم الممرض']],
      body: filteredEvaluations.map(e => [
        `${e.final_score.toFixed(1)} ${e.evaluation_type === 'monthly' ? '%' : '/ 5'}`,
        e.evaluation_type === 'weekly' ? 'أسبوعي' : 'شهري',
        format(new Date(e.created_at), 'yyyy/MM/dd'),
        e.nurse_name || nurses.find(n => String(n.id) === String(e.nurse_id))?.name || 'غير معروف'
      ]),
      // Theming and styling for the table
      styles: {
        halign: 'center',
        font: 'Helvetica', // Using a standard font as a fallback
      },
      headStyles: {
        fillColor: [22, 160, 133], // A shade of green
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        3: { halign: 'right' }, // Align nurse name to the right
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Page ${String(data.pageNumber)} of ${String(pageCount)}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`evaluations-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="container max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>سجل التقييمات</CardTitle>
          <CardDescription>عرض وتصفية جميع التقييمات السابقة التي قمت بها.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5" />
              خيارات الفلترة
            </CardTitle>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              تصدير PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Nurse Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">الممرض</label>
            <Select value={selectedNurse} onValueChange={setSelectedNurse}>
              <SelectTrigger>
                <SelectValue placeholder="اختر ممرض..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {nurses.map(nurse => (
                  <SelectItem key={nurse.id} value={String(nurse.id)}>
                    {nurse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع التقييم</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
             <label className="text-sm font-medium">التاريخ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "d LLL", { locale: ar })} - ${format(dateRange.to, "d LLL, y", { locale: ar })}`
                    ) : (
                      format(dateRange.from, "d LLL, y", { locale: ar })
                    )
                  ) : (
                    <span>اختر نطاق التاريخ...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Reset Button */}
          <Button onClick={resetFilters} variant="ghost" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            إلغاء الفلاتر
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              لا توجد نتائج تطابق بحثك.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvaluation(evaluation)}
                >
                  <div>
                    <p className="font-medium">
                      {evaluation.nurse_name || nurses.find(n => n.id === evaluation.nurse_id)?.name || 'ممرض غير معروف'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(evaluation.created_at), 'PPP', { locale: ar })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-primary">
                      {evaluation.final_score.toFixed(1)}
                      <span className="text-sm text-muted-foreground ml-1">
                        {evaluation.evaluation_type === 'monthly' ? '%' : '/ 5'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evaluation.evaluation_type === 'weekly' ? 'تقييم أسبوعي' : 'تقييم شهري'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <EvaluationDetails
        isOpen={!!selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
        evaluation={selectedEvaluation}
        supervisors={supervisors}
      />
    </div>
  );
};

export default SupervisorHistory;
