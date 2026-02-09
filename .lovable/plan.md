

## อัปเดต GEMINI_API_KEY

### สิ่งที่ต้องทำ
อัปเดต Secret `GEMINI_API_KEY` ด้วย API Key ใหม่ที่เชื่อมกับ Google Cloud Billing Account แล้ว เพื่อแก้ปัญหา 429 Quota Exhausted

### ขั้นตอน
1. ใช้เครื่องมือ add_secret เพื่อขอ API Key ใหม่จากคุณ
2. คุณกรอก API Key ที่ได้จาก Google AI Studio (ที่เชื่อมกับ project ที่เปิด Billing แล้ว)
3. ระบบจะอัปเดต Secret ให้อัตโนมัติ และ Edge Functions ทั้งหมด (chat, analyze-chat, ai-generate-questions) จะใช้ key ใหม่ทันที

### สิ่งที่ต้องเตรียม
- API Key จาก Google AI Studio ที่อยู่ใน Google Cloud Project ที่เปิด Billing แล้ว
- ตรวจสอบว่า "Generative Language API" ถูก Enable ใน Google Cloud Console ของ project นั้น

