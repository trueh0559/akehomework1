import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Gift, Ticket, CheckCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Campaign form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('gift');
  const [formValue, setFormValue] = useState('0');
  const [formPrefix, setFormPrefix] = useState('FEEL-');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formExpireAt, setFormExpireAt] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin');
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, authLoading]);

  const fetchData = async () => {
    const [campaignsRes, couponsRes] = await Promise.all([
      supabase.from('coupon_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('coupons').select(`
        *, coupon_campaigns (name, code_prefix),
        profiles:user_id (display_name)
      `).order('created_at', { ascending: false }).limit(100),
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (couponsRes.data) setCoupons(couponsRes.data);
    setLoading(false);
  };

  const handleCreateCampaign = async () => {
    if (!formName.trim()) {
      toast.error('กรุณากรอกชื่อแคมเปญ');
      return;
    }

    const { error } = await supabase.from('coupon_campaigns').insert({
      name: formName,
      description: formDesc || null,
      discount_type: formType,
      discount_value: parseFloat(formValue) || 0,
      code_prefix: formPrefix || 'FEEL-',
      max_uses: formMaxUses ? parseInt(formMaxUses) : null,
      expire_at: formExpireAt || null,
      is_active: formActive,
    } as any);

    if (error) {
      toast.error('สร้างแคมเปญไม่สำเร็จ: ' + error.message);
    } else {
      toast.success('สร้างแคมเปญสำเร็จ!');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormType('gift');
    setFormValue('0'); setFormPrefix('FEEL-'); setFormMaxUses('');
    setFormExpireAt(''); setFormActive(true);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('กรุณากรอกรหัสคูปอง');
      return;
    }
    setRedeemLoading(true);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', redeemCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      toast.error('ไม่พบรหัสคูปองนี้');
      setRedeemLoading(false);
      return;
    }

    if ((data as any).status === 'used') {
      toast.error('คูปองนี้ถูกใช้แล้ว');
      setRedeemLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ status: 'used', used_at: new Date().toISOString() } as any)
      .eq('id', data.id);

    if (updateError) {
      toast.error('ไม่สามารถใช้คูปองได้');
    } else {
      toast.success(`✅ ใช้คูปอง ${redeemCode} สำเร็จ!`);
      setRedeemCode('');
      fetchData();
    }
    setRedeemLoading(false);
  };

  const toggleCampaignActive = async (id: string, currentActive: boolean) => {
    await supabase.from('coupon_campaigns').update({ is_active: !currentActive } as any).eq('id', id);
    fetchData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCoupons = coupons.length;
  const usedCoupons = coupons.filter((c: any) => c.status === 'used').length;
  const activeCoupons = coupons.filter((c: any) => c.status === 'active').length;
  const useRate = totalCoupons > 0 ? ((usedCoupons / totalCoupons) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container py-6 px-4 space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" /> จัดการคูปอง
        </h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalCoupons}</p>
              <p className="text-xs text-muted-foreground">คูปองทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{activeCoupons}</p>
              <p className="text-xs text-muted-foreground">ยังใช้ได้</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{usedCoupons}</p>
              <p className="text-xs text-muted-foreground">ใช้แล้ว</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{useRate}%</p>
              <p className="text-xs text-muted-foreground">อัตราการใช้</p>
            </CardContent>
          </Card>
        </div>

        {/* Redeem Section */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" /> ใช้คูปอง</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="กรอกรหัสคูปอง เช่น FEEL-K8M2X4"
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button onClick={handleRedeem} disabled={redeemLoading} className="gap-2 shrink-0">
                {redeemLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                ใช้คูปอง
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">แคมเปญคูปอง</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> สร้างแคมเปญ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>สร้างแคมเปญคูปอง</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ชื่อแคมเปญ *</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="เช่น แคมเปญต้อนรับ" />
                </div>
                <div>
                  <Label>รายละเอียด</Label>
                  <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="รายละเอียดแคมเปญ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ประเภทส่วนลด</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">เปอร์เซ็นต์</SelectItem>
                        <SelectItem value="fixed">จำนวนเงิน</SelectItem>
                        <SelectItem value="gift">ของแถม/ของแจก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>มูลค่า</Label>
                    <Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prefix รหัส</Label>
                    <Input value={formPrefix} onChange={e => setFormPrefix(e.target.value)} placeholder="FEEL-" />
                  </div>
                  <div>
                    <Label>จำนวนสูงสุด</Label>
                    <Input type="number" value={formMaxUses} onChange={e => setFormMaxUses(e.target.value)} placeholder="ไม่จำกัด" />
                  </div>
                </div>
                <div>
                  <Label>วันหมดอายุ</Label>
                  <Input type="datetime-local" value={formExpireAt} onChange={e => setFormExpireAt(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>เปิดใช้งาน</Label>
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                </div>
                <Button onClick={handleCreateCampaign} className="w-full">สร้างแคมเปญ</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {campaigns.length > 0 && (
          <div className="grid gap-3">
            {campaigns.map((c: any) => (
              <Card key={c.id} className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{c.name}</h4>
                      <Badge variant={c.is_active ? 'default' : 'secondary'}>
                        {c.is_active ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.discount_type === 'percentage' ? `ส่วนลด ${c.discount_value}%` :
                       c.discount_type === 'fixed' ? `ส่วนลด ฿${c.discount_value}` : 'ของแถม/ของแจก'}
                      {' · '} Prefix: {c.code_prefix}
                      {c.max_uses ? ` · สูงสุด ${c.max_uses} ใบ` : ''}
                      {' · '} ใช้แล้ว {c.used_count} ใบ
                    </p>
                  </div>
                  <Switch checked={c.is_active} onCheckedChange={() => toggleCampaignActive(c.id, c.is_active)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Coupons Table */}
        <h3 className="text-lg font-semibold">คูปองทั้งหมด</h3>
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>แคมเปญ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้รับ</TableHead>
                  <TableHead>วันที่ออก</TableHead>
                  <TableHead>วันที่ใช้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      ยังไม่มีคูปอง
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold">{c.code}</TableCell>
                      <TableCell>{(c.coupon_campaigns as any)?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'active' ? 'default' : c.status === 'used' ? 'secondary' : 'destructive'}>
                          {c.status === 'active' ? 'ใช้ได้' : c.status === 'used' ? 'ใช้แล้ว' : 'หมดอายุ'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(c.profiles as any)?.display_name || '-'}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>{c.used_at ? new Date(c.used_at).toLocaleDateString('th-TH') : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCoupons;
