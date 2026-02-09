

## ระบบสมาชิก + E-Coupon สำหรับ Feeldi

### ภาพรวม
พัฒนาระบบที่เชื่อมต่อ "การทำแบบสอบถาม" กับ "ระบบสมาชิก" และ "คูปองส่วนลด" โดยแบ่งเป็น 3 เฟส

---

### Phase 1: ระบบล็อกอินด้วย Gmail (Google OAuth)

**สิ่งที่จะทำ:**
- เปิดใช้งาน Google OAuth ผ่าน Lovable Cloud
- สร้างหน้า "ล็อกอินเพื่อรับคูปอง" ที่จะแสดงหลังจาก submit แบบสอบถามสำเร็จ
- ปรับ flow หลัง submit: ThankYou -> แสดงปุ่ม "ล็อกอินด้วย Gmail เพื่อรับของรางวัล"
- เชื่อม Google account ของ user กับ survey_response ที่เพิ่ง submit (ผ่าน response_id ที่เก็บไว้)

**Flow ของ User:**
1. ทำแบบสอบถาม -> กดส่ง
2. หน้า ThankYou แสดง พร้อมปุ่ม "ล็อกอินด้วย Gmail เพื่อรับ E-Coupon"
3. User ล็อกอินด้วย Google
4. ระบบเชื่อม user_id กับ response -> ออกคูปองให้อัตโนมัติ
5. แสดงหน้า E-Coupon

---

### Phase 2: ระบบจัดการคูปอง (Admin)

**ตารางฐานข้อมูลใหม่:**

```text
coupon_campaigns (แคมเปญคูปอง)
+------------------+----------+----------------------------------+
| Column           | Type     | Description                      |
+------------------+----------+----------------------------------+
| id               | uuid     | PK                               |
| name             | text     | ชื่อแคมเปญ                        |
| description      | text     | รายละเอียด                        |
| discount_type    | text     | 'percentage' / 'fixed' / 'gift'  |
| discount_value   | numeric  | มูลค่าส่วนลด                      |
| code_prefix      | text     | เช่น "FEEL-"                     |
| max_uses         | integer  | จำนวนคูปองสูงสุด (null = ไม่จำกัด)  |
| used_count       | integer  | จำนวนที่ใช้แล้ว                    |
| is_active        | boolean  | เปิด/ปิดแคมเปญ                   |
| start_at         | timestamptz | เริ่มใช้งาน                    |
| expire_at        | timestamptz | หมดอายุ                       |
| survey_id        | uuid     | เชื่อมกับแบบสอบถาม (optional)      |
| conditions       | jsonb    | เงื่อนไขพิเศษ                     |
| created_at       | timestamptz | วันที่สร้าง                    |
+------------------+----------+----------------------------------+

coupons (คูปองที่ออกให้ user)
+------------------+----------+----------------------------------+
| Column           | Type     | Description                      |
+------------------+----------+----------------------------------+
| id               | uuid     | PK                               |
| campaign_id      | uuid     | FK -> coupon_campaigns           |
| user_id          | uuid     | FK -> auth.users (ผู้รับคูปอง)     |
| code             | text     | รหัสคูปอง unique เช่น "FEEL-A3X9" |
| status           | text     | 'active' / 'used' / 'expired'   |
| used_at          | timestamptz | เวลาที่ใช้คูปอง                 |
| response_id      | uuid     | FK -> survey_responses (optional)|
| created_at       | timestamptz | วันที่ออกคูปอง                  |
+------------------+----------+----------------------------------+
```

**หน้า Admin ใหม่ (/admin/coupons):**
- สร้าง/แก้ไขแคมเปญคูปอง (ชื่อ, ประเภทส่วนลด, มูลค่า, prefix, จำนวนสูงสุด, วันหมดอายุ, เชื่อมแบบสอบถาม)
- ช่องค้นหา/กรอกรหัสคูปองเพื่อตรวจสอบและ "ใช้คูปอง" (mark as used) อัตโนมัติ
- ตารางสรุป:
  - คูปองทั้งหมดที่ออก / ใช้แล้ว / ยังใช้ได้ / หมดอายุ
  - ชื่อ user / email / รหัสคูปอง / สถานะ / วันที่ใช้
- KPI Cards: จำนวนคูปองออกทั้งหมด, ใช้แล้ว, อัตราการใช้งาน (%)

**การ Generate คูปองอัตโนมัติ:**
- เมื่อ user ล็อกอินด้วย Gmail หลังทำแบบสอบถาม ระบบจะ:
  1. ตรวจสอบว่ามีแคมเปญที่ active และตรงเงื่อนไข
  2. Generate code แบบ random (prefix + 6 ตัวอักษร) เช่น "FEEL-K8M2X4"
  3. Insert เข้าตาราง coupons ให้ user คนนั้น

---

### Phase 3: หน้าสมาชิก (User Dashboard)

**หน้าใหม่ (/my-coupons):**
- แสดงคูปองที่ยังใช้ได้ (active) พร้อมรหัส QR Code
- แสดงคูปองที่ใช้แล้ว (used) / หมดอายุ (expired)
- แสดงรายละเอียดส่วนลด/ของรางวัลแต่ละใบ
- ปุ่ม Logout

**RLS Policies:**
- User เห็นเฉพาะคูปองของตัวเอง
- Admin เห็นทุกคูปองและจัดการแคมเปญได้
- ใครก็ได้สามารถ insert คูปอง (ผ่าน trigger/service role เท่านั้น)

---

### ลำดับการพัฒนา

| ลำดับ | งาน | Phase |
|-------|------|-------|
| 1 | ตั้งค่า Google OAuth | 1 |
| 2 | สร้างตาราง coupon_campaigns + coupons + RLS | 2 |
| 3 | ปรับ flow SurveyPage: หลัง submit แสดงปุ่ม Gmail Login | 1 |
| 4 | สร้างระบบ generate coupon อัตโนมัติหลัง login | 1+2 |
| 5 | สร้างหน้า E-Coupon แสดงผล (user เห็นคูปองตัวเอง) | 3 |
| 6 | สร้างหน้า Admin Coupons (จัดการแคมเปญ + ตาราง + ใช้คูปอง) | 2 |
| 7 | เพิ่มเมนู Coupons ใน AdminHeader | 2 |
| 8 | ทดสอบ flow ทั้งระบบ | ทั้งหมด |

---

### รายละเอียดทางเทคนิค

**ไฟล์ที่ต้องสร้างใหม่:**
- `src/pages/MyCoupons.tsx` - หน้าคูปองของ user
- `src/pages/AdminCoupons.tsx` - หน้าจัดการคูปอง admin
- `src/components/coupons/CouponCard.tsx` - แสดงคูปอง 1 ใบ
- `src/components/coupons/CampaignForm.tsx` - ฟอร์มสร้าง/แก้ไขแคมเปญ
- `src/components/coupons/RedeemCoupon.tsx` - ช่องกรอกรหัสเพื่อใช้คูปอง
- `src/components/coupons/CouponStats.tsx` - KPI cards
- `src/components/survey/PostSurveyLogin.tsx` - ปุ่ม Gmail login หลัง submit

**ไฟล์ที่ต้องแก้ไข:**
- `src/App.tsx` - เพิ่ม routes ใหม่ (/my-coupons, /admin/coupons)
- `src/pages/SurveyPage.tsx` - ปรับ flow หลัง submitted เป็น PostSurveyLogin
- `src/components/admin/AdminHeader.tsx` - เพิ่มเมนู "คูปอง"
- `src/contexts/AuthContext.tsx` - รองรับ Google OAuth user (ที่ไม่มี role เดิม)

**Database migrations:**
- สร้างตาราง `coupon_campaigns` + RLS
- สร้างตาราง `coupons` + RLS
- เพิ่มคอลัมน์ `user_id` ในตาราง `survey_responses` (optional, เชื่อม user กับ response)

**Google OAuth:**
- ใช้ `lovable.auth.signInWithOAuth("google")` ผ่าน Lovable Cloud managed solution
- ไม่ต้องตั้งค่า credentials เพิ่มเติม

