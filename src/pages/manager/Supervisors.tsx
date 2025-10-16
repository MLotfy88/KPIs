import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllUsers, getAllEvaluations, getAllAudits } from '@/lib/api';
import { User, Evaluation, Audit } from '@/types';
import { PlusCircle } from 'lucide-react';
import AddSupervisorDialog from '@/components/manager/AddSupervisorDialog';
import EditSupervisorDialog from '@/components/manager/EditSupervisorDialog';

const SupervisorsPage: React.FC = () => {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [users, evals, auditsData] = await Promise.all([
        getAllUsers(),
        getAllEvaluations(),
        getAllAudits(),
      ]);
      const supervisorUsers = users.filter(user => user.role === 'supervisor');
      setSupervisors(supervisorUsers);
      setEvaluations(evals);
      setAudits(auditsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const supervisorStats = useMemo(() => {
    return supervisors.map(supervisor => {
      const supervisorEvals = evaluations.filter(e => e.supervisor_id === supervisor.id);
      const auditedEvals = supervisorEvals.filter(e => audits.some(a => a.evaluation_id === e.id));
      const matchedAudits = auditedEvals.filter(e => audits.find(a => a.evaluation_id === e.id)?.is_match);

      const avgScore = supervisorEvals.length > 0
        ? supervisorEvals.reduce((acc, curr) => acc + curr.final_score, 0) / supervisorEvals.length
        : 0;
      
      const matchRate = auditedEvals.length > 0
        ? (matchedAudits.length / auditedEvals.length) * 100
        : 0;

      return {
        supervisorId: supervisor.id,
        avgScore,
        matchRate,
        totalEvals: supervisorEvals.length,
        totalAudits: auditedEvals.length,
      };
    });
  }, [supervisors, evaluations, audits]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المشرفين</h1>
        <AddSupervisorDialog onSupervisorAdded={fetchData}>
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة مشرف جديد
          </Button>
        </AddSupervisorDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المشرفين</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>جاري تحميل البيانات...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشرف</TableHead>
                  <TableHead>إجمالي التقييمات</TableHead>
                  <TableHead>متوسط الدرجات</TableHead>
                  <TableHead>معدل التطابق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map((supervisor) => (
                  <TableRow key={supervisor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={supervisor.photo_url} alt={supervisor.name} />
                          <AvatarFallback>{supervisor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{supervisor.name}</p>
                          <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supervisorStats.find(s => s.supervisorId === supervisor.id)?.totalEvals || 0}
                    </TableCell>
                    <TableCell>
                      {supervisorStats.find(s => s.supervisorId === supervisor.id)?.avgScore.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span dir="ltr">
                        {supervisorStats.find(s => s.supervisorId === supervisor.id)?.matchRate.toFixed(2) || 'N/A'}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supervisor.is_active ? "default" : "destructive"}>
                        {supervisor.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <EditSupervisorDialog supervisor={supervisor} onSupervisorUpdated={fetchData}>
                        <Button variant="outline" size="sm">
                          تعديل
                        </Button>
                      </EditSupervisorDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorsPage;
