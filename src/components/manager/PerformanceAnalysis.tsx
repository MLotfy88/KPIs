import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Evaluation } from "@/types";
import { evaluationItems } from "@/lib/evaluationItems";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceAnalysisProps {
  evaluations: Evaluation[];
  allUnitEvaluations: Evaluation[]; 
}

const PerformanceAnalysis = ({ evaluations, allUnitEvaluations }: PerformanceAnalysisProps) => {
  const { combinedCategoryAverages, performanceHistory } = useMemo(() => {
    if (evaluations.length === 0) {
      return { combinedCategoryAverages: [], performanceHistory: [] };
    }

    const categoryScores: { [key: string]: { total: number; count: number } } = {};
    evaluationItems.forEach(item => {
      if (!categoryScores[item.category]) {
        categoryScores[item.category] = { total: 0, count: 0 };
      }
    });

    evaluations.forEach(evaluation => {
      Object.entries(evaluation.scores).forEach(([itemId, score]) => {
        const item = evaluationItems.find(i => i.id.toString() === itemId);
        if (item && categoryScores[item.category]) {
          categoryScores[item.category].total += score;
          categoryScores[item.category].count += 1;
        }
      });
    });

    const calculatedCategoryAverages = Object.entries(categoryScores).map(([name, data]) => ({
      name,
      score: data.count > 0 ? (data.total / data.count) * 20 : 0, // Convert 1-5 scale to 0-100
    }));

    const calculatedPerformanceHistory = evaluations
      .map(e => ({
        date: new Date(e.created_at).getTime(), // Use timestamp for sorting
        formattedDate: new Date(e.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        score: e.final_score,
      }))
      .sort((a, b) => a.date - b.date);

    // Calculate unit averages
    const unitCategoryScores: { [key: string]: { total: number; count: number } } = {};
    evaluationItems.forEach(item => {
      if (!unitCategoryScores[item.category]) {
        unitCategoryScores[item.category] = { total: 0, count: 0 };
      }
    });

    allUnitEvaluations.forEach(evaluation => {
      Object.entries(evaluation.scores).forEach(([itemId, score]) => {
        const item = evaluationItems.find(i => i.id.toString() === itemId);
        if (item && unitCategoryScores[item.category]) {
          unitCategoryScores[item.category].total += score;
          unitCategoryScores[item.category].count += 1;
        }
      });
    });

    const unitCategoryAverages = Object.entries(unitCategoryScores).map(([name, data]) => ({
      name,
      unitScore: data.count > 0 ? (data.total / data.count) * 20 : 0,
    }));

    // Combine nurse and unit averages
    const combinedData = calculatedCategoryAverages.map(nurseAvg => {
      const unitAvg = unitCategoryAverages.find(u => u.name === nurseAvg.name);
      return {
        ...nurseAvg,
        unitScore: unitAvg ? unitAvg.unitScore : 0,
      };
    });

    return { combinedCategoryAverages: combinedData, performanceHistory: calculatedPerformanceHistory };
  }, [evaluations, allUnitEvaluations]);

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تحليل الأداء</CardTitle>
        </CardHeader>
        <CardContent>
          <p>لا توجد بيانات تقييم كافية لعرض التحليل.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تحليل الأداء</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">مقارنة أداء الممرض بمتوسط الوحدة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={combinedCategoryAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8884d8" name="أداء الممرض" />
              <Bar dataKey="unitScore" fill="#82ca9d" name="متوسط الوحدة" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">تطور الأداء عبر الزمن</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#82ca9d" name="الدرجة النهائية" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceAnalysis;
