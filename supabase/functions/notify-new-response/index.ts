import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResponseData {
  name: string;
  email: string;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  q4_score: number;
  q5_score: number;
  comment: string | null;
  is_anonymous: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    // If no API key or admin email configured, just log and return success
    if (!resendApiKey || !adminEmail) {
      console.log("Email notification skipped: RESEND_API_KEY or ADMIN_EMAIL not configured");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped - not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const responseData: ResponseData = await req.json();
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    
    const totalScore = responseData.q1_score + responseData.q2_score + 
                       responseData.q3_score + responseData.q4_score + 
                       responseData.q5_score;
    const avgScore = totalScore / 5;

    // Determine if this is a low score (requires attention)
    const isLowScore = avgScore < 3;
    const subjectEmoji = isLowScore ? "⚠️" : "📊";
    const alertType = isLowScore ? "คะแนนต่ำ - ต้องการความสนใจ" : "คำตอบใหม่";

    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
          .score-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${isLowScore ? '#ef4444' : '#22c55e'}; }
          .score-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 15px 0; }
          .score-item { text-align: center; padding: 10px; background: white; border-radius: 8px; }
          .score-value { font-size: 24px; font-weight: bold; color: #6366f1; }
          .total-score { font-size: 32px; font-weight: bold; color: ${isLowScore ? '#ef4444' : '#22c55e'}; }
          .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
          .alert-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${isLowScore ? '#fef2f2' : '#f0fdf4'}; color: ${isLowScore ? '#dc2626' : '#16a34a'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0">${subjectEmoji} แบบประเมินใหม่</h1>
            <p style="margin:5px 0 0 0;opacity:0.9">คอร์สเรียนการเขียน App ด้วย AI</p>
          </div>
          <div class="content">
            <span class="alert-badge">${alertType}</span>
            
            <div class="score-box">
              <h3 style="margin:0 0 10px 0">📊 สรุปคะแนน</h3>
              <p style="margin:0">คะแนนเฉลี่ย: <span class="total-score">${avgScore.toFixed(1)}/5</span></p>
              <p style="margin:5px 0 0 0;color:#64748b">คะแนนรวม: ${totalScore}/25</p>
            </div>

            <h3>📝 คะแนนแต่ละข้อ</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px;background:#f1f5f9;border-radius:4px;">ข้อ 1: ความเข้าใจเนื้อหา</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#6366f1;">${responseData.q1_score}/5</td>
              </tr>
              <tr>
                <td style="padding:8px;">ข้อ 2: ความชัดเจนในการอธิบาย</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#6366f1;">${responseData.q2_score}/5</td>
              </tr>
              <tr>
                <td style="padding:8px;background:#f1f5f9;border-radius:4px;">ข้อ 3: การนำไปใช้งานจริง</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#6366f1;">${responseData.q3_score}/5</td>
              </tr>
              <tr>
                <td style="padding:8px;">ข้อ 4: คุณภาพเครื่องมือ AI</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#6366f1;">${responseData.q4_score}/5</td>
              </tr>
              <tr>
                <td style="padding:8px;background:#f1f5f9;border-radius:4px;">ข้อ 5: ความคุ้มค่าโดยรวม</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#6366f1;">${responseData.q5_score}/5</td>
              </tr>
            </table>

            <h3>👤 ข้อมูลผู้ประเมิน</h3>
            <p><strong>ชื่อ:</strong> ${responseData.is_anonymous ? '(ไม่ระบุตัวตน)' : responseData.name}</p>
            <p><strong>Email:</strong> ${responseData.is_anonymous ? '(ไม่ระบุตัวตน)' : responseData.email}</p>

            ${responseData.comment ? `
            <h3>💬 ข้อเสนอแนะ</h3>
            <div style="background:white;padding:15px;border-radius:8px;border:1px solid #e2e8f0;">
              <p style="margin:0;white-space:pre-wrap;">${responseData.comment}</p>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>ระบบแจ้งเตือนอัตโนมัติ - AI App Development Course</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Survey Notification <noreply@resend.dev>",
      to: [adminEmail],
      subject: `${subjectEmoji} ${alertType} - คะแนนเฉลี่ย ${avgScore.toFixed(1)}/5`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
