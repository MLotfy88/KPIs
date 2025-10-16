import React, { useState, useEffect, useMemo } from 'react';
import { getAllAudits, getAllEvaluations, getAllNurses, getAllUsers } from '@/lib/api';
import { Audit, Evaluation, Nurse, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Percent, CheckCircle, FileText } from 'lucide-react';
import PerformAuditDialog from '@/components/manager/PerformAuditDialog';

// Helper type to combine data
type CombinedAudit = Audit & {
  evaluation?: Evaluation;
  nurse?: Nurse;
  supervisor?: User;
  auditor?: User;
};

const AuditsPage: React.FC = () => {
  const [audits, setAudits] = useState<CombinedAudit[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ auditorId: 'all', decision: 'all' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [auditsData, evalsData, nursesData, usersData] = await Promise.all([
        getAllAudits(),
        getAllEvaluations(),
          getAllNurses(),
        getAllUsers()
      ]);

      setUsers(usersData);
      setAllEvaluations(evalsData);

      const combinedData: CombinedAudit[] = auditsData.map(audit => {
          const evaluation = evalsData.find(e => e.id === audit.evaluation_id);
          const nurse = evaluation ? nursesData.find(n => n.id === evaluation.nurse_id) : undefined;
          const supervisor = evaluation ? usersData.find(u => u.id === evaluation.supervisor_id) : undefined;
          const auditor = usersData.find(u => u.id === audit.auditor_id);
          return { ...audit, evaluation, nurse, supervisor, auditor };
        });

        setAudits(combinedData);
      } catch (error) {
        console.error("Failed to fetch audits data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      const auditorMatch = filters.auditorId === 'all' || audit.auditor_id === filters.auditorId;
      const decisionMatch = filters.decision === 'all' || audit.decision === filters.decision;
      return auditorMatch && decisionMatch;
    });
  }, [audits, filters]);

  const stats = useMemo(() => {
    const total = filteredAudits.length;
    const matched = filteredAudits.filter(a => a.is_match).length;
    const matchRate = total > 0 ? (matched / total) * 100 : 0;
    return { total, matchRate };
  }, [filteredAudits]);

  const handleFilterChange = (filterName: 'auditorId' | 'decision') => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const getDecisionBadge = (decision: 'accepted' | 'modified' | 'rejected') => {
    switch (decision) {
      case 'accepted': return <Badge variant="success">مقبول</Badge>;
      case 'modified': return <Badge variant="warning">معدل</Badge>;
      case 'rejected': return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge>{decision}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المراجعات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة التطابق</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>سجل المراجعات العشوائية</CardTitle>
          <PerformAuditDialog 
            evaluations={allEvaluations} 
            audits={audits}
            onAuditSuccess={fetchData} 
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 rtl:space-x-reverse py-4">
            <Select onValueChange={handleFilterChange('auditorId')} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فلترة بالمدقق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المدققين</SelectItem>
                {users.filter(u => u.role === 'manager').map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleFilterChange('decision')} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فلترة بالقرار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل القرارات</SelectItem>
                <SelectItem value="accepted">مقبول</SelectItem>
                <SelectItem value="modified">معدل</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>تاريخ المراجعة</TableHead>
                <TableHead>الممرض</TableHead>
                <TableHead>المشرف</TableHead>
                <TableHead>المدقق</TableHead>
                <TableHead>نتيجة المراجعة</TableHead>
                <TableHead>القرار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>{new Date(audit.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>{audit.nurse?.name || 'غير معروف'}</TableCell>
                  <TableCell>{audit.supervisor?.name || 'غير معروف'}</TableCell>
                  <TableCell>{audit.auditor?.name || 'غير معروف'}</TableCell>
                  <TableCell>
                    {audit.is_match ? (
                      <Badge variant="success">متطابق</Badge>
                    ) : (
                      <Badge variant="destructive">غير متطابق</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getDecisionBadge(audit.decision)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditsPage;
