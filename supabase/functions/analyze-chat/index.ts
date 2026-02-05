import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({ success: true, sentiment: "neutral", summary: "ไม่มีการสนทนา" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format conversation for analysis
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "ลูกค้า" : "AI"}: ${m.content}`)
      .join("\n");

    console.log(`Analyzing chat session: ${session_id}, messages: ${messages.length}`);

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
            content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์การสนทนากับลูกค้า
วิเคราะห์บทสนทนาที่ให้มาและตอบโดยใช้ tool ที่กำหนด`,
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
              description: "วิเคราะห์และสรุปการสนทนากับลูกค้า",
              parameters: {
                type: "object",
                properties: {
                  sentiment: {
                    type: "string",
                    enum: ["satisfied", "neutral", "dissatisfied"],
                    description: "ความพึงพอใจของลูกค้า: satisfied = พอใจ, neutral = กลางๆ, dissatisfied = ไม่พอใจ",
                  },
                  summary: {
                    type: "string",
                    description: "สรุปใจความของการสนทนาเป็นภาษาไทย ไม่เกิน 200 ตัวอักษร",
                  },
                },
                required: ["sentiment", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_conversation" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI analysis error:", response.status, errorText);
      throw new Error("Failed to analyze conversation");
    }

    const result = await response.json();
    
    // Extract tool call result
    let sentiment = "neutral";
    let summary = "ไม่สามารถสรุปได้";

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        sentiment = args.sentiment || "neutral";
        summary = args.summary || "ไม่สามารถสรุปได้";
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", parseError);
      }
    }

    console.log(`Analysis result - Sentiment: ${sentiment}, Summary: ${summary}`);

    // Update the chat session with analysis results
    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        sentiment,
        summary,
      })
      .eq("id", session_id);

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, sentiment, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
