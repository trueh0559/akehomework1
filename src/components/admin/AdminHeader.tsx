import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Home, Settings, FileText, Heart, MessageSquare, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-40">
      <div className="container py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Feeldi</h1>
            <p className="text-xs text-muted-foreground">
              สวัสดี, {user?.displayName || user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/chats')}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/coupons')}
            className="gap-2"
          >
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">คูปอง</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/surveys')}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">แบบสำรวจ</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/settings')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">ตั้งค่า</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">หน้าแรก</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออก</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
