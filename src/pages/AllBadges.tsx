import React, { useState, useEffect } from 'react';
import { getBadges } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

const tierOrder = ['platinum', 'gold', 'silver', 'bronze'];

const tierDisplay: Record<string, { name: string; color: string }> = {
  platinum: { name: 'بلاتيني', color: 'text-slate-400' },
  gold: { name: 'ذهبي', color: 'text-yellow-500' },
  silver: { name: 'فضي', color: 'text-gray-400' },
  bronze: { name: 'برونزي', color: 'text-yellow-700' },
};

const getHighestTierClass = (thresholds: Record<string, any>): string => {
  const tiers = Object.keys(thresholds);
  if (tiers.includes('platinum')) return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border-slate-500';
  if (tiers.includes('gold')) return 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800 border-amber-500';
  return 'bg-card';
};

const AllBadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const data = await getBadges();
        setBadges(data);
      } catch (err) {
        setError('فشل في تحميل الشارات.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">مكتبة الشارات</h1>
        <p className="text-muted-foreground">
          اكتشف جميع الشارات التي يمكنك الحصول عليها وكيفية تحقيقها.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const sortedTiers = Object.entries(badge.thresholds).sort(
              ([a], [b]) => tierOrder.indexOf(a) - tierOrder.indexOf(b)
            );

            return (
              <Card key={badge.badge_id} className={cn("flex flex-col text-center p-6 transition-transform hover:scale-105", getHighestTierClass(badge.thresholds))}>
                <div className="flex-grow flex flex-col items-center">
                  <Icon name={badge.badge_icon || 'Award'} className="w-24 h-24 mb-4 opacity-80" />
                  <h2 className="text-xl font-bold mb-2">{badge.badge_name}</h2>
                  <p className="text-sm opacity-90 mb-4 flex-grow">{badge.description}</p>
                  
                  <div className="w-full text-right mt-auto">
                    <h4 className="font-semibold mb-2">المستويات والمعايير</h4>
                    <p className="text-xs opacity-80 mb-2">
                      النوع: {badge.criteria_type} | الفترة: {badge.period_type}
                    </p>
                    <ul className="space-y-2 text-xs">
                      {sortedTiers.map(([tier, value]) => (
                        <li key={tier} className="flex justify-between items-center p-2 rounded-md bg-white/80 dark:bg-black/50 text-slate-800 dark:text-slate-200">
                          <span className={cn("font-bold", tierDisplay[tier]?.color || 'text-foreground')}>
                            {tierDisplay[tier]?.name || tier}
                          </span>
                          <span className="font-mono text-sm">{`يتطلب متوسط ${value} أو أعلى`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllBadgesPage;
