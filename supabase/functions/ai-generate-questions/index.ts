import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  context: string;
  tone: "friendly" | "casual" | "professional";
  count: number;
  allowed_types: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service client for admin check (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role using service client
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
    }

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { context, tone, count, allowed_types }: GenerateRequest = await req.json();

    if (!context || !count || !allowed_types?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI Gateway
    const aiGatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toneDescriptions = {
      friendly: "เป็นมิตร อบอุ่น ใช้ภาษาสุภาพ",
      casual: "สบายๆ เข้าถึงง่าย ใช้ภาษาทั่วไป",
      professional: "เป็นทางการ สุภาพ ชัดเจน",
    };

    const typeConfigs: Record<string, string> = {
      linear_1_5: 'สำหรับ linear_1_5: config เป็น { "minLabel": "น้อยที่สุด", "maxLabel": "มากที่สุด" }',
      emoji_visual: 'สำหรับ emoji_visual: config เป็น { "emojis": ["😡", "😟", "😐", "🙂", "😍"] }',
      face_slider_continuous: 'สำหรับ face_slider_continuous: config เป็น { "min": 0, "max": 10, "step": 0.1, "leftLabel": "ไม่เลย", "rightLabel": "มากที่สุด", "faces": [{"min": 0, "max": 2, "emoji": "😌", "text": "สบายๆ"}, {"min": 2, "max": 4, "emoji": "🙂", "text": "โอเค"}, {"min": 4, "max": 6, "emoji": "😐", "text": "ปานกลาง"}, {"min": 6, "max": 8, "emoji": "😕", "text": "ค่อนข้าง"}, {"min": 8, "max": 10, "emoji": "😵‍💫", "text": "มากๆ"}] }',
      icon_rating: 'สำหรับ icon_rating: config เป็น { "max": 5, "icons": ["⭐"] }',
      single_choice: 'สำหรับ single_choice: config เป็น { "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3"] } (ให้สร้าง options ที่เหมาะกับคำถาม)',
      multi_choice: 'สำหรับ multi_choice: config เป็น { "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"] } (ให้สร้าง options ที่เหมาะกับคำถาม)',
      short_text: 'สำหรับ short_text: config เป็น { "placeholder": "พิมพ์คำตอบ..." }',
    };

    const typeConfigInstructions = allowed_types
      .map((t) => typeConfigs[t] || "")
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `คุณเป็นผู้เชี่ยวชาญในการออกแบบแบบสอบถามที่เน้นความรู้สึกและประสบการณ์จริงของผู้ตอบ
สร้างคำถามที่:
- เน้นความรู้สึก ไม่ใช่แบบวิชาการ
- ใช้ภาษา${toneDescriptions[tone]}
- กระจายประเภทคำถามให้หลากหลาย
- ตอบเป็น JSON เท่านั้น

ประเภทที่ใช้ได้: ${allowed_types.join(", ")}

${typeConfigInstructions}

รูปแบบ JSON:
{
  "questions": [
    {
      "question_text": "คำถาม...",
      "question_type": "ประเภท",
      "is_required": true,
      "config": { ... }
    }
  ]
}`;

    const userPrompt = `สร้าง ${count} คำถามสำหรับแบบสำรวจเรื่อง: "${context}"
ให้กระจายประเภทคำถามอย่างเหมาะสม และเน้นถามความรู้สึก/ประสบการณ์จริง`;

    const aiResponse = await fetch(aiGatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error("AI service unavailable");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid questions format");
    }

    return new Response(
      JSON.stringify({ questions: parsed.questions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in ai-generate-questions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
