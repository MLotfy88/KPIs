import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Evaluation } from '@/types';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, getMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PerformanceChartProps {
  evaluations: Evaluation[];
}

const PerformanceChart = ({ evaluations }: PerformanceChartProps) => {
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    
    const monthlyAverages = last6Months.map(monthDate => {
      const month = getMonth(monthDate);
      const year = monthDate.getFullYear();
      
      const monthEvaluations = evaluations.filter(e => {
        const evalDate = new Date(e.created_at);
        return getMonth(evalDate) === month && evalDate.getFullYear() === year;
      });
      
      const average = monthEvaluations.length > 0
        ? monthEvaluations.reduce((acc, curr) => acc + curr.final_score, 0) / monthEvaluations.length
        : 0;
        
      return {
        name: format(monthDate, 'MMM', { locale: ar }),
        'متوسط الأداء': parseFloat(average.toFixed(1)),
      };
    });
    
    return monthlyAverages;
  }, [evaluations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>تطور الأداء (آخر 6 أشهر)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => `${value}%`}
              labelStyle={{ fontWeight: 'bold' }}
              itemStyle={{ color: '#8884d8' }}
            />
            <Legend />
            <Line type="monotone" dataKey="متوسط الأداء" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
