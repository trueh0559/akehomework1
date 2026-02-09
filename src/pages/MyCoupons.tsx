import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Gift, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NeuralBackground from '@/components/ui/NeuralBackground';
import CouponCard from '@/components/coupons/CouponCard';
import { toast } from 'sonner';

interface CouponWithCampaign {
  id: string;
  code: string;
  status: string;
  created_at: string;
  used_at: string | null;
  campaign_id: string;
  campaign_name: string;
  campaign_description: string | null;
  discount_type: string;
  discount_value: number;
  expire_at: string | null;
}

const MyCoupons = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [coupons, setCoupons] = useState<CouponWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
      return;
    }
    if (session) {
      linkPendingResponse();
      fetchCoupons();
    }
  }, [session, authLoading]);

  const linkPendingResponse = async () => {
    const responseId = localStorage.getItem('pending_survey_response_id');
    if (!responseId || !user) return;

    localStorage.removeItem('pending_survey_response_id');

    try {
      // Link response to user
      await supabase
        .from('survey_responses')
        .update({ user_id: user.id } as any)
        .eq('id', responseId);

      // Find active campaign and generate coupon
      await generateCoupon(responseId);
    } catch (err) {
      console.error('Error linking response:', err);
    }
  };

  const generateCoupon = async (responseId: string) => {
    if (!user) return;

    // Get active campaigns
    const { data: campaigns } = await supabase
      .from('coupon_campaigns')
      .select('*')
      .eq('is_active', true);

    if (!campaigns || campaigns.length === 0) return;

    const campaign = campaigns[0]; // Use first active campaign

    // Check max_uses
    if (campaign.max_uses && (campaign as any).used_count >= campaign.max_uses) return;

    // Check expiry
    if (campaign.expire_at && new Date(campaign.expire_at) < new Date()) return;

    // Generate unique code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `${campaign.code_prefix || 'FEEL-'}${randomPart}`;

    // Check if user already has a coupon for this campaign
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('user_id', user.id);

    if (existing && existing.length > 0) return; // Already has coupon

    const { error } = await supabase
      .from('coupons')
      .insert({
        campaign_id: campaign.id,
        user_id: user.id,
        code,
        status: 'active',
        response_id: responseId,
      } as any);

    if (error) {
      console.error('Error generating coupon:', error);
    } else {
      toast.success('🎉 คุณได้รับ E-Coupon แล้ว!');
      fetchCoupons();
    }
  };

  const fetchCoupons = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('coupons')
      .select(`
        id, code, status, created_at, used_at, campaign_id,
        coupon_campaigns (name, description, discount_type, discount_value, expire_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped: CouponWithCampaign[] = data.map((c: any) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        created_at: c.created_at,
        used_at: c.used_at,
        campaign_id: c.campaign_id,
        campaign_name: c.coupon_campaigns?.name || 'คูปอง',
        campaign_description: c.coupon_campaigns?.description,
        discount_type: c.coupon_campaigns?.discount_type || 'gift',
        discount_value: c.coupon_campaigns?.discount_value || 0,
        expire_at: c.coupon_campaigns?.expire_at,
      }));
      setCoupons(mapped);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const usedCoupons = coupons.filter(c => c.status === 'used');
  const expiredCoupons = coupons.filter(c => c.status === 'expired');

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />
      <div className="relative z-10 container py-8 px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">คูปองของฉัน</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            ออก
          </Button>
        </div>

        {/* Coupon Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1 gap-1">
              <Gift className="w-4 h-4" /> ใช้ได้ ({activeCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex-1">ใช้แล้ว ({usedCoupons.length})</TabsTrigger>
            <TabsTrigger value="expired" className="flex-1">หมดอายุ ({expiredCoupons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeCoupons.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">ยังไม่มีคูปองที่ใช้ได้</p>
                </CardContent>
              </Card>
            ) : (
              activeCoupons.map(c => (
                <CouponCard
                  key={c.id}
                  code={c.code}
                  status="active"
                  campaignName={c.campaign_name}
                  discountType={c.discount_type}
                  discountValue={c.discount_value}
                  description={c.campaign_description || undefined}
                  createdAt={c.created_at}
                  expireAt={c.expire_at}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="used" className="space-y-3">
            {usedCoupons.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent><p className="text-muted-foreground">ยังไม่มีคูปองที่ใช้แล้ว</p></CardContent>
              </Card>
            ) : (
              usedCoupons.map(c => (
                <CouponCard key={c.id} code={c.code} status="used" campaignName={c.campaign_name}
                  discountType={c.discount_type} discountValue={c.discount_value}
                  createdAt={c.created_at} usedAt={c.used_at} expireAt={c.expire_at} />
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-3">
            {expiredCoupons.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent><p className="text-muted-foreground">ไม่มีคูปองหมดอายุ</p></CardContent>
              </Card>
            ) : (
              expiredCoupons.map(c => (
                <CouponCard key={c.id} code={c.code} status="expired" campaignName={c.campaign_name}
                  discountType={c.discount_type} discountValue={c.discount_value}
                  createdAt={c.created_at} expireAt={c.expire_at} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyCoupons;
