import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] send-test-email invoked`);

  try {
    const { to_email } = await req.json();

    if (!to_email) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing to_email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Survey <noreply@resend.dev>";

    if (!resendApiKey) {
      console.error(`[${requestId}] RESEND_API_KEY not configured`);
      
      // Log error to notifications
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("admin_notifications").insert({
        type: "system_error",
        title: "❌ ทดสอบอีเมลไม่สำเร็จ",
        message: "RESEND_API_KEY ยังไม่ได้ตั้งค่า กรุณาเพิ่ม API Key ในการตั้งค่า",
        severity: "critical",
        payload: { error: "RESEND_API_KEY not configured" },
      });

      return new Response(
        JSON.stringify({ success: false, message: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${requestId}] Sending test email to: ${to_email}`);

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; }
          .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
          .footer { background: #1e293b; color: #94a3b8; padding: 16px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0">✅ ทดสอบอีเมลสำเร็จ!</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2 style="margin:0;color:#16a34a">🎉 ระบบอีเมลทำงานปกติ</h2>
              <p style="margin:8px 0 0 0;color:#64748b">
                คุณจะได้รับการแจ้งเตือนเมื่อมีคะแนนต่ำ
              </p>
            </div>
            <h3>📋 รายละเอียดการตั้งค่า</h3>
            <ul>
              <li><strong>Sender:</strong> ${emailFrom}</li>
              <li><strong>Recipient:</strong> ${to_email}</li>
              <li><strong>Timestamp:</strong> ${new Date().toLocaleString('th-TH')}</li>
            </ul>
            <p style="color:#64748b;font-size:14px">
              หากคุณได้รับอีเมลนี้ แสดงว่าระบบแจ้งเตือนพร้อมใช้งานแล้ว
            </p>
          </div>
          <div class="footer">
            <p>ระบบแจ้งเตือนอัตโนมัติ - Survey System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [to_email],
      subject: "✅ ทดสอบอีเมลสำเร็จ - Survey System",
      html: emailHtml,
    });

    console.log(`[${requestId}] Test email sent successfully:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent successfully", emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error);

    // Log error to notifications
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("admin_notifications").insert({
        type: "system_error",
        title: "❌ ทดสอบอีเมลไม่สำเร็จ",
        message: `เกิดข้อผิดพลาด: ${error.message}`,
        severity: "critical",
        payload: { error: error.message },
      });
    } catch (notifyError) {
      console.error(`[${requestId}] Failed to log error notification:`, notifyError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
