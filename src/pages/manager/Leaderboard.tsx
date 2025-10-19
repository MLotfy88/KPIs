import { useEffect, useState } from 'react';
import { getMonthlyLeaderboard, LeaderboardEntry } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ArrowUp, ArrowDown, Minus, User, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/Icon';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// A dedicated component for rendering scores with stock-market style
const StockTickerCell = ({ value, change, isMonthly = false }: { value: number | null, change: number | null, isMonthly?: boolean }) => {
  if (value === null) return <TableCell className="text-center text-gray-500 font-mono">-</TableCell>;

  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;
  
  const color = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-gray-400';
  const bgColor = isUp ? 'bg-green-500/10' : isDown ? 'bg-red-500/10' : 'bg-transparent';
  const size = isMonthly ? 'text-xl' : 'text-base';

  return (
    <TableCell className={twMerge("text-center font-mono transition-colors duration-300", bgColor)}>
      <div className={twMerge("flex items-center justify-center gap-2 p-2 rounded-md", color, size)}>
        {isUp && <ArrowUp size={16} />}
        {isDown && <ArrowDown size={16} />}
        {!isUp && !isDown && change !== null && <Minus size={16} />}
        <span>{value.toFixed(2)}</span>
      </div>
    </TableCell>
  );
};

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await getMonthlyLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        setError('Failed to fetch leaderboard.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleExportPDF = async () => { /* PDF export logic can be reused */ };

  if (isLoading) return <div className="text-center p-10">جاري تحميل لوحة الدرجات...</div>;
  if (error) return <div className="text-center p-10 text-red-500">خطأ: {error}</div>;

  return (
    // This container is now full-width, not inside a Card
    <div className="w-full">
      <header className="flex justify-between items-center mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold">لوحة البورصة الشهرية</h1>
          <p className="text-muted-foreground">مؤشرات الأداء لفريق التمريض مقارنة بالشهر السابق.</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          تصدير PDF
        </Button>
      </header>
      
      <div className="border rounded-lg overflow-hidden">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-16 text-center">الترتيب</TableHead>
              <TableHead className="min-w-[250px]">الممرض</TableHead>
              <TableHead className="text-center">الأسبوع 1</TableHead>
              <TableHead className="text-center">الأسبوع 2</TableHead>
              <TableHead className="text-center">الأسبوع 3</TableHead>
              <TableHead className="text-center">الأسبوع 4</TableHead>
              <TableHead className="text-center font-bold">الإجمالي الشهري</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry, index) => (
              <TableRow key={entry.nurse_id} className="dark:hover:bg-gray-700/50">
                <TableCell className="text-center font-bold text-lg text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={entry.nurse_photo_url} alt={entry.nurse_name} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {!entry.nurse_photo_url && (
                          entry.nurse_gender === 'female' 
                            ? <UserRound className="w-5 h-5 text-gray-500" /> 
                            : <User className="w-5 h-5 text-gray-500" />
                        )}
                        {entry.nurse_photo_url && entry.nurse_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{entry.nurse_name}</p>
                      <div className="flex gap-1 mt-1">
                        {entry.badges.map((badge, i) => (
                          <Icon key={i} name={badge.badge_icon as any} tier={badge.tier as any} title={`${badge.badge_name} (${badge.tier})`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <StockTickerCell value={entry.week1_score} change={entry.week1_change} />
                <StockTickerCell value={entry.week2_score} change={entry.week2_change} />
                <StockTickerCell value={entry.week3_score} change={entry.week3_change} />
                <StockTickerCell value={entry.week4_score} change={entry.week4_change} />
                <StockTickerCell value={entry.monthly_score} change={entry.monthly_change} isMonthly={true} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
