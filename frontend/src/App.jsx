import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('streamer');
  const [userMsg, setUserMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        fetchCommissions();
        fetchUsers();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to server');
    }
  };

  const fetchCommissions = () => {
    fetch('http://localhost:3000/api/commissions')
      .then(res => res.json())
      .then(data => setCommissions(data))
      .catch(err => console.error('Error fetching commissions:', err));
  };

  const fetchUsers = () => {
    fetch('http://localhost:3000/api/users')
      .then(res => res.json())
      .then(data => setUsersList(data))
      .catch(err => console.error('Error fetching users:', err));
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setCommissions([]);
    setUsersList([]);
    setSearchTerm('');
    setActiveTab('dashboard');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:3000/api/upload-sales', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage(data.message);
        setSelectedFile(null);
        fetchCommissions();
      } else {
        setUploadMessage(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage('Error uploading file');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, display_name: newDisplayName, role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUserMsg('เพิ่มผู้ใช้งานสำเร็จ!');
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        fetchUsers();
      } else {
        setUserMsg(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error('Add user error:', err);
      setUserMsg('Error connecting to server');
    }
  };

  // 🌟 ฟังก์ชันลบผู้ใช้งาน
  const handleDeleteUser = async (id) => {
    if (!window.confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUserMsg('ลบผู้ใช้งานสำเร็จ!');
        fetchUsers();
      } else {
        setUserMsg('ไม่สามารถลบผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setUserMsg('Error connecting to server');
    }
  };

  const handleDownloadPDF = (item) => {
    const slipElement = document.createElement('div');
    slipElement.style.padding = '30px';
    slipElement.style.width = '500px';
    slipElement.style.background = '#ffffff';
    slipElement.style.fontFamily = 'sans-serif';
    slipElement.style.color = '#333';
    slipElement.innerHTML = `
      <h2 style="text-align: center; color: #1f2937; margin-bottom: 5px;">🏢 บริษัท ไลฟ์สตรีมมิ่ง จำกัด</h2>
      <div style="text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 25px;">ใบแจ้งยอดค่าคอมมิชชันประจำเดือน ${item.month_year}</div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;"><span>ชื่อสตรีมเมอร์:</span> <b>${item.display_name}</b></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;"><span>ช่องไลฟ์สด:</span> <b>${item.channel_name}</b></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;"><span>ยอดขายสุทธิ (GMV):</span> <b>${Number(item.gmv_amount).toLocaleString()} บาท</b></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;"><span>อัตราเรทคอมมิชชัน:</span> <b>${item.commission_rate}%</b></div>
      </div>

      <div style="display: flex; justify-content: space-between; border-top: 2px solid #10b981; padding-top: 15px; font-weight: bold; font-size: 16px; color: #10b981;">
        <span>ค่าคอมมิชชันสุทธิที่ได้รับ:</span>
        <span>${Number(item.commission_amount).toLocaleString()} บาท</span>
      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af;">เอกสารดิจิทัลสร้างจากระบบ Automated Commission Dashboard</div>
    `;

    document.body.appendChild(slipElement);

    html2canvas(slipElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Commission_Payslip_${item.display_name}_${item.month_year.replace('/', '-')}.pdf`);
      
      document.body.removeChild(slipElement);
    });
  };

  const filteredCommissions = commissions.filter(item => {
    const matchRole = user?.role === 'admin' || item.display_name === user?.display_name;
    const matchSearch = item.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.channel_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalGMV = filteredCommissions.reduce((sum, item) => sum + Number(item.gmv_amount), 0);
  const totalCommission = filteredCommissions.reduce((sum, item) => sum + Number(item.commission_amount), 0);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>🔐 Streamer Login</h2>
          {error && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_main หรือ streamer_a" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="123456" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>เข้าสู่ระบบ</button>
          </form>
          <div style={{ marginTop: '20px', fontSize: '13px', color: '#666', textAlign: 'center' }}>
            * แอดมิน: <b>admin_main</b> / 123456<br/>* สตรีมเมอร์: <b>streamer_a</b> / 123456
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#f9fafb', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px', gap: '15px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>📊 Automated Commission Dashboard</h2>
            <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>ผู้ใช้งาน: <b>{user.display_name}</b> ({user.role === 'admin' ? '👑 ผู้ดูแลระบบ' : '🎙️ สตรีมเมอร์'})</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>ออกจากระบบ</button>
        </div>

        {/* เมนูแท็บเฉพาะแอดมิน */}
        {user.role === 'admin' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              style={{ padding: '10px 20px', backgroundColor: activeTab === 'dashboard' ? '#2563eb' : '#e5e7eb', color: activeTab === 'dashboard' ? 'white' : '#374151', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📈 แดชบอร์ดและยอดขาย
            </button>
            <button 
              onClick={() => { setActiveTab('users'); fetchUsers(); }} 
              style={{ padding: '10px 20px', backgroundColor: activeTab === 'users' ? '#2563eb' : '#e5e7eb', color: activeTab === 'users' ? 'white' : '#374151', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              👥 จัดการบัญชีผู้ใช้งานระบบ
            </button>
          </div>
        )}

        {user.role === 'streamer' && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#1e40af', fontSize: '14px' }}>
            🔒 <b>Data Privacy Protected:</b> ระบบแสดงผลเฉพาะข้อมูลค่าคอมมิชชันและยอดขายของบัญชีคุณเท่านั้น
          </div>
        )}

        {/* หน้าแดชบอร์ดหลัก */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: 0.9 }}>📦 ยอดขายรวม (Total GMV)</p>
                <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>{totalGMV.toLocaleString()} ฿</h3>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: 0.9 }}>💰 ค่าคอมมิชชันสุทธิ (Total Payout)</p>
                <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>{totalCommission.toLocaleString()} ฿</h3>
              </div>
            </div>

            {user.role === 'admin' && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#374151' }}>📂 อัปโหลดไฟล์ยอดขายประจำเดือน (Excel/CSV)</h3>
                <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
                  <button type="submit" style={{ padding: '9px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>อัปโหลดและคำนวณอัตโนมัติ</button>
                </form>
                {uploadMessage && <p style={{ marginTop: '10px', color: '#059669', fontSize: '14px', fontWeight: 'bold' }}>{uploadMessage}</p>}
              </div>
            )}

            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <input 
                type="text" 
                placeholder="🔍 ค้นหาชื่อสตรีมเมอร์ หรือ ชื่อช่องไลฟ์สด..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', maxWidth: '300px', padding: '10px 15px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ width: '100%', overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 15px' }}>ID</th>
                    <th style={{ padding: '12px 15px' }}>ชื่อสตรีมเมอร์</th>
                    <th style={{ padding: '12px 15px' }}>ชื่อช่องไลฟ์สด</th>
                    <th style={{ padding: '12px 15px' }}>ยอดขาย (GMV)</th>
                    <th style={{ padding: '12px 15px' }}>เรทคอมฯ (%)</th>
                    <th style={{ padding: '12px 15px' }}>ค่าคอมมิชชันที่ได้</th>
                    <th style={{ padding: '12px 15px' }}>ประจำเดือน</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.length > 0 ? (
                    filteredCommissions.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px 15px' }}>{item.id}</td>
                        <td style={{ padding: '12px 15px' }}><b>{item.display_name}</b></td>
                        <td style={{ padding: '12px 15px' }}>{item.channel_name}</td>
                        <td style={{ padding: '12px 15px' }}>{Number(item.gmv_amount).toLocaleString()} ฿</td>
                        <td style={{ padding: '12px 15px' }}>{item.commission_rate}%</td>
                        <td style={{ padding: '12px 15px', color: '#16a34a', fontWeight: 'bold' }}>{Number(item.commission_amount).toLocaleString()} ฿</td>
                        <td style={{ padding: '12px 15px' }}>{item.month_year}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDownloadPDF(item)}
                            style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                        >
                            📥 โหลด PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>ไม่พบข้อมูลที่คุณค้นหา</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* หน้าจัดการบัญชีผู้ใช้งาน (User Management) พร้อมปุ่มลบ */}
        {activeTab === 'users' && user.role === 'admin' && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>➕ เพิ่มบัญชีพนักงาน / สตรีมเมอร์ใหม่</h3>
            <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <input type="text" placeholder="Username (เช่น streamer_b)" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
              <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
              <input type="text" placeholder="ชื่อที่แสดง (Display Name)" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="streamer">Streamer</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', gridColumn: '1 / -1' }}>บันทึกผู้ใช้งานใหม่</button>
            </form>
            {userMsg && <p style={{ color: '#059669', fontWeight: 'bold', marginBottom: '20px' }}>{userMsg}</p>}

            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>📋 รายชื่อบัญชีทั้งหมดในระบบ</h3>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 15px' }}>ID</th>
                    <th style={{ padding: '12px 15px' }}>Username</th>
                    <th style={{ padding: '12px 15px' }}>ชื่อที่แสดง</th>
                    <th style={{ padding: '12px 15px' }}>สิทธิ์การใช้งาน (Role)</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 15px' }}>{u.id}</td>
                      <td style={{ padding: '12px 15px' }}><b>{u.username}</b></td>
                      <td style={{ padding: '12px 15px' }}>{u.display_name}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: u.role === 'admin' ? '#fee2e2' : '#dcfce7', color: u.role === 'admin' ? '#991b1b' : '#166534', fontWeight: 'bold', fontSize: '12px' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        {u.username !== 'admin_main' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            🗑️ ลบ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;