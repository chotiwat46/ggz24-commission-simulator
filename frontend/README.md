## ✅ ฟีเจอร์ที่เสร็จแล้ว (Completed)
- [x] **Login** — ล็อกอินเข้าสู่ระบบแยกตาม Role (Admin / Streamer)
- [x] **Dashboard** — สรุปยอดขายรวม (Total GMV) และ ค่าคอมมิชชันสุทธิ
- [x] **Commission Table** — ตารางแสดงผลค่าคอมมิชชันแบบเรียลไทม์
- [x] **Search & Filter** — ค้นหาชื่อสตรีมเมอร์ หรือ ชื่อช่องไลฟ์สดได้
- [x] **Export PDF** — ดาวน์โหลดใบสลิปค่าคอมมิชชันเป็นไฟล์ PDF

## ❌ ฟีเจอร์ที่ยังค้าง (Pending)
- [ ] ระบบอัปโหลดไฟล์ Excel เพื่อคำนวณอัตโนมัติ
- [ ] หน้าจัดการบัญชีผู้ใช้งาน (Manage Users)
- [ ] ประวัติการจ่ายเงินย้อนหลัง (Payment History)

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
- `backend/` : Node.js, Express + MySQL
- `frontend/` : React + Vite
- `data/` : เก็บไฟล์ `sample_commission.xlsx` (ตัวอย่างข้อมูลจำลอง)
- `docs/` : เอกสารและภาพหน้าจอหลักฐานการคำนวณ

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS (หรือ CSS ปกติ) |
| **Backend** | Node.js, Express |
| **Database** | MySQL |