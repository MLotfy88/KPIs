import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Activity } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'supervisor') {
        navigate('/supervisor/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في منصة أداء. جاري توجيهك...',
      });
      // The useEffect will handle the navigation
    } else {
      toast({
        title: 'فشل تسجيل الدخول',
        description: result.error || 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  if (isAuthLoading || user) {
    // Show a loading indicator or a blank screen while checking auth state or redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">منصة تقييم الاداء</CardTitle>
          <CardDescription className="text-base">
            نظام تقييم وتطوير تمريض وحدة القسطرة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@adaa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1 mt-4 bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">حسابات تجريبية:</p>
              <p>مدير: manager@adaa.com</p>
              <p>مشرف: supervisor@adaa.com</p>
              <p className="text-xs mt-2">استخدم كلمة المرور التي تم تعيينها لك.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
