

# แผนเปลี่ยนจาก Lovable AI Gateway เป็น Gemini API โดยตรง

## สรุปภาพรวม

เปลี่ยนระบบ AI ทั้ง 3 Edge Functions จากการเรียกผ่าน Lovable AI Gateway (`ai.gateway.lovable.dev`) ไปเรียก Google Gemini API โดยตรง (`generativelanguage.googleapis.com`) โดยใช้โมเดล `gemini-3-flash-preview`

## ขั้นตอนที่ต้องทำ

### 1. เพิ่ม Secret: GEMINI_API_KEY
- ต้องขอ API Key จาก Google AI Studio (https://aistudio.google.com/apikey)
- บันทึกเป็น Secret ชื่อ `GEMINI_API_KEY`

### 2. แก้ไข Edge Function: `chat/index.ts`
- เปลี่ยน endpoint จาก `https://ai.gateway.lovable.dev/v1/chat/completions` เป็น `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=GEMINI_API_KEY`
- เปลี่ยนรูปแบบ request body จาก OpenAI format เป็น Gemini format:
  - `messages` -> `contents` (พร้อมแปลง role: "assistant" -> "model", "system" -> systemInstruction)
  - ไม่ต้องใช้ Authorization header แต่ใช้ API key ใน URL แทน
- เปลี่ยนการ parse response จาก OpenAI SSE format เป็น Gemini SSE format (ข้อมูลจะอยู่ใน `candidates[0].content.parts[0].text`)
- **สำคัญ**: Frontend (`ChatWindow.tsx`) ยังคง parse SSE อยู่ ดังนั้นต้องแปลง response ของ Gemini กลับเป็น OpenAI-compatible SSE format ใน Edge Function เพื่อไม่ต้องแก้ Frontend

### 3. แก้ไข Edge Function: `analyze-chat/index.ts`
- เปลี่ยน endpoint เป็น Gemini API (non-streaming)
- ใช้ `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=GEMINI_API_KEY`
- แปลง tool calling format จาก OpenAI -> Gemini (`tools` -> `tools` แต่โครงสร้างต่างกันเล็กน้อย, `tool_choice` -> `toolConfig`)
- แปลง response parsing จาก OpenAI format เป็น Gemini format

### 4. แก้ไข Edge Function: `ai-generate-questions/index.ts`
- เปลี่ยน endpoint เป็น Gemini API (non-streaming)
- แปลง request/response format เช่นเดียวกับข้อ 3

### 5. ไม่ต้องแก้ไข Frontend
- Edge Functions จะทำหน้าที่แปลง response format ให้เป็น OpenAI-compatible SSE สำหรับ streaming (chat function)
- Frontend (`ChatWindow.tsx`) ยังคงทำงานเหมือนเดิม

---

## รายละเอียดทางเทคนิค

### Gemini API Request Format (Streaming)

```text
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=API_KEY

Body:
{
  "system_instruction": { "parts": [{ "text": "system prompt" }] },
  "contents": [
    { "role": "user", "parts": [{ "text": "hello" }] },
    { "role": "model", "parts": [{ "text": "hi" }] }
  ]
}
```

### Response Transform (ใน Edge Function)
Gemini SSE จะส่ง JSON ที่มี `candidates[0].content.parts[0].text` ซึ่ง Edge Function จะแปลงเป็น OpenAI-compatible format (`choices[0].delta.content`) ก่อนส่งให้ Frontend เพื่อไม่ต้องแก้ไข Frontend เลย

### Gemini Tool Calling Format

```text
{
  "tools": [{
    "function_declarations": [{
      "name": "analyze_conversation",
      "description": "...",
      "parameters": { ... }
    }]
  }],
  "toolConfig": {
    "functionCallingConfig": { "mode": "ANY" }
  }
}
```

### ไฟล์ที่ต้องแก้ไข
1. `supabase/functions/chat/index.ts` - Streaming chat
2. `supabase/functions/analyze-chat/index.ts` - Sentiment analysis
3. `supabase/functions/ai-generate-questions/index.ts` - Question generation

### ไฟล์ที่ไม่ต้องแก้ไข
- `src/components/chat/ChatWindow.tsx` - ไม่ต้องแก้
- `supabase/config.toml` - ไม่ต้องแก้

