import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, LogOut, Loader2, Star, TrendingUp, ListChecks } from 'lucide-react';
import { getSupervisorEvaluations } from '@/lib/api';
import { format, isThisMonth, getMonth, getYear } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Evaluation } from '@/types';

const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const recentEvaluations = useMemo(() => {
    return allEvaluations.slice(0, 5);
  }, [allEvaluations]);

  const stats = useMemo(() => {
    const monthlyEvalsThisMonth = allEvaluations.filter(e =>
      e.evaluation_type === 'monthly' && isThisMonth(new Date(e.created_at))
    );

    const weeklyEvalsThisMonth = allEvaluations.filter(e =>
      e.evaluation_type === 'weekly' && isThisMonth(new Date(e.created_at))
    );

    const totalEvaluationsThisMonth = monthlyEvalsThisMonth.length + weeklyEvalsThisMonth.length;

    const avgMonthlyScore = monthlyEvalsThisMonth.length > 0
      ? monthlyEvalsThisMonth.reduce((acc, curr) => acc + curr.final_score, 0) / monthlyEvalsThisMonth.length
      : 0;

    return {
      totalEvaluationsThisMonth,
      avgMonthlyScore,
      totalAllTime: allEvaluations.length,
    };
  }, [allEvaluations]);


  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const data = await getSupervisorEvaluations(user.id);
        const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAllEvaluations(sortedData);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl">مرحباً {user?.name}</CardTitle>
              <CardDescription>جاهز لبدء تقييم جديد؟</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/supervisor/evaluate', { state: { evaluationType: 'weekly' } })}
                size="lg"
                className="h-16 text-lg"
                variant="outline"
              >
                <Plus className="ml-2 h-5 w-5" />
                تقييم أسبوعي جديد
              </Button>
              <Button
                onClick={() => navigate('/supervisor/evaluate', { state: { evaluationType: 'monthly' } })}
                size="lg"
                className="h-16 text-lg"
              >
                <Plus className="ml-2 h-5 w-5" />
                تقييم شهري جديد
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تقييمات هذا الشهر</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvaluationsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                إجمالي التقييمات في شهر {format(new Date(), 'MMMM', { locale: ar })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط التقييم الشهري</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMonthlyScore.toFixed(1)}%</div>
               <p className="text-xs text-muted-foreground">
                متوسط الأداء للتقييمات الشهرية
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التقييمات</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAllTime}</div>
              <p className="text-xs text-muted-foreground">
                منذ بداية استخدامك للنظام
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              آخر التقييمات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentEvaluations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                لم تقم بأي تقييمات بعد
              </p>
            ) : (
              <div className="space-y-3">
                {recentEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {evaluation.nurse_name || 'ممرض غير معروف'}
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
      </div>
    </div>
  );
};

export default SupervisorDashboard;
