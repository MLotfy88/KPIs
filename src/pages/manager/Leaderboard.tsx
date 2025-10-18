import { useEffect, useState } from 'react';
import { getMonthlyLeaderboard, LeaderboardEntry } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/Icon';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ScoreChange = ({ value, change }: { value: number | null, change: number | null }) => {
  if (value === null) return <TableCell className="text-center">-</TableCell>;

  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;
  const color = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-gray-500';

  return (
    <TableCell className={twMerge("text-center font-semibold", color)}>
      <div className="flex items-center justify-center gap-1">
        {isUp && <ArrowUp size={16} />}
        {isDown && <ArrowDown size={16} />}
        {!isUp && !isDown && change !== null && <Minus size={16} />}
        {value.toFixed(2)}
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
    const doc = new jsPDF();

    // Load the font
    try {
      const font = await fetch('/Tajawal Regular.ttf').then(res => res.arrayBuffer());
      const fontBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(font)));
      doc.addFileToVFS('Tajawal-Regular.ttf', fontBase64);
      doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
      doc.setFont('Tajawal');
    } catch (error) {
      console.error("Could not load font for PDF, using default.", error);
    }

    const head = [['الإجمالي الشهري', 'الأسبوع 4', 'الأسبوع 3', 'الأسبوع 2', 'الأسبوع 1', 'الممرض', 'الترتيب']];
    const body = leaderboard.map((entry, index) => {
      const formatScore = (score: number | null, change: number | null) => {
        if (score === null) return '-';
        const arrow = change === null ? '' : change > 0 ? '↑' : '↓';
        return `${score.toFixed(2)} ${arrow}`;
      };

      const nurseCell = `${entry.nurse_name}\n${entry.badges.map(b => `${b.name} (${b.tier})`).join(', ')}`;

      return [
        formatScore(entry.monthly_score, entry.monthly_change),
        formatScore(entry.week4_score, entry.week4_change),
        formatScore(entry.week3_score, entry.week3_change),
        formatScore(entry.week2_score, entry.week2_change),
        formatScore(entry.week1_score, entry.week1_change),
        nurseCell,
        index + 1,
      ];
    });

    autoTable(doc, {
      head: head,
      body: body,
      styles: { font: 'Tajawal', halign: 'right' },
      headStyles: { fontStyle: 'bold', fillColor: [41, 128, 185] },
      didDrawPage: (data) => {
        doc.setFont('Tajawal', 'bold');
        doc.setFontSize(20);
        const text = 'لوحة الدرجات الشهرية';
        const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
        const textX = (doc.internal.pageSize.getWidth() - textWidth) / 2;
        doc.text(text, textX, 15);
      },
    });

    doc.save('leaderboard.pdf');
  };

  if (isLoading) return <div>Loading leaderboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>لوحة الدرجات الشهرية</CardTitle>
              <CardDescription>لوحة عرض نتائج تقييم أداء التمريض خلال الشهر الحالي.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              تصدير PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table id="leaderboard-table">
            <TableHeader>
              <TableRow>
                <TableHead>الترتيب</TableHead>
                <TableHead>الممرض</TableHead>
                <TableHead className="text-center">الأسبوع 1</TableHead>
                <TableHead className="text-center">الأسبوع 2</TableHead>
                <TableHead className="text-center">الأسبوع 3</TableHead>
                <TableHead className="text-center">الأسبوع 4</TableHead>
                <TableHead className="text-center">الإجمالي الشهري</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow key={entry.nurse_id} className={entry.badges.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                  <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={entry.nurse_photo_url} alt={entry.nurse_name} />
                        <AvatarFallback>{entry.nurse_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{entry.nurse_name}</p>
                        <div className="flex gap-1 mt-1">
                          {entry.badges.map((badge, i) => (
                            <Icon key={i} name={badge.icon} tier={badge.tier as any} title={`${badge.name} (${badge.tier})`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <ScoreChange value={entry.week1_score} change={entry.week1_change} />
                  <ScoreChange value={entry.week2_score} change={entry.week2_change} />
                  <ScoreChange value={entry.week3_score} change={entry.week3_change} />
                  <ScoreChange value={entry.week4_score} change={entry.week4_change} />
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <ScoreChange value={entry.monthly_score} change={entry.monthly_change} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
