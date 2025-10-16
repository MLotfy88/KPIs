import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// مكون لحماية الصفحات التي تتطلب تسجيل الدخول
export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // يمكن عرض شاشة تحميل هنا
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// مكون للتحكم في الوصول بناءً على دور المستخدم
interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
}

export const RoleBasedRoute = ({ allowedRoles }: RoleBasedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // يمكن إعادة التوجيه إلى صفحة "غير مصرح به" أو "404"
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};
