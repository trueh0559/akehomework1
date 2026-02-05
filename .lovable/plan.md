
# แผนพัฒนา AI Chatbot ด้วย Lovable AI

## ภาพรวมระบบ

```text
                                    AI CHATBOT SYSTEM ARCHITECTURE
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|    FRONTEND                          BACKEND                         DATABASE            |
|                                                                                           |
|  +-----------------+              +-----------------+              +-----------------+    |
|  | FloatingChat    |   Stream    | chat/index.ts   |              | chat_sessions   |    |
|  | Button.tsx      |------------>| - Lovable AI    |------------->| - customer info |    |
|  |                 |   (SSE)     | - Streaming     |              | - sentiment     |    |
|  +-----------------+              +-----------------+              | - summary       |    |
|          |                               |                        +-----------------+    |
|          v                               |                               |              |
|  +-----------------+                     |                               |              |
|  | ChatWindow.tsx  |                     v                               v              |
|  | - Messages      |              +-----------------+              +-----------------+    |
|  | - Input         |              | analyze-chat    |              | chat_messages   |    |
|  | - Streaming UI  |              | - Sentiment     |<------------>| - role          |    |
|  +-----------------+              | - Summary       |              | - content       |    |
|          |                        +-----------------+              +-----------------+    |
|          v                                                                               |
|  +-----------------+                                                                      |
|  | CustomerInfo    |                                                                      |
|  | Form.tsx        |                                                                      |
|  | - Name/Tel/Email|                                                                      |
|  +-----------------+                                                                      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

## ขั้นตอนการพัฒนา (5 Steps)

### Step 1: สร้าง Database Tables

**Table: `chat_sessions`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| started_at | timestamp | เวลาเริ่มแชท |
| ended_at | timestamp | เวลาจบแชท (nullable) |
| customer_name | text | ชื่อลูกค้า (nullable) |
| customer_phone | text | เบอร์โทร (nullable) |
| customer_email | text | อีเมล (nullable) |
| sentiment | text | dissatisfied / neutral / satisfied |
| summary | text | AI สรุปการสนทนา |
| status | text | active / completed / abandoned |
| message_count | int | จำนวนข้อความ |

**Table: `chat_messages`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | FK -> chat_sessions |
| role | text | user / assistant |
| content | text | เนื้อหาข้อความ |
| created_at | timestamp | เวลาส่ง |

**RLS Policies:**
- chat_sessions: Public INSERT/SELECT (ลูกค้าสร้างและอ่านได้)
- chat_messages: Public INSERT/SELECT ตาม session_id

---

### Step 2: สร้าง Edge Function - Chat (Streaming)

**ไฟล์:** `supabase/functions/chat/index.ts`

**หน้าที่:**
- รับ messages array จาก frontend
- ส่งต่อไปยัง Lovable AI Gateway พร้อม System Prompt
- Stream response กลับแบบ SSE (Server-Sent Events)

**System Prompt:**
```
คุณเป็นผู้ช่วยบริการลูกค้าที่เป็นมิตรของ Feeldi
- ตอบคำถามเกี่ยวกับบริการ/สินค้าอย่างสุภาพ
- ช่วยเหลือและให้คำแนะนำ
- ใช้ภาษาไทยเป็นหลัก
- ตอบกระชับ ไม่เกิน 3 ประโยค
```

**Config:** `verify_jwt = false` (ลูกค้าใช้ได้โดยไม่ต้อง login)

---

### Step 3: สร้าง Edge Function - Analyze Chat

**ไฟล์:** `supabase/functions/analyze-chat/index.ts`

**หน้าที่:**
- รับ session_id
- ดึงข้อความทั้งหมดจาก chat_messages
- ใช้ AI วิเคราะห์:
  - **Sentiment:** dissatisfied / neutral / satisfied
  - **Summary:** สรุปใจความ 1-2 ประโยค
- อัปเดตกลับไปที่ chat_sessions

**Tool Calling Schema:**
```json
{
  "name": "analyze_conversation",
  "parameters": {
    "sentiment": "satisfied | neutral | dissatisfied",
    "summary": "string (max 200 chars)"
  }
}
```

---

### Step 4: สร้าง Frontend Components

**4.1 FloatingChatButton.tsx**
- ปุ่มกลม มุมขวาล่าง (ด้านบน Admin button)
- ไอคอน MessageCircle
- คลิกเปิด/ปิด ChatWindow
- Badge แสดงจุดแดงเมื่อมี unread

**4.2 ChatWindow.tsx**
- หน้าต่าง chat แบบ modal/drawer
- Header: ชื่อ + ปุ่มปิด + ปุ่มจบสนทนา
- Message list: แสดง user/assistant messages
- Input: พิมพ์ข้อความ + ปุ่มส่ง
- Streaming: แสดงข้อความ AI พิมพ์ทีละตัว
- Animation: framer-motion

**4.3 CustomerInfoForm.tsx**
- Modal แสดงเมื่อจบสนทนา
- Fields: ชื่อ, เบอร์โทร, อีเมล (optional)
- ปุ่ม: ส่งข้อมูล / ข้าม
- เมื่อส่ง: อัปเดต chat_sessions + เรียก analyze-chat

**Flow การใช้งาน:**
```text
1. ลูกค้าคลิกปุ่ม Chat
2. สร้าง chat_session ใหม่ (status: active)
3. ลูกค้าพิมพ์ข้อความ -> บันทึก chat_messages -> ส่งไป AI
4. AI ตอบกลับ (streaming) -> บันทึก chat_messages
5. วนซ้ำจนลูกค้าคลิก "จบสนทนา"
6. แสดง CustomerInfoForm
7. บันทึกข้อมูลลูกค้า + เรียก analyze-chat
8. แสดง "ขอบคุณ" และปิด
```

---

### Step 5: สร้าง Admin Page - Chat History

**Route:** `/admin/chats`

**หน้าที่:**
- แสดงรายการ chat sessions ทั้งหมด
- Filter: ตาม sentiment, วันที่, status
- แต่ละ row แสดง: วันที่, ชื่อลูกค้า, sentiment badge, สรุป
- คลิกดู detail: แสดง full conversation + ข้อมูลลูกค้า

**UI Design:**
- ใช้ pattern เดียวกับ Admin.tsx
- Table view พร้อม pagination
- Sentiment badges: 🔴 dissatisfied, 🟡 neutral, 🟢 satisfied
- Modal แสดง conversation detail

---

## รายการไฟล์ที่ต้องสร้าง/แก้ไข

| ไฟล์ | ประเภท | รายละเอียด |
|------|--------|------------|
| Migration SQL | Database | สร้าง chat_sessions, chat_messages |
| `supabase/functions/chat/index.ts` | Edge Function | Streaming chat กับ Lovable AI |
| `supabase/functions/analyze-chat/index.ts` | Edge Function | วิเคราะห์ sentiment + สรุป |
| `src/components/chat/FloatingChatButton.tsx` | Component | ปุ่ม floating เปิด chat |
| `src/components/chat/ChatWindow.tsx` | Component | หน้าต่าง chat หลัก |
| `src/components/chat/ChatMessage.tsx` | Component | แสดงข้อความแต่ละ bubble |
| `src/components/chat/CustomerInfoForm.tsx` | Component | ฟอร์มขอข้อมูลลูกค้า |
| `src/pages/AdminChats.tsx` | Page | หน้า admin ดูประวัติ chat |
| `src/App.tsx` | Update | เพิ่ม route /admin/chats |
| `src/pages/Index.tsx` | Update | เพิ่ม FloatingChatButton |
| `src/components/admin/AdminHeader.tsx` | Update | เพิ่ม link ไป Chat History |
| `supabase/config.toml` | Update | เพิ่ม config สำหรับ functions ใหม่ |

---

## Technical Details

### Streaming Implementation Pattern

```typescript
// Frontend: Token-by-token rendering
const streamChat = async (messages, onDelta, onDone) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, session_id }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    // Parse SSE line-by-line
    // Extract delta.content and call onDelta(chunk)
  }
  onDone();
};
```

### Sentiment Analysis Tool Schema

```typescript
const tools = [{
  type: "function",
  function: {
    name: "analyze_conversation",
    parameters: {
      type: "object",
      properties: {
        sentiment: { 
          type: "string", 
          enum: ["satisfied", "neutral", "dissatisfied"] 
        },
        summary: { 
          type: "string", 
          maxLength: 200 
        }
      },
      required: ["sentiment", "summary"]
    }
  }
}];
```

---

## ประมาณการเวลา

| ขั้นตอน | เวลา |
|---------|------|
| Step 1: Database | 5 นาที |
| Step 2: Chat Edge Function | 10 นาที |
| Step 3: Analyze Edge Function | 10 นาที |
| Step 4: Frontend Components | 20 นาที |
| Step 5: Admin Page | 15 นาที |
| **รวม** | **~60 นาที** |

---

## ผลลัพธ์ที่คาดหวัง

1. ลูกค้าสามารถเปิด chatbox และคุยกับ AI ได้ทันที
2. AI ตอบแบบ streaming (พิมพ์ทีละตัว)
3. เมื่อจบสนทนา ระบบขอข้อมูลลูกค้า (optional)
4. AI วิเคราะห์ sentiment และสรุปการสนทนาอัตโนมัติ
5. Admin ดูประวัติการคุยทั้งหมดได้พร้อม filter
6. ไม่ต้องเพิ่ม API Key ใหม่ (ใช้ LOVABLE_API_KEY ที่มีอยู่)
