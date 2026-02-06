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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    // Create Supabase client with service role
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

    // Fetch all messages for this session
    const { data: messages, error: fetchError } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch messages: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      // No messages to analyze, just mark as completed
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

    // Format conversation for analysis
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "ลูกค้า" : "รู้ใจ"}: ${m.content}`)
      .join("\n");

    const departmentLabel = DEPARTMENT_LABELS[session.department || "general"] || "ทั่วไป";

    console.log(`[รู้ใจ] Analyzing session: ${session_id}, Department: ${departmentLabel}, Messages: ${messages.length}`);

    // Call AI to analyze the conversation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์การสนทนาบริการลูกค้า
วิเคราะห์บทสนทนาระหว่างลูกค้ากับพนักงาน "รู้ใจ" (แผนก: ${departmentLabel})
ตอบโดยใช้ tool ที่กำหนด วิเคราะห์อย่างละเอียดและเป็นกลาง`,
          },
          {
            role: "user",
            content: `วิเคราะห์บทสนทนาต่อไปนี้:\n\n${conversationText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_conversation",
              description: "วิเคราะห์และสรุปการสนทนากับลูกค้าอย่างละเอียด",
              parameters: {
                type: "object",
                properties: {
                  sentiment: {
                    type: "string",
                    enum: ["satisfied", "neutral", "dissatisfied"],
                    description: "ความพึงพอใจของลูกค้า: satisfied = พอใจ, neutral = กลางๆ, dissatisfied = ไม่พอใจ",
                  },
                  sentiment_reason: {
                    type: "string",
                    description: "เหตุผลประกอบการประเมินความพึงพอใจ อธิบายสั้นๆ ว่าทำไมถึงประเมินเช่นนั้น",
                  },
                  problem_type: {
                    type: "string",
                    description: "ประเภทของปัญหา/คำถามหลักที่ลูกค้าต้องการความช่วยเหลือ เช่น สอบถามข้อมูล, ร้องเรียน, ขอคำแนะนำ",
                  },
                  summary: {
                    type: "string",
                    description: "สรุปใจความของการสนทนาเป็นภาษาไทยแบบพนักงานรายงาน ไม่เกิน 200 ตัวอักษร",
                  },
                },
                required: ["sentiment", "sentiment_reason", "problem_type", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_conversation" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[รู้ใจ] AI analysis error:", response.status, errorText);
      throw new Error("Failed to analyze conversation");
    }

    const result = await response.json();
    
    // Extract tool call result
    let sentiment = "neutral";
    let sentimentReason = "ไม่สามารถวิเคราะห์ได้";
    let problemType = "ไม่ระบุ";
    let summary = "ไม่สามารถสรุปได้";

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        sentiment = args.sentiment || "neutral";
        sentimentReason = args.sentiment_reason || "ไม่สามารถวิเคราะห์ได้";
        problemType = args.problem_type || "ไม่ระบุ";
        summary = args.summary || "ไม่สามารถสรุปได้";
      } catch (parseError) {
        console.error("[รู้ใจ] Failed to parse tool call arguments:", parseError);
      }
    }

    console.log(`[รู้ใจ] Analysis result - Sentiment: ${sentiment}, Problem: ${problemType}`);

    // Update the chat session with analysis results
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

      // Create admin notification
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

      // Send email alert if configured
      if (RESEND_API_KEY && EMAIL_FROM) {
        try {
          // Fetch admin emails
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
          // Don't throw - email failure shouldn't block the response
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
