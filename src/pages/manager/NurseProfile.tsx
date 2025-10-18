import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getNurseById, 
  getEvaluationsByNurseId, 
  getBadgesForNurse, 
  getBadges,
  getImprovementPlansForNurse,
  createImprovementPlan,
  updateImprovementPlan,
  getAllUsers,
  getAllEvaluations
} from '@/lib/api';
import { Nurse, Evaluation, NurseBadge, Badge as BadgeType, ImprovementPlan, User as UserType } from '@/types';
import { evaluationItems } from '@/lib/evaluationItems';
import { checkForSmartAlerts } from '@/lib/smart-alerts';
import { analyzePerformanceStrengthsAndWeaknesses, PerformanceAnalysis as PerformanceAnalysisType } from '@/lib/analysis';
import { useAuth } from '@/contexts/AuthContext';
import PerformanceAnalysis from '@/components/manager/PerformanceAnalysis';
import { IDPList } from '@/components/manager/idp/IDPList';
import { IDPFormDialog } from '@/components/manager/idp/IDPFormDialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2, User, Star, Calendar, Award, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NurseProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [allUnitEvaluations, setAllUnitEvaluations] = useState<Evaluation[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [awardedBadges, setAwardedBadges] = useState<NurseBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<string[]>([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysisType | null>(null);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlan[]>([]);
  const [isIdpDialogOpen, setIsIdpDialogOpen] = useState(false);
  const [selectedIdp, setSelectedIdp] = useState<ImprovementPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPlans = async (nurseId: string) => {
    try {
      const plans = await getImprovementPlansForNurse(nurseId);
      setImprovementPlans(plans);
    } catch (error) {
      console.error("Failed to fetch improvement plans:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب خطط التحسين.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [nurseData, evalsData, awardedBadgesData, allBadgesData, plansData, usersData, allEvalsData] = await Promise.all([
          getNurseById(id),
          getEvaluationsByNurseId(id),
          getBadgesForNurse(id),
          getBadges(),
          getImprovementPlansForNurse(id),
          getAllUsers(),
          getAllEvaluations(),
        ]);
        setNurse(nurseData);
        setEvaluations(evalsData);
        setAllUnitEvaluations(allEvalsData);
        setUsers(usersData);
        setAwardedBadges(awardedBadgesData);
        setAllBadges(allBadgesData);
        setImprovementPlans(plansData);
        if (nurseData && evalsData.length > 0) {
          const alerts = await checkForSmartAlerts(nurseData);
          setSmartAlerts(alerts);
          const analysis = analyzePerformanceStrengthsAndWeaknesses(evalsData);
          setPerformanceAnalysis(analysis);
        }
      } catch (error) {
        console.error("Failed to fetch nurse profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const averageScore = useMemo(() => {
    return evaluations.length > 0
      ? evaluations.reduce((acc, curr) => acc + curr.final_score, 0) / evaluations.length
      : 0;
  }, [evaluations]);


  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return "ممتاز";
    if (score >= 80) return "جيد جدًا";
    if (score >= 70) return "جيد";
    if (score >= 60) return "مقبول";
    return "ضعيف";
  };

  const handleOpenAddIdpDialog = () => {
    setSelectedIdp(null);
    setIsIdpDialogOpen(true);
  };

  const handleOpenEditIdpDialog = (plan: ImprovementPlan) => {
    setSelectedIdp(plan);
    setIsIdpDialogOpen(true);
  };

  const handleCloseIdpDialog = () => {
    setIsIdpDialogOpen(false);
    setSelectedIdp(null);
  };

  const handleSaveIdp = async (data: any) => {
    if (!id || !user) return;

    try {
      if (selectedIdp) {
        // Update existing plan
        await updateImprovementPlan(selectedIdp.id, { ...selectedIdp, ...data });
        toast({ title: "نجاح", description: "تم تحديث خطة التحسين بنجاح." });
      } else {
        // Create new plan
        const newPlanData = {
          ...data,
          nurse_id: id,
          manager_id: user.id,
          status: 'active' as const,
          progress_updates: [],
        };
        await createImprovementPlan(newPlanData);
        toast({ title: "نجاح", description: "تم إنشاء خطة التحسين بنجاح." });
      }
      fetchPlans(id); // Refresh the list
    } catch (error) {
      console.error("Failed to save improvement plan:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ خطة التحسين.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!nurse) {
    return <div className="text-center text-red-500">لم يتم العثور على الممرض.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
          <Avatar className="h-24 w-24">
            <AvatarImage src={nurse.photo_url} alt={nurse.name} />
            <AvatarFallback>{nurse.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-right">
            <CardTitle className="text-3xl">{nurse.name}</CardTitle>
            <p className={nurse.is_active ? "text-green-500" : "text-red-500"}>
              {nurse.is_active ? "نشط" : "غير نشط"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Star className="text-yellow-400" />
            <div>
              <p className="font-bold text-lg">{averageScore.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">متوسط الأداء العام</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <User className="text-blue-400" />
            <div>
              <p className="font-bold text-lg">{getPerformanceGrade(averageScore)}</p>
              <p className="text-sm text-muted-foreground">التقدير</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Calendar className="text-gray-400" />
            <div>
              <p className="font-bold text-lg">
                {new Date(nurse.created_at).toLocaleDateString('ar-EG')}
                <span className="text-xs text-muted-foreground font-normal">
                  {' '}({formatDistanceToNow(new Date(nurse.created_at), { addSuffix: true, locale: ar })})
                </span>
              </p>
              <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
            </div>
          </div>
           <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Award className="text-purple-400" />
            <div>
              <p className="font-bold text-lg">{awardedBadges.length}</p>
              <p className="text-sm text-muted-foreground">الشارات المكتسبة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {smartAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيهات ذكية</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pr-5">
              {smartAlerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analysis">تحليل الأداء</TabsTrigger>
          <TabsTrigger value="evaluations">سجل التقييمات</TabsTrigger>
          <TabsTrigger value="idp">خطط التحسين</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-4">
          {performanceAnalysis && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center text-green-600">
                  <TrendingUp className="mr-2" />
                  <CardTitle className="text-green-600">أبرز نقاط القوة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc pr-5">
                    {performanceAnalysis.strengths.map(item => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center text-red-600">
                  <TrendingDown className="mr-2" />
                  <CardTitle className="text-red-600">فرص التحسين</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc pr-5">
                    {performanceAnalysis.weaknesses.map(item => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>الشارات المكتسبة</CardTitle>
            </CardHeader>
            <CardContent>
              {awardedBadges.length > 0 ? (
                <TooltipProvider>
                  <div className="flex flex-wrap gap-4">
                    {awardedBadges.map(nurseBadge => {
                      const badgeInfo = allBadges.find(b => b.id === nurseBadge.badge_id);
                      if (!badgeInfo) return null;
                      return (
                        <Tooltip key={nurseBadge.id}>
                          <TooltipTrigger>
                            <Badge variant="outline" className={`capitalize border-2 ${
                              nurseBadge.tier === 'gold' ? 'border-yellow-500' :
                              nurseBadge.tier === 'silver' ? 'border-gray-400' :
                              nurseBadge.tier === 'bronze' ? 'border-yellow-700' :
                              'border-gray-200'
                            }`}>
                              {badgeInfo.name} ({nurseBadge.tier})
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{badgeInfo.description}</p>
                            <p className="text-xs text-muted-foreground">
                              مُنحت في: {new Date(nurseBadge.awarded_at).toLocaleDateString('ar-EG')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              ) : (
                <p className="text-muted-foreground">لم يتم اكتساب أي شارات بعد.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <PerformanceAnalysis evaluations={evaluations} allUnitEvaluations={allUnitEvaluations} />
        </TabsContent>

        <TabsContent value="evaluations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التقييمات</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاريخ التقييم</TableHead>
                    <TableHead>نوع التقييم</TableHead>
                    <TableHead>الدرجة النهائية</TableHead>
                    <TableHead>المشرف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => {
                    const supervisor = users.find(u => u.id === evaluation.supervisor_id);
                    return (
                      <TableRow key={evaluation.id}>
                        <TableCell>{new Date(evaluation.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{evaluation.evaluation_type === 'weekly' ? 'أسبوعي' : 'شهري'}</TableCell>
                        <TableCell>{evaluation.final_score.toFixed(1)}%</TableCell>
                        <TableCell>{supervisor?.name || evaluation.supervisor_id}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idp" className="mt-4">
          <IDPList 
            plans={improvementPlans} 
            onAddPlan={handleOpenAddIdpDialog}
            onEditPlan={handleOpenEditIdpDialog}
          />
        </TabsContent>
      </Tabs>

      <IDPFormDialog
        isOpen={isIdpDialogOpen}
        onClose={handleCloseIdpDialog}
        onSave={handleSaveIdp}
        plan={selectedIdp}
      />
    </div>
  );
};

export default NurseProfilePage;
