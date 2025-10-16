import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getBadges, addBadge, updateBadge, deleteBadge } from '@/lib/api';
import { Badge } from '@/types';
import BadgeFormDialog from '@/components/manager/BadgeFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);


  const fetchBadges = async () => {
    try {
      setLoading(true);
      const data = await getBadges();
      setBadges(data);
    } catch (err) {
      setError('Failed to fetch badges.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleOpenForm = (badge: Badge | null) => {
    setSelectedBadge(badge);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedBadge(null);
    setIsFormOpen(false);
  };

  const handleSaveBadge = async (badgeData: Omit<Badge, 'id'>) => {
    try {
      if (selectedBadge) {
        await updateBadge(selectedBadge.id, badgeData);
      } else {
        await addBadge(badgeData);
      }
      fetchBadges(); // Refresh the list
    } catch (error) {
      console.error("Failed to save badge", error);
      // You might want to show a toast notification here
    }
  };

  const handleDeleteConfirmation = (badgeId: string) => {
    setBadgeToDelete(badgeId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBadge = async () => {
    if (badgeToDelete) {
      try {
        await deleteBadge(badgeToDelete);
        fetchBadges(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete badge", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setBadgeToDelete(null);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة الشارات</h1>
        <Button onClick={() => handleOpenForm(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          إضافة شارة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشارات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>جاري تحميل الشارات...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <Card key={badge.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {/* Placeholder for Icon */}
                      <span>{badge.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground h-10">{badge.description}</p>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">المستويات</h4>
                      <ul className="space-y-1 text-xs">
                        {badge.tiers.map(tier => (
                          <li key={tier.name} className="flex justify-between p-1 rounded bg-gray-100 dark:bg-gray-700">
                            <span className="capitalize">{tier.name}</span>
                            <span className="font-mono">{`>= ${tier.criteria.value}%`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                     <Button variant="outline" size="sm" onClick={() => handleOpenForm(badge)}>
                       <Edit className="mr-2 h-4 w-4" /> تعديل
                     </Button>
                     <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(badge.id)}>
                       <Trash2 className="mr-2 h-4 w-4" /> حذف
                     </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BadgeFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveBadge}
        badge={selectedBadge}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الشارة نهائيًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBadge}>متابعة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BadgesPage;
