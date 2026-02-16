# Feeldi – Feedback that feels right

ระบบสำรวจความพึงพอใจแบบไดนามิกที่เน้นการวัดความรู้สึก พร้อม AI Chatbot, ระบบสมาชิก/คูปอง และ Admin Dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| Backend | Lovable Cloud (Supabase) – Database, Auth, Edge Functions |
| AI | Google Gemini 2.0 Flash (Direct API) |
| Email | Resend API |
| Messaging | LINE Messaging API |

---

## ฟีเจอร์ทั้งหมด (7 ฟีเจอร์หลัก)

### 1. ระบบแบบสำรวจไดนามิก (Dynamic Survey)

- รองรับ 10 ประเภทคำถาม: slider, linear 1-5, emoji, single/multi choice, icon rating, short/long text, face slider, icon size scale
- Multi-survey: เปิดหลายแบบสำรวจพร้อมกัน
- ตั้งเวลาเปิด-ปิดอัตโนมัติ (Scheduling)
- Auto-Save Draft (localStorage + Debounce 500ms)
- ตอบแบบไม่ระบุตัวตน (Anonymous)
- QR Code สำหรับแชร์ลิงก์
- **Secrets**: ไม่มี

### 2. AI Chatbot "รู้ใจ" (Roo-Jai)

- บุคลิกเป็นพนักงานจริง พร้อม Persona Guard ป้องกัน Prompt Injection
- รองรับ 5 แผนก: แบบสำรวจ, ประกัน, อสังหาฯ, บริการลูกค้า, ทั่วไป
- Streaming response (SSE)
- วิเคราะห์ Sentiment อัตโนมัติหลังจบสนทนา (analyze-chat)
- เก็บข้อมูล Lead (ชื่อ, เบอร์, อีเมล)
- แจ้งเตือนแอดมินทันทีเมื่อลูกค้าไม่พอใจ
- **Secrets**: `GEMINI_API_KEY`

### 3. ระบบแจ้งเตือนอัตโนมัติ (Notifications)

- แจ้งเตือนผ่าน LINE Group Bot (Messaging API)
- แจ้งเตือนผ่าน Email (Resend API)
- เปิด/ปิดช่องทางได้ (LINE, Email)
- เปิด/ปิดประเภทได้ (ตอบแบบสอบถาม, คะแนนต่ำ, แชทใหม่)
- กระดิ่งแจ้งเตือน In-App แบบ Real-time
- ตรวจจับคะแนนต่ำรายข้อ (Per-question low score)
- **Secrets**: `RESEND_API_KEY`, `EMAIL_FROM`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_GROUP_ID`

### 4. AI สร้างคำถามอัตโนมัติ (AI Question Generator)

- สร้างคำถามจากบริบทที่ระบุ
- เลือกโทน (เป็นมิตร, สบายๆ, ทางการ)
- เลือกประเภทคำถามที่อนุญาต
- Admin-only (ตรวจสอบ RBAC)
- **Secrets**: `GEMINI_API_KEY`

### 5. ระบบสมาชิกและคูปอง (Membership & E-Coupon)

- ล็อกอินด้วย Email/Password หรือ Google OAuth
- รับคูปองอัตโนมัติหลังทำแบบสำรวจ
- หน้า "คูปองของฉัน" (`/my-coupons`) พร้อม QR Code
- Admin จัดการแคมเปญคูปอง (`/admin/coupons`)
- **Secrets**: ไม่มี (ใช้ built-in Auth)

### 6. Admin Dashboard

- Dashboard วิเคราะห์ข้อมูล (Distribution/Histogram, Median)
- Survey Builder + Import/Export JSON
- จัดการแชทและดู Sentiment Analysis
- จัดการคูปองและบันทึก Redeem
- สิทธิ์เฉพาะ Role "admin" (RBAC ผ่าน user_roles)
- **Secrets**: ไม่มี

### 7. ระบบธีมและ UI Settings

- โหมดมืด/สว่าง
- พื้นหลังแบบ สีพื้น/รูปภาพ/วิดีโอ
- เปิด/ปิดแอนิเมชัน
- บันทึกลง Database (ui_settings)

---

## Secrets / API Keys ที่ต้องตั้งค่า

| Secret | ใช้กับฟีเจอร์ | หมายเหตุ |
|--------|-------------|----------|
| `GEMINI_API_KEY` | AI Chatbot, AI Question Generator | ต้องเปิด Billing ใน Google Cloud |
| `RESEND_API_KEY` | Email Notifications | จาก resend.com |
| `EMAIL_FROM` | Email Notifications | ต้องเป็น Verified Domain เช่น `Feeldi <noreply@yourdomain.com>` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Notifications | จาก LINE Developers Console |
| `LINE_GROUP_ID` | LINE Notifications | Group ID ของกลุ่มที่ต้องการรับแจ้งเตือน |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ถูกตั้งค่าอัตโนมัติโดย Lovable Cloud

---

## Database Schema

ตารางหลัก 13 ตาราง:

| ตาราง | คำอธิบาย |
|-------|---------|
| `surveys` | ข้อมูลแบบสำรวจ |
| `survey_questions` | คำถามในแต่ละแบบสำรวจ |
| `survey_responses` | คำตอบของผู้ตอบแบบสำรวจ |
| `chat_sessions` | เซสชันการแชท |
| `chat_messages` | ข้อความในแชท |
| `coupon_campaigns` | แคมเปญคูปอง |
| `coupons` | คูปองที่ออกให้ผู้ใช้ |
| `profiles` | โปรไฟล์ผู้ใช้ |
| `user_roles` | สิทธิ์ผู้ใช้ (admin/user) |
| `admin_settings` | การตั้งค่าระบบ |
| `admin_notifications` | การแจ้งเตือน In-App |
| `ui_settings` | ตั้งค่าธีม UI |
| `responses` | คำตอบแบบสำรวจ (legacy) |

---

## Edge Functions

| Function | คำอธิบาย |
|----------|---------|
| `chat` | AI Chatbot รู้ใจ (Streaming SSE) |
| `analyze-chat` | วิเคราะห์ Sentiment หลังจบแชท |
| `ai-generate-questions` | AI สร้างคำถาม (Admin-only) |
| `notify-new-response` | แจ้งเตือนเมื่อมีคำตอบใหม่ |
| `send-test-email` | ทดสอบระบบอีเมล |

---

## Routes / Pages

| Route | หน้า | สิทธิ์ |
|-------|------|--------|
| `/` | หน้าแรก (รายการแบบสำรวจ) | Public |
| `/survey/:id` | ตอบแบบสำรวจ | Public |
| `/login` | เข้าสู่ระบบ | Public |
| `/register` | สมัครสมาชิก | Public |
| `/reset-password` | รีเซ็ตรหัสผ่าน | Public |
| `/my-coupons` | คูปองของฉัน | Authenticated |
| `/admin` | Dashboard | Admin |
| `/admin/surveys` | จัดการแบบสำรวจ | Admin |
| `/admin/surveys/:id/edit` | แก้ไขแบบสำรวจ | Admin |
| `/admin/chats` | จัดการแชท | Admin |
| `/admin/coupons` | จัดการคูปอง | Admin |
| `/admin/settings` | ตั้งค่าระบบ | Admin |
