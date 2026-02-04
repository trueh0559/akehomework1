import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Mail, AlertTriangle, CheckCircle, Loader2, Send, Settings, Sun, Moon, Image, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeuralBackground from '@/components/ui/NeuralBackground';
import AdminHeader from '@/components/admin/AdminHeader';
import type { AdminSettings as AdminSettingsType, AdminNotification } from '@/types/survey';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  
  const [settings, setSettings] = useState<AdminSettingsType | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<AdminNotification[]>([]);
  const [bgUrl, setBgUrl] = useState(theme.background_value || '');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isAdmin) {
        navigate('/');
        return;
      }
      fetchSettings();
      fetchRecentErrors();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } else {
      setSettings(data as AdminSettingsType);
    }
    setLoading(false);
  };

  const fetchRecentErrors = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('type', 'system_error')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setErrors(data as AdminNotification[]);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from('admin_settings')
      .update({
        low_score_threshold: settings.low_score_threshold,
        admin_emails: settings.admin_emails,
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('บันทึกไม่สำเร็จ');
    } else {
      toast.success('บันทึกการตั้งค่าเรียบร้อย');
    }
    setSaving(false);
  };

  const addEmail = () => {
    if (!newEmail || !settings) return;
    if (!newEmail.includes('@')) {
      toast.error('กรุณาใส่อีเมลที่ถูกต้อง');
      return;
    }
    if (settings.admin_emails.includes(newEmail)) {
      toast.error('อีเมลนี้มีอยู่แล้ว');
      return;
    }
    setSettings({
      ...settings,
      admin_emails: [...settings.admin_emails, newEmail],
    });
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      admin_emails: settings.admin_emails.filter((e) => e !== email),
    });
  };

  const sendTestEmail = async () => {
    if (!settings?.admin_emails.length) {
      toast.error('กรุณาเพิ่มอีเมลแอดมินก่อน');
      return;
    }
    
    setTestingEmail(true);
    try {
      const response = await supabase.functions.invoke('send-test-email', {
        body: { to_email: settings.admin_emails[0] },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('ส่งอีเมลทดสอบสำเร็จ! ตรวจสอบ inbox ของคุณ');
    } catch (error: any) {
      console.error('Test email error:', error);
      toast.error(`ส่งอีเมลไม่สำเร็จ: ${error.message}`);
    } finally {
      setTestingEmail(false);
      fetchRecentErrors();
    }
  };

  const handleBgUrlSave = () => {
    setTheme({ background_value: bgUrl || null });
    toast.success('บันทึกพื้นหลังเรียบร้อย');
  };

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen">
        <NeuralBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      <div className="relative z-10">
        <AdminHeader />

        <main className="container py-6 px-4 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไป Dashboard
          </Button>

          <div className="space-y-6">
            {/* Theme Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  ธีมและพื้นหลัง
                </CardTitle>
                <CardDescription>
                  ปรับแต่งรูปแบบการแสดงผลของแอพ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Light/Dark Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme.mode === 'dark' ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                    <div>
                      <Label>โหมด {theme.mode === 'dark' ? 'มืด' : 'สว่าง'}</Label>
                      <p className="text-xs text-muted-foreground">
                        เปลี่ยนธีมสีของแอพ
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme.mode === 'dark'}
                    onCheckedChange={(checked) => setTheme({ mode: checked ? 'dark' : 'light' })}
                  />
                </div>

                {/* Motion Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>แอนิเมชัน</Label>
                    <p className="text-xs text-muted-foreground">
                      เปิด/ปิดเอฟเฟกต์เคลื่อนไหว
                    </p>
                  </div>
                  <Switch
                    checked={theme.enable_motion}
                    onCheckedChange={(checked) => setTheme({ enable_motion: checked })}
                  />
                </div>

                {/* Background Type */}
                <div className="space-y-3">
                  <Label>ประเภทพื้นหลัง</Label>
                  <RadioGroup
                    value={theme.background_type}
                    onValueChange={(v) => setTheme({ background_type: v as any })}
                    className="grid grid-cols-3 gap-3"
                  >
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${theme.background_type === 'solid' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="solid" className="sr-only" />
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-background to-card" />
                      <span className="text-sm">สีพื้น</span>
                    </label>
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${theme.background_type === 'image' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="image" className="sr-only" />
                      <Image className="w-8 h-8" />
                      <span className="text-sm">รูปภาพ</span>
                    </label>
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${theme.background_type === 'video' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="video" className="sr-only" />
                      <Video className="w-8 h-8" />
                      <span className="text-sm">วิดีโอ</span>
                    </label>
                  </RadioGroup>
                </div>

                {/* Background URL */}
                {theme.background_type !== 'solid' && (
                  <div className="space-y-2">
                    <Label>
                      URL {theme.background_type === 'image' ? 'รูปภาพ' : 'วิดีโอ'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={bgUrl}
                        onChange={(e) => setBgUrl(e.target.value)}
                        placeholder={`https://example.com/background.${theme.background_type === 'image' ? 'jpg' : 'mp4'}`}
                      />
                      <Button onClick={handleBgUrlSave} size="sm">
                        บันทึก
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {theme.background_type === 'video' && 'วิดีโอจะเล่นแบบ muted และ loop อัตโนมัติ'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  อีเมลแอดมิน
                </CardTitle>
                <CardDescription>
                  อีเมลที่จะได้รับการแจ้งเตือนเมื่อมีคะแนนต่ำ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <Button onClick={addEmail} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {settings?.admin_emails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 py-1 px-3">
                      {email}
                      <button onClick={() => removeEmail(email)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {settings?.admin_emails.length === 0 && (
                    <p className="text-sm text-muted-foreground">ยังไม่มีอีเมล</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={sendTestEmail}
                  disabled={testingEmail || !settings?.admin_emails.length}
                  className="gap-2"
                >
                  {testingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  ส่งอีเมลทดสอบ
                </Button>
              </CardContent>
            </Card>

            {/* Threshold Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  เกณฑ์คะแนนต่ำ
                </CardTitle>
                <CardDescription>
                  คะแนนที่ต่ำกว่าเกณฑ์นี้จะถูกแจ้งเตือน (ตรวจสอบรายข้อ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Threshold</Label>
                    <span className="text-2xl font-bold text-primary">
                      {settings?.low_score_threshold ?? 3}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={0.5}
                    value={[settings?.low_score_threshold ?? 3]}
                    onValueChange={([value]) =>
                      setSettings(settings ? { ...settings, low_score_threshold: value } : null)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    ถ้าคำถามใดได้คะแนน &lt; {settings?.low_score_threshold ?? 3} จะส่งการแจ้งเตือน
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={saveSettings} disabled={saving} className="w-full gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              บันทึกการตั้งค่า
            </Button>

            {/* Recent Errors */}
            {errors.length > 0 && (
              <Card className="glass-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    ข้อผิดพลาดล่าสุด
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {errors.map((error) => (
                      <div key={error.id} className="p-3 rounded-lg bg-destructive/10 text-sm">
                        <p className="font-medium">{error.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{error.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(error.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
