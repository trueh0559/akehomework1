import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LowScoreItem {
  question_id: string;
  question_text: string;
  score: number;
  threshold: number;
}

// Score-based question types
const SCORE_QUESTION_TYPES = ['slider_continuous', 'linear_1_5', 'emoji_visual', 'icon_rating'];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] notify-new-response invoked`);

  try {
    const { response_id } = await req.json();
    
    if (!response_id) {
      console.log(`[${requestId}] No response_id provided`);
      return new Response(
        JSON.stringify({ success: false, message: "Missing response_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${requestId}] Processing response: ${response_id}`);

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the response
    const { data: response, error: responseError } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("id", response_id)
      .single();

    if (responseError || !response) {
      console.error(`[${requestId}] Error fetching response:`, responseError);
      throw new Error("Response not found");
    }

    console.log(`[${requestId}] Response found for survey: ${response.survey_id}`);

    // 2. Fetch questions for this survey
    const { data: questions, error: questionsError } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", response.survey_id);

    if (questionsError) {
      console.error(`[${requestId}] Error fetching questions:`, questionsError);
      throw new Error("Questions not found");
    }

    // 3. Fetch admin settings
    const { data: settings, error: settingsError } = await supabase
      .from("admin_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError) {
      console.error(`[${requestId}] Error fetching settings:`, settingsError);
      throw new Error("Admin settings not found");
    }

    const threshold = settings.low_score_threshold || 3;
    const adminEmails: string[] = settings.admin_emails || [];

    console.log(`[${requestId}] Threshold: ${threshold}, Admin emails: ${adminEmails.length}`);

    // 4. Check for low scores (per question)
    const lowScoreItems: LowScoreItem[] = [];
    const answers = response.answers as Record<string, any>;

    for (const question of questions) {
      // Only check score-based questions
      if (!SCORE_QUESTION_TYPES.includes(question.question_type)) {
        continue;
      }

      const answer = answers[question.id];
      if (answer && typeof answer.score === 'number') {
        if (answer.score < threshold) {
          lowScoreItems.push({
            question_id: question.id,
            question_text: question.question_text,
            score: answer.score,
            threshold: threshold,
          });
        }
      }
    }

    console.log(`[${requestId}] Low score items found: ${lowScoreItems.length}`);

    // 5. Send Thank You email to respondent (if email provided)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Survey <noreply@resend.dev>";
    
    let thankYouSent = false;
    
    if (resendApiKey && response.respondent_email && !response.is_anonymous) {
      try {
        const { Resend } = await import("https://esm.sh/resend@2.0.0");
        const resend = new Resend(resendApiKey);

        const thankYouHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 32px; text-align: center; }
              .content { padding: 32px; background: #f8fafc; }
              .thank-box { background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              .footer { background: #1e293b; color: #94a3b8; padding: 16px; text-align: center; font-size: 12px; }
              .emoji { font-size: 48px; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0">🙏 ขอบคุณสำหรับความคิดเห็น!</h1>
              </div>
              <div class="content">
                <div class="thank-box">
                  <div class="emoji">💚</div>
                  <h2 style="margin:0 0 16px 0;color:#10b981">ได้รับข้อมูลเรียบร้อยแล้ว</h2>
                  <p style="margin:0;color:#64748b">
                    สวัสดีคุณ ${response.respondent_name || 'ผู้ตอบแบบสอบถาม'}<br><br>
                    ขอบคุณที่สละเวลาแบ่งปันความคิดเห็น<br>
                    ทุกคำตอบของคุณมีคุณค่าและช่วยให้เราพัฒนาบริการให้ดียิ่งขึ้น
                  </p>
                </div>
              </div>
              <div class="footer">
                <p style="margin:0">ระบบส่งอีเมลอัตโนมัติ - Survey System</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: emailFrom,
          to: [response.respondent_email],
          subject: "🙏 ขอบคุณสำหรับความคิดเห็นของคุณ",
          html: thankYouHtml,
        });

        thankYouSent = true;
        console.log(`[${requestId}] Thank you email sent to: ${response.respondent_email}`);
      } catch (thankYouError: any) {
        console.error(`[${requestId}] Thank you email error:`, thankYouError);
      }
    }

    // 6. If no low scores, return success
    if (lowScoreItems.length === 0) {
      console.log(`[${requestId}] No low scores detected`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Response processed", 
          thank_you_sent: thankYouSent 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 7. Create admin notification in database
    const { error: notificationError } = await supabase
      .from("admin_notifications")
      .insert({
        type: "low_score",
        title: `⚠️ คะแนนต่ำ - ${lowScoreItems.length} ข้อ`,
        message: `พบคำตอบที่มีคะแนนต่ำกว่าเกณฑ์ (< ${threshold}) จำนวน ${lowScoreItems.length} ข้อ`,
        severity: "warning",
        payload: {
          response_id: response_id,
          survey_id: response.survey_id,
          respondent_name: response.respondent_name,
          respondent_email: response.respondent_email,
          is_anonymous: response.is_anonymous,
          submitted_at: response.submitted_at,
          low_score_items: lowScoreItems,
        },
      });

    if (notificationError) {
      console.error(`[${requestId}] Error creating notification:`, notificationError);
    }

    // 8. Send low-score alert email to admins
    // adminEmails already declared above from settings
    
    if (!resendApiKey || adminEmails.length === 0) {
      console.log(`[${requestId}] Admin email skipped: No API key or admin emails configured`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Low score notification created, admin email skipped",
          thank_you_sent: thankYouSent,
          low_score_items: lowScoreItems 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      const { Resend } = await import("https://esm.sh/resend@2.0.0");
      const resend = new Resend(resendApiKey);

      const respondentInfo = response.is_anonymous 
        ? "ไม่ระบุตัวตน" 
        : `${response.respondent_name || "ไม่ระบุชื่อ"} (${response.respondent_email || "ไม่ระบุอีเมล"})`;

      const lowScoreHtml = lowScoreItems.map((item, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.question_text}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="color: #dc2626; font-weight: bold;">${item.score}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.threshold}</td>
        </tr>
      `).join("");

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #dc2626, #f97316); color: white; padding: 24px; text-align: center; }
            .content { padding: 24px; background: #f8fafc; }
            .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .alert-box h3 { margin: 0 0 8px 0; color: #dc2626; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
            th { background: #1e293b; color: white; padding: 12px; text-align: left; }
            .footer { background: #1e293b; color: #94a3b8; padding: 16px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">⚠️ แจ้งเตือนคะแนนต่ำ</h1>
              <p style="margin:8px 0 0 0;opacity:0.9">พบคำตอบที่ต้องการความสนใจ</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3>📊 สรุปปัญหา</h3>
                <p style="margin:0">พบ <strong>${lowScoreItems.length}</strong> ข้อที่มีคะแนนต่ำกว่าเกณฑ์ (< ${threshold})</p>
              </div>
              
              <h3>👤 ผู้ตอบ</h3>
              <p>${respondentInfo}</p>
              <p style="color:#64748b;font-size:14px">
                ส่งเมื่อ: ${new Date(response.submitted_at).toLocaleString('th-TH')}
              </p>

              <h3>📝 รายละเอียดคะแนนต่ำ</h3>
              <table>
                <thead>
                  <tr>
                    <th>คำถาม</th>
                    <th style="text-align:center">คะแนน</th>
                    <th style="text-align:center">เกณฑ์</th>
                  </tr>
                </thead>
                <tbody>
                  ${lowScoreHtml}
                </tbody>
              </table>
            </div>
            <div class="footer">
              <p>ระบบแจ้งเตือนอัตโนมัติ - Survey System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log(`[${requestId}] Sending email to ${adminEmails.length} recipients`);

      const emailResponse = await resend.emails.send({
        from: emailFrom,
        to: adminEmails,
        subject: `⚠️ แจ้งเตือนคะแนนต่ำ - ${lowScoreItems.length} ข้อต้องการความสนใจ`,
        html: emailHtml,
      });

      console.log(`[${requestId}] Email sent successfully:`, emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Low score notification sent",
          thank_you_sent: thankYouSent,
          email_response: emailResponse,
          low_score_items: lowScoreItems 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (emailError: any) {
      console.error(`[${requestId}] Email error:`, emailError);

      // Log email error to notifications
      await supabase.from("admin_notifications").insert({
        type: "system_error",
        title: "❌ ส่งอีเมลไม่สำเร็จ",
        message: `ไม่สามารถส่งอีเมลแจ้งเตือนคะแนนต่ำได้: ${emailError.message}`,
        severity: "critical",
        payload: {
          error: emailError.message,
          response_id: response_id,
          attempted_recipients: adminEmails,
        },
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Admin email failed but notification created",
          thank_you_sent: thankYouSent,
          error: emailError.message,
          low_score_items: lowScoreItems 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
