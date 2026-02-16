

# อัปเดต README.md เป็น Documentation สรุปฟีเจอร์ทั้งหมดของ Feeldi

## เนื้อหาที่จะเขียนใน README.md

README.md จะถูกเขียนใหม่ทั้งหมด โดยมีโครงสร้างดังนี้:

---

### 1. ภาพรวมโปรเจกต์
- ชื่อ: **Feeldi** – Feedback that feels right
- ระบบสำรวจความพึงพอใจแบบไดนามิกที่เน้นการวัดความรู้สึก พร้อม AI Chatbot, ระบบสมาชิก/คูปอง และ Admin Dashboard

### 2. Tech Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- Backend: Lovable Cloud (Supabase) - Database, Auth, Edge Functions
- AI: Google Gemini 2.0 Flash (ผ่าน API โดยตรง)
- Email: Resend API
- Messaging: LINE Messaging API

### 3. รายการฟีเจอร์ทั้งหมด (7 ฟีเจอร์หลัก)

**3.1 ระบบแบบสำรวจไดนามิก (Dynamic Survey)**
- รองรับ 10 ประเภทคำถาม (slider, linear 1-5, emoji, single/multi choice, icon rating, short/long text, face slider, icon size scale)
- Multi-survey: เปิดหลายแบบสำรวจพร้อมกัน
- ตั้งเวลาเปิด-ปิดอัตโนมัติ (Scheduling)
- Auto-Save Draft (localStorage + Debounce 500ms)
- ตอบแบบไม่ระบุตัวตน (Anonymous)
- QR Code สำหรับแชร์ลิงก์
- Secrets ที่เกี่ยวข้อง: ไม่มี (ใช้ Database อย่างเดียว)

**3.2 AI Chatbot "รู้ใจ" (Roo-Jai)**
- บุคลิกเป็นพนักงานจริง พร้อม Persona Guard ป้องกัน Prompt Injection
- รองรับ 5 แผนก: แบบสำรวจ, ประกัน, อสังหาฯ, บริการลูกค้า, ทั่วไป
- Streaming response (SSE)
- วิเคราะห์ Sentiment อัตโนมัติหลังจบสนทนา (analyze-chat)
- เก็บข้อมูล Lead (ชื่อ, เบอร์, อีเมล)
- แจ้งเตือนแอดมินทันทีเมื่อลูกค้าไม่พอใจ
- Secrets ที่ต้องการ: **GEMINI_API_KEY**

**3.3 ระบบแจ้งเตือนอัตโนมัติ (Notifications)**
- แจ้งเตือนผ่าน LINE Group Bot (Messaging API)
- แจ้งเตือนผ่าน Email (Resend API)
- เปิด/ปิดช่องทางได้ (LINE, Email)
- เปิด/ปิดประเภทได้ (ตอบแบบสอบถาม, คะแนนต่ำ, แชทใหม่)
- กระดิ่งแจ้งเตือน In-App แบบ Real-time
- ตรวจจับคะแนนต่ำรายข้อ (Per-question low score)
- Secrets ที่ต้องการ: **RESEND_API_KEY**, **EMAIL_FROM**, **LINE_CHANNEL_ACCESS_TOKEN**, **LINE_GROUP_ID**

**3.4 AI สร้างคำถามอัตโนมัติ (AI Question Generator)**
- สร้างคำถามจากบริบทที่ระบุ
- เลือกโทน (เป็นมิตร, สบายๆ, ทางการ)
- เลือกประเภทคำถามที่อนุญาต
- Admin-only (ตรวจสอบ RBAC)
- Secrets ที่ต้องการ: **GEMINI_API_KEY**

**3.5 ระบบสมาชิกและคูปอง (Membership & E-Coupon)**
- ล็อกอินด้วย Email/Password หรือ Google OAuth
- รับคูปองอัตโนมัติหลังทำแบบสำรวจ
- หน้า "คูปองของฉัน" (/my-coupons) พร้อม QR Code
- Admin จัดการแคมเปญคูปอง (/admin/coupons)
- Secrets ที่ต้องการ: ไม่มี (ใช้ built-in Auth)

**3.6 Admin Dashboard**
- Dashboard วิเคราะห์ข้อมูล (Distribution/Histogram, Median)
- Survey Builder + Import/Export JSON
- จัดการแชทและดู Sentiment Analysis
- จัดการคูปองและบันทึก Redeem
- สิทธิ์เฉพาะ Role "admin" (RBAC ผ่าน user_roles)
- Secrets ที่ต้องการ: ไม่มี

**3.7 ระบบธีมและ UI Settings**
- โหมดมืด/สว่าง
- พื้นหลังแบบ สีพื้น/รูปภาพ/วิดีโอ
- เปิด/ปิดแอนิเมชัน
- บันทึกลง Database (ui_settings)

### 4. สรุป Secrets/API Keys ทั้งหมดที่ต้องตั้งค่า

| Secret | ใช้กับฟีเจอร์ | หมายเหตุ |
|--------|-------------|----------|
| GEMINI_API_KEY | AI Chatbot, AI Question Generator | ต้องเปิด Billing ใน Google Cloud |
| RESEND_API_KEY | Email Notifications | จาก resend.com |
| EMAIL_FROM | Email Notifications | ต้องเป็น Verified Domain เช่น `Feeldi <noreply@yourdomain.com>` |
| LINE_CHANNEL_ACCESS_TOKEN | LINE Notifications | จาก LINE Developers Console |
| LINE_GROUP_ID | LINE Notifications | Group ID ของกลุ่มที่ต้องการรับแจ้งเตือน |

(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY ถูกตั้งค่าอัตโนมัติโดย Lovable Cloud)

### 5. Database Schema สรุป
- ตารางหลัก 11 ตาราง: surveys, survey_questions, survey_responses, chat_sessions, chat_messages, coupon_campaigns, coupons, profiles, user_roles, admin_settings, admin_notifications, ui_settings, responses (legacy)

### 6. Edge Functions สรุป
- `chat` - AI Chatbot รู้ใจ (Streaming)
- `analyze-chat` - วิเคราะห์ Sentiment หลังจบแชท
- `ai-generate-questions` - AI สร้างคำถาม (Admin-only)
- `notify-new-response` - แจ้งเตือนเมื่อมีคำตอบใหม่
- `send-test-email` - ทดสอบระบบอีเมล

### 7. Routes/Pages สรุป

| Route | หน้า | สิทธิ์ |
|-------|------|--------|
| / | หน้าแรก (รายการแบบสำรวจ) | Public |
| /survey/:id | ตอบแบบสำรวจ | Public |
| /login | เข้าสู่ระบบ | Public |
| /register | สมัครสมาชิก | Public |
| /reset-password | รีเซ็ตรหัสผ่าน | Public |
| /my-coupons | คูปองของฉัน | Authenticated |
| /admin | Dashboard | Admin |
| /admin/surveys | จัดการแบบสำรวจ | Admin |
| /admin/surveys/:id/edit | แก้ไขแบบสำรวจ | Admin |
| /admin/chats | จัดการแชท | Admin |
| /admin/coupons | จัดการคูปอง | Admin |
| /admin/settings | ตั้งค่าระบบ | Admin |

---

## ไฟล์ที่ต้องแก้ไข

- **README.md** - เขียนใหม่ทั้งหมดด้วยเนื้อหาข้างต้น

## รายละเอียดทางเทคนิค

ไม่มีการแก้ไขโค้ดหรือ Database ใดๆ เป็นการอัปเดตเอกสารเพียงอย่างเดียว

