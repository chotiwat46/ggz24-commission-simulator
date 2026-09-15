const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL (XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Username เริ่มต้นของ XAMPP
    password: '',      // Password เริ่มต้นของ XAMPP จะปล่อยว่างไว้
    database: 'live_commission' // ชื่อ Database ที่เราสร้างไว้
});

// ทดสอบการเชื่อมต่อ
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL database successfully!');
});

// API สำหรับดึงข้อมูลผู้ใช้งานทั้งหมด
app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, username, role FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

// API สำหรับดึงข้อมูลค่าคอมมิชชัน (พร้อมชื่อพนักงาน)
app.get('/api/commissions', (req, res) => {
    // ใช้คำสั่ง JOIN เพื่อเชื่อมตาราง commissions เข้ากับตาราง users
    const sql = `
        SELECT c.id, u.username, c.channel_name, c.gmv_amount, c.commission_rate, c.commission_amount, c.month_year 
        FROM commissions c
        JOIN users u ON c.user_id = u.id
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching commissions:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

// API สำหรับเข้าสู่ระบบ (Login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT id, username, role FROM users WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // ส่งข้อมูลผู้ใช้กลับไป (รวมถึง Role และ ID)
        res.json({ message: 'Login successful', user: results[0] });
    });
});

const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' }); // กำหนดโฟลเดอร์ชั่วคราวสำหรับเก็บไฟล์ที่อัปโหลด

// API สำหรับอัปโหลดไฟล์ยอดขายและคำนวณอัตโนมัติ
app.post('/api/upload-sales', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    try {
        // อ่านไฟล์ Excel หรือ CSV ที่อัปโหลดเข้ามา
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // โครงสร้างไฟล์ที่คาดหวังใน Excel: user_id, channel_name, gmv_amount, month_year
        let successCount = 0;

        sheetData.forEach((row) => {
            const userId = row.user_id;
            const channelName = row.channel_name;
            const gmv = parseFloat(row.gmv_amount) || 0;
            const rate = 2.00; // เรตคอมมิชชันมาตรฐาน 2%
            const commission = gmv * (rate / 100);
            const monthYear = row.month_year || '09/2026';

            // บันทึกลงฐานข้อมูล MySQL
            const sql = `
                INSERT INTO commissions (user_id, channel_name, gmv_amount, commission_rate, commission_amount, month_year) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.query(sql, [userId, channelName, gmv, rate, commission, monthYear], (err) => {
                if (err) console.error('Insert error:', err);
            });
            successCount++;
        });

        res.json({ message: `Successfully processed ${successCount} rows and calculated commissions!` });
    } catch (err) {
        console.error('File processing error:', err);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// API ดึงรายชื่อผู้ใช้งานทั้งหมด
app.get('/api/users', (req, res) => {
    const sql = "SELECT id, username, display_name, role FROM users";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API เพิ่มผู้ใช้งานใหม่
app.post('/api/users', (req, res) => {
    const { username, password, display_name, role } = req.body;
    if (!username || !password || !display_name || !role) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    const sql = "INSERT INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [username, password, display_name, role], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User added successfully!', userId: result.insertId });
    });
});

// API ลบผู้ใช้งานตาม ID
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully!' });
    });
});

// สั่งให้ Server เริ่มทำงาน
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});