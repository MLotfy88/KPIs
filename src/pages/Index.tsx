import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'supervisor') {
        navigate('/supervisor/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التحميل...</p>
    </div>
  );
};

export default Index;
