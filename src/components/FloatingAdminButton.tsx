import { useNavigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FloatingAdminButton = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  const handleClick = () => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (isAdmin) {
      navigate('/admin');
    } else {
      toast.error('ไม่มีสิทธิ์เข้าหน้านี้', {
        description: 'คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Dashboard',
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
        'bg-gradient-to-br from-primary to-accent',
        'hover:from-primary/90 hover:to-accent/90',
        'glow-primary transition-all duration-300',
        'hover:scale-110'
      )}
      title={user ? (isAdmin ? 'Admin Dashboard' : 'ไม่มีสิทธิ์') : 'เข้าสู่ระบบ'}
    >
      {user ? (
        <Shield className="w-6 h-6 text-white" />
      ) : (
        <LogIn className="w-6 h-6 text-white" />
      )}
    </Button>
  );
};

export default FloatingAdminButton;
