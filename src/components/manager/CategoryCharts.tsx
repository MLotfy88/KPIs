import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Evaluation, EvaluationItem } from '@/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { weeklyItems, monthlyItems } from '@/lib/evaluationItems';

interface CategoryChartsProps {
  evaluations: Evaluation[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const CategoryCharts = ({ evaluations }: CategoryChartsProps) => {
  const allItems: EvaluationItem[] = [...weeklyItems, ...monthlyItems];

  const categoryData = useMemo(() => {
    const categories = ['technical', 'behavioral', 'care', 'initiative'];
    const categoryScores: Record<string, { total: number; count: number }> = {
      technical: { total: 0, count: 0 },
      behavioral: { total: 0, count: 0 },
      care: { total: 0, count: 0 },
      initiative: { total: 0, count: 0 },
    };

    evaluations.forEach(evaluation => {
      for (const itemId in evaluation.scores) {
        const item = allItems.find(i => i.id.toString() === itemId);
        if (item) {
          categoryScores[item.category].total += evaluation.scores[itemId];
          categoryScores[item.category].count += 1;
        }
      }
    });

    return categories.map(cat => ({
      name: cat,
      'متوسط الدرجة': categoryScores[cat].count > 0 ? parseFloat((categoryScores[cat].total / categoryScores[cat].count).toFixed(1)) : 0,
    }));
  }, [evaluations, allItems]);

  const gradeDistribution = useMemo(() => {
    const grades = { 'ممتاز (90+)': 0, 'جيد جدا (80-89)': 0, 'جيد (70-79)': 0, 'مقبول (60-69)': 0, 'ضعيف (<60)': 0 };
    evaluations.forEach(e => {
      if (e.final_score >= 90) grades['ممتاز (90+)']++;
      else if (e.final_score >= 80) grades['جيد جدا (80-89)']++;
      else if (e.final_score >= 70) grades['جيد (70-79)']++;
      else if (e.final_score >= 60) grades['مقبول (60-69)']++;
      else grades['ضعيف (<60)']++;
    });
    return Object.entries(grades).map(([name, value]) => ({ name, value }));
  }, [evaluations]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>متوسط الأداء حسب المحور</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="متوسط الدرجة" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>توزيع التقديرات</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryCharts;
