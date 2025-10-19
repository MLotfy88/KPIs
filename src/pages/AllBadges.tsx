import React, { useState, useEffect } from 'react';
import { getBadges } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Award } from 'lucide-react';

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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">مكتبة الشارات</h1>
      <p className="text-center text-muted-foreground mb-8">
        اكتشف جميع الشارات التي يمكنك الحصول عليها وكيفية تحقيقها.
      </p>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.badge_id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-primary" />
                  <span>{badge.badge_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                <div>
                  <h4 className="font-semibold mb-2">المستويات والمعايير</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    النوع: {badge.criteria_type} | الفترة: {badge.period_type}
                  </p>
                  <ul className="space-y-2 text-xs">
                    {Object.entries(badge.thresholds).map(([tier, value]) => (
                      <li key={tier} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                        <span className={`capitalize font-semibold ${
                          tier === 'gold' ? 'text-yellow-500' :
                          tier === 'silver' ? 'text-gray-400' :
                          tier === 'bronze' ? 'text-yellow-700' :
                          'text-gray-500'
                        }`}>{tier}</span>
                        <span className="font-mono text-right">{`يتطلب متوسط ${value} أو أعلى`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBadgesPage;
