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
    const doc = new jsPDF({
      orientation: 'landscape',
    });

    try {
      // Fetch the font from the public folder
      const fontResponse = await fetch('/Tajawal Regular.ttf');
      const fontBlob = await fontResponse.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Font = (reader.result as string).split(',')[1];
        
        doc.addFileToVFS('Tajawal-Regular.ttf', base64Font);
        doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
        doc.setFont('Tajawal');

        generatePdfContent(doc);
      };

      reader.readAsDataURL(fontBlob);

    } catch (e) {
      console.error("Failed to fetch or process font. PDF will use standard fonts.", e);
      // Generate PDF with default fonts if fetching fails
      generatePdfContent(doc);
    }
  };

  const generatePdfContent = (doc: jsPDF) => {
    const head = [[
      { content: 'الإجمالي الشهري', styles: { halign: 'center' } },
      { content: 'الأسبوع 4', styles: { halign: 'center' } },
      { content: 'الأسبوع 3', styles: { halign: 'center' } },
      { content: 'الأسبوع 2', styles: { halign: 'center' } },
      { content: 'الأسبوع 1', styles: { halign: 'center' } },
      { content: 'الممرض', styles: { halign: 'right' } },
      { content: 'الترتيب', styles: { halign: 'center' } },
    ]];

    const body = leaderboard.map((entry, index) => [
      { content: entry.monthly_score?.toFixed(2) || '-', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: entry.week4_score?.toFixed(2) || '-', styles: { halign: 'center' } },
      { content: entry.week3_score?.toFixed(2) || '-', styles: { halign: 'center' } },
      { content: entry.week2_score?.toFixed(2) || '-', styles: { halign: 'center' } },
      { content: entry.week1_score?.toFixed(2) || '-', styles: { halign: 'center' } },
      { content: entry.nurse_name, styles: { halign: 'right' } },
      { content: index + 1, styles: { halign: 'center', fontStyle: 'bold' } },
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      styles: {
        font: 'Tajawal',
        cellPadding: 3,
        fontSize: 10,
      },
      headStyles: {
        fillColor: [22, 163, 74], // green-600
        textColor: 255,
        fontStyle: 'bold',
      },
      didParseCell: function (data) {
        // Reverse column order for RTL display
        if (data.row.section === 'body' || data.row.section === 'head') {
            data.row.cells = Object.values(data.row.cells).reverse();
        }
      },
      // Color rows and text based on performance change
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const entry = leaderboard[data.row.index];
          const changes = [entry.monthly_change, entry.week4_change, entry.week3_change, entry.week2_change, entry.week1_change];
          // The order is reversed in the PDF, so we need to access the change correctly
          const reversedIndex = (changes.length - 1) - data.column.index;
          const change = changes[reversedIndex];

          if (change !== null && change !== undefined) {
            if (change > 0) {
              doc.setTextColor(34, 197, 94); // green-500
            } else if (change < 0) {
              doc.setTextColor(239, 68, 68); // red-500
            } else {
              doc.setTextColor(34, 197, 94); // green-500 for neutral
            }
          }
        }
      },
    });

    doc.save('leaderboard.pdf');
  }

  if (isLoading) return <div className="text-center p-10">جاري تحميل لوحة الدرجات...</div>;
  if (error) return <div className="text-center p-10 text-red-500">خطأ: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8" dir="rtl">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="text-right">
          <h1 className="text-3xl font-bold">لوحة البورصة الشهرية</h1>
          <p className="text-muted-foreground mt-1">مؤشرات الأداء لفريق التمريض مقارنة بالشهر السابق.</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF} className="mt-4 sm:mt-0">
          <Download className="ml-2 h-4 w-4" />
          تصدير PDF
        </Button>
      </header>
      
      <div className="border rounded-lg overflow-x-auto">
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
