import { useEffect, useState } from 'react';
import { getMonthlyLeaderboard, LeaderboardEntry } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ArrowUp, ArrowDown, Minus, User, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/Icon';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A dedicated component for rendering scores with stock-market style
const StockTickerCell = ({ value, change, isMonthly = false }: { value: number | null, change: number | null, isMonthly?: boolean }) => {
  if (value === null) return <TableCell className="text-center text-gray-500 font-mono">-</TableCell>;

  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;
  
  // Change: Gray color is now green for neutral/initial scores
  const color = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-green-500';
  const bgColor = isUp ? 'bg-green-500/10' : isDown ? 'bg-red-500/10' : 'bg-green-500/10';
  const size = isMonthly ? 'text-xl' : 'text-base';

  return (
    <TableCell className={twMerge("text-center font-mono transition-colors duration-300", bgColor)}>
      <div className={twMerge("flex items-center justify-center gap-2 p-2 rounded-md", color, size)}>
        {isUp && <ArrowUp size={16} />}
        {isDown && <ArrowDown size={16} />}
        {/* Show green arrow for initial scores as well */}
        {!isUp && !isDown && <ArrowUp size={16} className="opacity-70" />}
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

  const handleExportPDF = async () => {
    const input = document.getElementById('leaderboard-table');
    if (!input) {
      console.error("Leaderboard table element not found!");
      return;
    }

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, logging: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('leaderboard.pdf');

    } catch (e) {
      console.error("Failed to generate PDF from HTML:", e);
      setError("فشل في تصدير PDF. يرجى المحاولة مرة أخرى.");
    }
  };

  if (isLoading) return <div className="text-center p-10">جاري تحميل لوحة الدرجات...</div>;
  if (error) return <div className="text-center p-10 text-red-500">خطأ: {error}</div>;

  return (
    <div className="w-full page-container" dir="rtl">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="text-right">
          <h1 className="text-3xl font-bold">لوحة التقييم الشهرية</h1>
          <p className="text-muted-foreground mt-1">مؤشرات الأداء لفريق التمريض مقارنة بالشهر السابق.</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF} className="mt-4 sm:mt-0">
          <Download className="ml-2 h-4 w-4" />
          تصدير PDF
        </Button>
      </header>
      
      <div id="leaderboard-table" className="leaderboard-container border rounded-lg">
        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-16 text-center px-4 py-3">الترتيب</TableHead>
              <TableHead className="min-w-[250px] text-right px-4 py-3">الممرض</TableHead>
              <TableHead className="text-center px-4 py-3">الأسبوع 1</TableHead>
              <TableHead className="text-center px-4 py-3">الأسبوع 2</TableHead>
              <TableHead className="text-center px-4 py-3">الأسبوع 3</TableHead>
              <TableHead className="text-center px-4 py-3">الأسبوع 4</TableHead>
              <TableHead className="text-center font-bold px-4 py-3">الإجمالي الشهري</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.map((entry, index) => (
              <TableRow key={entry.nurse_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="text-center font-bold text-lg text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4 p-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.nurse_photo_url} alt={entry.nurse_name} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {!entry.nurse_photo_url && (
                          entry.nurse_gender === 'female' 
                            ? <UserRound className="w-6 h-6 text-gray-500" /> 
                            : <User className="w-6 h-6 text-gray-500" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-semibold text-base">{entry.nurse_name}</p>
                      <div className="flex gap-1.5 mt-1.5">
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
