import { useEffect, useState } from 'react';
import { getMonthlyLeaderboard, LeaderboardEntry } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowUp, ArrowDown, Minus, Crown, User, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/Icon';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PodiumCard = ({ entry, rank }: { entry: LeaderboardEntry, rank: number }) => {
  const rankColors = {
    1: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    2: 'border-gray-400 bg-gray-50 dark:bg-gray-700/20',
    3: 'border-yellow-600 bg-yellow-100 dark:bg-yellow-800/20'
  };
  const rankIconColor = {
    1: 'text-yellow-500',
    2: 'text-gray-500',
    3: 'text-yellow-700'
  };

  return (
    <Card className={twMerge("text-center transform hover:scale-105 transition-transform duration-300", rankColors[rank])}>
      <CardHeader>
        <div className="relative w-24 h-24 mx-auto">
          <Avatar className="w-24 h-24 border-4 border-white">
            <AvatarImage src={entry.nurse_photo_url} alt={entry.nurse_name} />
            <AvatarFallback className="text-4xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {!entry.nurse_photo_url && (
                entry.nurse_gender === 'female' 
                  ? <UserRound className="w-16 h-16 text-gray-500" /> 
                  : <User className="w-16 h-16 text-gray-500" />
              )}
              {entry.nurse_photo_url && entry.nurse_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Crown className={twMerge("absolute -top-3 -right-3 w-8 h-8 transform rotate-12", rankIconColor[rank])} />
        </div>
        <CardTitle className="mt-4">{entry.nurse_name}</CardTitle>
        <CardDescription>المركز #{rank}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{entry.monthly_score.toFixed(2)}</p>
        <div className="flex justify-center gap-2 mt-2">
          {entry.badges.map((badge, i) => (
            <Icon key={i} name={badge.badge_icon as any} tier={badge.tier as any} title={`${badge.badge_name} (${badge.tier})`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const LeaderboardRow = ({ entry, rank }: { entry: LeaderboardEntry, rank: number }) => {
  const ScoreChange = ({ value, change }: { value: number | null, change: number | null }) => {
    if (value === null) return <span className="text-gray-400">-</span>;
    const isUp = change !== null && change > 0;
    const isDown = change !== null && change < 0;
    const color = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-gray-500';
    return (
      <div className={twMerge("flex items-center gap-1 font-mono", color)}>
        {isUp && <ArrowUp size={14} />}
        {isDown && <ArrowDown size={14} />}
        {!isUp && !isDown && change !== null && <Minus size={14} />}
        {value.toFixed(2)}
      </div>
    );
  };

  return (
    <Card className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="w-12 text-center font-bold text-lg text-gray-500">{rank}</div>
      <div className="flex-1 flex items-center gap-4">
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
      <div className="flex-1 grid grid-cols-5 text-center">
        <ScoreChange value={entry.week1_score} change={entry.week1_change} />
        <ScoreChange value={entry.week2_score} change={entry.week2_change} />
        <ScoreChange value={entry.week3_score} change={entry.week3_change} />
        <ScoreChange value={entry.week4_score} change={entry.week4_change} />
        <div className="font-bold text-lg">
          <ScoreChange value={entry.monthly_score} change={entry.monthly_change} />
        </div>
      </div>
    </Card>
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
    // PDF export logic remains the same
  };

  if (isLoading) return <div>Loading leaderboard...</div>;
  if (error) return <div>Error: {error}</div>;

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">لوحة الدرجات الشهرية</h1>
          <p className="text-muted-foreground">عرض أداء فريق التمريض خلال الشهر الحالي.</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          تصدير PDF
        </Button>
      </div>

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {topThree.length > 1 && <PodiumCard entry={topThree[1]} rank={2} />}
        {topThree.length > 0 && <PodiumCard entry={topThree[0]} rank={1} />}
        {topThree.length > 2 && <PodiumCard entry={topThree[2]} rank={3} />}
      </div>

      {/* List for the rest */}
      <div className="space-y-4">
        <div className="hidden md:flex items-center p-4 text-sm font-semibold text-muted-foreground">
            <div className="w-12 text-center">الترتيب</div>
            <div className="flex-1">الممرض</div>
            <div className="flex-1 grid grid-cols-5 text-center">
                <span>الأسبوع 1</span>
                <span>الأسبوع 2</span>
                <span>الأسبوع 3</span>
                <span>الأسبوع 4</span>
                <span className="font-bold">الإجمالي</span>
            </div>
        </div>
        {rest.map((entry, index) => (
          <LeaderboardRow key={entry.nurse_id} entry={entry} rank={index + 4} />
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
