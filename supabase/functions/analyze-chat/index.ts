import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  survey: "ระบบแบบสำรวจ",
  insurance: "ที่ปรึกษาประกัน",
  real_estate: "ที่ปรึกษาอสังหาฯ",
  customer_service: "บริการลูกค้า",
  general: "ทั่วไป",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session info
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError) {
      throw new Error(`Failed to fetch session: ${sessionError.message}`);
    }

    // Fetch all messages
    const { data: messages, error: fetchError } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch messages: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      await supabase
        .from("chat_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          sentiment: "neutral",
          summary: "ไม่มีการสนทนา",
          sentiment_reason: "ไม่มีข้อความในการสนทนา",
        })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ success: true, sentiment: "neutral", summary: "ไม่มีการสนทนา" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const conversationText = messages
      .map((m) => `${m.role === "user" ? "ลูกค้า" : "รู้ใจ"}: ${m.content}`)
      .join("\n");

    const departmentLabel = DEPARTMENT_LABELS[session.department || "general"] || "ทั่วไป";

    console.log(`[รู้ใจ] Analyzing session: ${session_id}, Department: ${departmentLabel}, Messages: ${messages.length}`);

    // Call Gemini API with tool calling (non-streaming) + retry on 429
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์การสนทนาบริการลูกค้า
วิเคราะห์บทสนทนาระหว่างลูกค้ากับพนักงาน "รู้ใจ" (แผนก: ${departmentLabel})
ตอบโดยใช้ tool ที่กำหนด วิเคราะห์อย่างละเอียดและเป็นกลาง` }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `วิเคราะห์บทสนทนาต่อไปนี้:\n\n${conversationText}` }],
        },
      ],
      tools: [{
        function_declarations: [{
          name: "analyze_conversation",
          description: "วิเคราะห์และสรุปการสนทนากับลูกค้าอย่างละเอียด",
          parameters: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["satisfied", "neutral", "dissatisfied"],
                description: "ความพึงพอใจของลูกค้า",
              },
              sentiment_reason: {
                type: "string",
                description: "เหตุผลประกอบการประเมินความพึงพอใจ",
              },
              problem_type: {
                type: "string",
                description: "ประเภทของปัญหา/คำถามหลัก",
              },
              summary: {
                type: "string",
                description: "สรุปใจความของการสนทนาเป็นภาษาไทย ไม่เกิน 200 ตัวอักษร",
              },
            },
            required: ["sentiment", "sentiment_reason", "problem_type", "summary"],
          },
        }],
      }],
      toolConfig: {
        functionCallingConfig: { mode: "ANY" },
      },
    });

    let result: any = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: geminiBody,
      });

      if (response.ok) {
        result = await response.json();
        break;
      }

      if (response.status === 429 && attempt < maxRetries - 1) {
        const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
        console.log(`[รู้ใจ] Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      const errorText = await response.text();
      console.error("[รู้ใจ] Gemini analysis error:", response.status, errorText);
      throw new Error("Failed to analyze conversation");
    }

    if (!result) {
      throw new Error("Failed to analyze conversation after retries");
    }

    // Extract tool call result from Gemini format
    let sentiment = "neutral";
    let sentimentReason = "ไม่สามารถวิเคราะห์ได้";
    let problemType = "ไม่ระบุ";
    let summary = "ไม่สามารถสรุปได้";

    const candidate = result.candidates?.[0];
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;

    if (functionCall?.args) {
      const args = functionCall.args;
      sentiment = args.sentiment || "neutral";
      sentimentReason = args.sentiment_reason || "ไม่สามารถวิเคราะห์ได้";
      problemType = args.problem_type || "ไม่ระบุ";
      summary = args.summary || "ไม่สามารถสรุปได้";
    }

    console.log(`[รู้ใจ] Analysis result - Sentiment: ${sentiment}, Problem: ${problemType}`);

    // Update the chat session
    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        sentiment,
        sentiment_reason: sentimentReason,
        problem_type: problemType,
        summary,
      })
      .eq("id", session_id);

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    // If dissatisfied, create notification and send email alert
    if (sentiment === "dissatisfied") {
      console.log(`[รู้ใจ] Dissatisfied customer detected! Creating alert...`);

      await supabase.from("admin_notifications").insert({
        type: "chat_dissatisfied",
        severity: "critical",
        title: `[AI CHAT – รู้ใจ] ลูกค้าไม่พอใจ`,
        message: `${session.customer_name || "ลูกค้า"} แสดงความไม่พอใจในการสนทนา (แผนก: ${departmentLabel})`,
        payload: {
          session_id,
          customer_name: session.customer_name,
          customer_email: session.customer_email,
          customer_phone: session.customer_phone,
          department: session.department,
          department_label: departmentLabel,
          problem_type: problemType,
          summary,
          sentiment_reason: sentimentReason,
          source: "AI_CHAT_RUO_JAI",
        },
      });

      if (RESEND_API_KEY && EMAIL_FROM) {
        try {
          const { data: settings } = await supabase
            .from("admin_settings")
            .select("admin_emails")
            .limit(1)
            .single();

          const adminEmails = settings?.admin_emails || [];

          if (adminEmails.length > 0) {
            const emailHtml = `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #dc2626;">⚠️ [AI CHAT – รู้ใจ] แจ้งเตือนลูกค้าไม่พอใจ</h2>
                <hr>
                <h3>ข้อมูลลูกค้า</h3>
                <ul>
                  <li><strong>ชื่อ:</strong> ${session.customer_name || "ไม่ระบุ"}</li>
                  <li><strong>เบอร์โทร:</strong> ${session.customer_phone || "ไม่ระบุ"}</li>
                  <li><strong>อีเมล:</strong> ${session.customer_email || "ไม่ระบุ"}</li>
                </ul>
                <h3>รายละเอียดการสนทนา</h3>
                <ul>
                  <li><strong>แผนก/ระบบ:</strong> ${departmentLabel}</li>
                  <li><strong>ประเภทปัญหา:</strong> ${problemType}</li>
                </ul>
                <h3>สรุปปัญหา</h3>
                <p style="background: #fee2e2; padding: 10px; border-radius: 5px;">${summary}</p>
                <h3>เหตุผลที่ไม่พอใจ</h3>
                <p style="background: #fef3c7; padding: 10px; border-radius: 5px;">${sentimentReason}</p>
                <hr>
                <p><small>แจ้งเตือนจากระบบ AI Chat รู้ใจ - Feeldi</small></p>
              </div>
            `;

            const { Resend } = await import("npm:resend@2.0.0");
            const resend = new Resend(RESEND_API_KEY);

            await resend.emails.send({
              from: EMAIL_FROM,
              to: adminEmails,
              subject: `⚠️ [รู้ใจ] ลูกค้าไม่พอใจ - ${session.customer_name || "ไม่ระบุชื่อ"}`,
              html: emailHtml,
            });

            console.log(`[รู้ใจ] Alert email sent to ${adminEmails.length} admin(s)`);
          }
        } catch (emailError) {
          console.error("[รู้ใจ] Failed to send alert email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentiment, 
        sentiment_reason: sentimentReason,
        problem_type: problemType,
        summary 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[รู้ใจ] Analyze chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
