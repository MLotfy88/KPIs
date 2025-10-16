import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { Notification } from '@/types';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    navigate(notification.link);
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        fetchNotifications(); // Refresh notifications
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.id);
      fetchNotifications();
      toast({
        title: 'نجاح',
        description: 'تم تحديد جميع الإشعارات كمقروءة.',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحديد جميع الإشعارات كمقروءة.',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>الإشعارات</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllAsRead();
              }}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>لا توجد إشعارات</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 p-3 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
              <div className="flex flex-col">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
