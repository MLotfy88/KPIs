import { useState, useEffect, useMemo } from 'react';
import KPICard from '@/components/manager/KPICard';
import PerformanceChart from '@/components/manager/PerformanceChart';
import CategoryCharts from '@/components/manager/CategoryCharts';
import TopPerformers from '@/components/manager/TopPerformers';
import NeedsAttention from '@/components/manager/NeedsAttention';
import { BarChart, Users, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { getAllEvaluations, getAllNurses } from '@/lib/api';
import { Evaluation, Nurse } from '@/types';

const ManagerDashboard = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [evals, allNurses] = await Promise.all([
          getAllEvaluations(),
          getAllNurses(),
        ]);
        setEvaluations(evals);
        setNurses(allNurses);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- KPI Calculations ---
  const averageScore = evaluations.length > 0
    ? evaluations.reduce((acc, curr) => acc + curr.final_score, 0) / evaluations.length
    : 0;

  const totalEvaluations = evaluations.length;
  const activeNursesCount = nurses.length;

  const nursePerformance = useMemo(() => {
    const performanceData = nurses.map(nurse => {
      const nurseEvals = evaluations.filter(e => e.nurse_id === nurse.id);
      const average = nurseEvals.length > 0
        ? nurseEvals.reduce((acc, curr) => acc + curr.final_score, 0) / nurseEvals.length
        : 0;
      return { ...nurse, average_score: average };
    });

    return performanceData.sort((a, b) => b.average_score - a.average_score);
  }, [nurses, evaluations]);

  const topPerformer = nursePerformance.length > 0 ? nursePerformance[0] : null;


  const kpis = [
    {
      title: 'متوسط أداء الوحدة',
      value: `${averageScore.toFixed(1)}%`,
      icon: BarChart,
      description: 'متوسط جميع التقييمات',
    },
    {
      title: 'التقييمات المكتملة',
      value: totalEvaluations.toString(),
      icon: Activity,
      description: 'إجمالي التقييمات المسجلة',
    },
    {
      title: 'الممرضين النشطين',
      value: activeNursesCount.toString(),
      icon: Users,
      description: 'عدد الممرضين في الخدمة',
    },
    {
      title: 'أعلى أداء',
      value: topPerformer ? `${topPerformer.average_score.toFixed(1)}%` : 'N/A',
      icon: TrendingUp,
      description: topPerformer ? `للممرض/ة: ${topPerformer.name}` : 'لا توجد بيانات',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full page-container space-y-6">
      <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.description}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart evaluations={evaluations} />
          <CategoryCharts evaluations={evaluations} />
        </div>
        <div className="space-y-6">
          <TopPerformers topPerformers={nursePerformance.slice(0, 3)} />
          <NeedsAttention needsAttention={nursePerformance.slice(-3).reverse()} />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
