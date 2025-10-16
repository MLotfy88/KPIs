import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllEvaluations, getAllNurses } from '@/lib/api';
import { Evaluation, Nurse } from '@/types';
import { evaluationItems } from '@/lib/evaluationItems';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const months = [
  { value: 0, label: 'يناير' }, { value: 1, label: 'فبراير' }, { value: 2, label: 'مارس' },
  { value: 3, label: 'أبريل' }, { value: 4, label: 'مايو' }, { value: 5, label: 'يونيو' },
  { value: 6, label: 'يوليو' }, { value: 7, label: 'أغسطس' }, { value: 8, label: 'سبتمبر' },
  { value: 9, label: 'أكتوبر' }, { value: 10, label: 'نوفمبر' }, { value: 11, label: 'ديسمبر' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface ReportData {
  totalEvaluations: number;
  averageScore: number;
  evaluationsByType: { weekly: number; monthly: number };
  performanceByCategory: { name: string; score: number }[];
  topPerformers: Nurse[];
  needsAttention: Nurse[];
  itemPerformance?: { id: number; text: string; avgScore: number; category: string }[];
  outstandingNurses?: (Nurse & { avgScore: number })[];
}

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [compareMonth, setCompareMonth] = useState<number>(new Date().getMonth() - 1);
  const [compareYear, setCompareYear] = useState<number>(currentYear);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [compareReportData, setCompareReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.text(`Monthly Report: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, 16);
    
    (doc as any).autoTable({
      startY: 22,
      head: [['Metric', 'Value']],
      body: [
        ['Total Evaluations', reportData.totalEvaluations],
        ['Average Score', `${reportData.averageScore.toFixed(2)}%`],
        ['Weekly Evaluations', reportData.evaluationsByType.weekly],
        ['Monthly Evaluations', reportData.evaluationsByType.monthly],
      ],
    });

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Category', 'Average Score (%)']],
      body: reportData.performanceByCategory.map(c => [c.name, c.score.toFixed(2)]),
    });
    
    doc.save(`report-${selectedYear}-${selectedMonth + 1}.pdf`);
  };

  const handleExportXLSX = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Evaluations', reportData.totalEvaluations],
      ['Average Score (%)', reportData.averageScore.toFixed(2)],
      ['Weekly Evaluations', reportData.evaluationsByType.weekly],
      ['Monthly Evaluations', reportData.evaluationsByType.monthly],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Category Performance Sheet
    const categoryData = reportData.performanceByCategory.map(c => ({ Category: c.name, 'Average Score (%)': c.score.toFixed(2) }));
    const categoryWs = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categoryWs, "Category Performance");

    XLSX.writeFile(wb, `report-${selectedYear}-${selectedMonth + 1}.xlsx`);
  };

  const generateSingleReport = async (month: number, year: number, allEvals: Evaluation[], allNurses: Nurse[]): Promise<ReportData> => {
    const filteredEvals = allEvals.filter(e => {
      const evalDate = new Date(e.created_at);
      return evalDate.getMonth() === month && evalDate.getFullYear() === year;
    });

    if (filteredEvals.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        evaluationsByType: { weekly: 0, monthly: 0 },
        performanceByCategory: [],
        topPerformers: [],
        needsAttention: [],
      };
    }

    const totalEvaluations = filteredEvals.length;
    const averageScore = filteredEvals.reduce((acc, e) => acc + e.final_score, 0) / totalEvaluations;
    
    const evaluationsByType = filteredEvals.reduce((acc, e) => {
      acc[e.evaluation_type] = (acc[e.evaluation_type] || 0) + 1;
      return acc;
    }, { weekly: 0, monthly: 0 });

    const categoryScores: { [key: string]: { total: number; count: number } } = {};
    filteredEvals.forEach(e => {
      Object.entries(e.scores).forEach(([itemId, score]) => {
        const item = evaluationItems.find(i => i.id === Number(itemId));
        if (item) {
          if (!categoryScores[item.category]) {
            categoryScores[item.category] = { total: 0, count: 0 };
          }
          categoryScores[item.category].total += score;
          categoryScores[item.category].count += 1;
        }
      });
    });

    const performanceByCategory = Object.entries(categoryScores).map(([name, data]) => ({
      name,
      score: (data.total / data.count) * 20,
    }));

    const nurseScores: { [key: string]: { total: number; count: number, nurse: Nurse } } = {};
    filteredEvals.forEach(e => {
      const nurse = allNurses.find(n => n.id === e.nurse_id);
      if (nurse) {
        if (!nurseScores[e.nurse_id]) {
          nurseScores[e.nurse_id] = { total: 0, count: 0, nurse };
        }
        nurseScores[e.nurse_id].total += e.final_score;
        nurseScores[e.nurse_id].count += 1;
      }
    });

    const avgNurseScores = Object.values(nurseScores).map(data => ({
      ...data.nurse,
      avgScore: data.total / data.count,
    })).sort((a, b) => b.avgScore - a.avgScore);

    const outstandingNurses = avgNurseScores.filter(n => n.avgScore >= 95);

    const itemScores: { [key: number]: { total: number; count: number; item: typeof evaluationItems[0] } } = {};
    filteredEvals.forEach(e => {
      Object.entries(e.scores).forEach(([itemId, score]) => {
        const item = evaluationItems.find(i => i.id === Number(itemId));
        if (item) {
          if (!itemScores[item.id]) {
            itemScores[item.id] = { total: 0, count: 0, item };
          }
          itemScores[item.id].total += score;
          itemScores[item.id].count += 1;
        }
      });
    });

    const itemPerformance = Object.values(itemScores).map(data => ({
      id: data.item.id,
      text: data.item.text,
      category: data.item.category,
      avgScore: (data.total / data.count) * 20,
    })).sort((a, b) => a.avgScore - b.avgScore);


    return {
      totalEvaluations,
      averageScore,
      evaluationsByType,
      performanceByCategory,
      topPerformers: avgNurseScores.slice(0, 3),
      needsAttention: avgNurseScores.slice(-3).reverse(),
      itemPerformance,
      outstandingNurses,
    };
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setCompareReportData(null);
    try {
      const [evaluations, nurses] = await Promise.all([
        getAllEvaluations(),
        getAllNurses(),
      ]);

      const mainReport = await generateSingleReport(selectedMonth, selectedYear, evaluations, nurses);
      setReportData(mainReport);

      if (reportType === 'comparison') {
        const comparisonReport = await generateSingleReport(compareMonth, compareYear, evaluations, nurses);
        setCompareReportData(comparisonReport);
      }

    } catch (error) {
      console.error("Failed to generate report", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">التقارير والإحصائيات</h1>
      
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">تقرير شهري</TabsTrigger>
          <TabsTrigger value="comparison">تقرير مقارن</TabsTrigger>
          <TabsTrigger value="items">تقرير البنود</TabsTrigger>
          <TabsTrigger value="outstanding">المتميزون</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء تقرير شهري</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="month-select">الشهر</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year-select">السنة</Label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateReport} disabled={loading}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء تقرير مقارن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-6 items-end">
                {/* Period 1 */}
                <div className="grid gap-2">
                  <Label>الفترة الأولى</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="الشهر" /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 self-end">
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Period 2 */}
                <div className="grid gap-2">
                  <Label>الفترة الثانية</Label>
                  <Select value={String(compareMonth)} onValueChange={(v) => setCompareMonth(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="الشهر" /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 self-end">
                  <Select value={String(compareYear)} onValueChange={(v) => setCompareYear(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerateReport} disabled={loading}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء المقارنة'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الممرضين المتميزين</CardTitle>
              <p className="text-sm text-muted-foreground">
                قائمة بالممرضين الذين حققوا متوسط أداء 95% أو أعلى خلال الفترة المحددة.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="month-select-outstanding">الشهر</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger id="month-select-outstanding"><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year-select-outstanding">السنة</Label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger id="year-select-outstanding"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateReport} disabled={loading}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>تقرير أداء البنود</CardTitle>
              <p className="text-sm text-muted-foreground">
                تحليل أداء بنود التقييم خلال فترة محددة.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="month-select-items">الشهر</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger id="month-select-items"><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year-select-items">السنة</Label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger id="year-select-items"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateReport} disabled={loading}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report display area */}
      <div className="mt-8">
        {loading && <p className="text-center">جاري إنشاء التقرير...</p>}
        
        {reportType === 'monthly' && reportData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                تقرير الأداء الشهري - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  تصدير PDF
                </Button>
                <Button onClick={handleExportXLSX} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  تصدير Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>إجمالي التقييمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{reportData.totalEvaluations}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>متوسط الأداء العام</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{reportData.averageScore.toFixed(2)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>توزيع التقييمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>أسبوعي: {reportData.evaluationsByType.weekly}</p>
                    <p>شهري: {reportData.evaluationsByType.monthly}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-bold mb-4">الأداء حسب المحاور</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.performanceByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#8884d8" name="متوسط الأداء (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>أعلى أداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {reportData.topPerformers.map((nurse: any) => (
                        <li key={nurse.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={nurse.photo_url} />
                              <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{nurse.name}</span>
                          </div>
                          <span className="font-bold">{nurse.avgScore.toFixed(2)}%</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>بحاجة إلى متابعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {reportData.needsAttention.map((nurse: any) => (
                        <li key={nurse.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={nurse.photo_url} />
                              <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{nurse.name}</span>
                          </div>
                          <span className="font-bold">{nurse.avgScore.toFixed(2)}%</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

            </CardContent>
          </Card>
        )}
        {reportData && reportData.totalEvaluations === 0 && !loading && (
          <p className="text-center mt-4">لا توجد بيانات تقييم للفترة المحددة.</p>
        )}

        {reportType === 'comparison' && reportData && compareReportData && (
          <div>
            <h2 className="text-xl font-bold my-6 text-center">
              مقارنة الأداء بين {months.find(m => m.value === selectedMonth)?.label} {selectedYear} و {months.find(m => m.value === compareMonth)?.label} {compareYear}
            </h2>
            {/* Comparison Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle>إجمالي التقييمات</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">
                  <p>{reportData.totalEvaluations} <span className="text-sm font-normal text-muted-foreground">مقابل</span> {compareReportData.totalEvaluations}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>متوسط الأداء</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">
                  <p>{reportData.averageScore.toFixed(2)}% <span className="text-sm font-normal text-muted-foreground">مقابل</span> {compareReportData.averageScore.toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>التقييمات الشهرية</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">
                  <p>{reportData.evaluationsByType.monthly} <span className="text-sm font-normal text-muted-foreground">مقابل</span> {compareReportData.evaluationsByType.monthly}</p>
                </CardContent>
              </Card>
            </div>
            {/* Comparison Chart */}
            <Card className="mt-6">
              <CardHeader><CardTitle>مقارنة الأداء حسب المحاور</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={
                    reportData.performanceByCategory.map(cat => {
                      const compareCat = compareReportData.performanceByCategory.find(c => c.name === cat.name);
                      return {
                        name: cat.name,
                        [months.find(m => m.value === selectedMonth)?.label || '']: cat.score,
                        [months.find(m => m.value === compareMonth)?.label || '']: compareCat ? compareCat.score : 0,
                      }
                    })
                  }>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={months.find(m => m.value === selectedMonth)?.label || ''} fill="#8884d8" />
                    <Bar dataKey={months.find(m => m.value === compareMonth)?.label || ''} fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === 'items' && reportData && reportData.itemPerformance && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>أداء البنود - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-2">نقاط القوة (الأعلى أداءً)</h3>
                <ul className="space-y-2">
                  {reportData.itemPerformance.slice(-5).reverse().map(item => (
                    <li key={item.id} className="p-2 rounded-md border bg-green-50 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{item.text}</span>
                        <span className="font-bold text-green-700">{item.avgScore.toFixed(2)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">فرص التحسين (الأقل أداءً)</h3>
                <ul className="space-y-2">
                  {reportData.itemPerformance.slice(0, 5).map(item => (
                     <li key={item.id} className="p-2 rounded-md border bg-red-50 border-red-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{item.text}</span>
                        <span className="font-bold text-red-700">{item.avgScore.toFixed(2)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === 'outstanding' && reportData && reportData.outstandingNurses && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>قائمة المتميزين - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.outstandingNurses.length > 0 ? (
                <ul className="space-y-3">
                  {reportData.outstandingNurses.map((nurse) => (
                    <li key={nurse.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={nurse.photo_url} />
                          <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{nurse.name}</p>
                          <p className="text-sm text-muted-foreground">متوسط الأداء</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {nurse.avgScore.toFixed(2)}%
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">لا يوجد ممرضون متميزون في هذه الفترة.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
