import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { SkeletonDashboard } from '../components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const statusMap = {
  pending: { label: 'รอดำเนินการ', tone: 'badge-warning' },
  in_progress: { label: 'กำลังดำเนินการ', tone: 'badge-info' },
  completed: { label: 'เสร็จสิ้น', tone: 'badge-success' },
  cancelled: { label: 'ยกเลิก', tone: 'badge-danger' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMT, setRecentMT] = useState([]);
  const [recentWO, setRecentWO] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMT, setLoadingMT] = useState(true);
  const [loadingWO, setLoadingWO] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error('Stats error:', err))
      .finally(() => setLoadingStats(false));

    dashboardAPI.getRecentMaintenance()
      .then(res => setRecentMT(res.data))
      .catch(err => console.error('MT error:', err))
      .finally(() => setLoadingMT(false));

    dashboardAPI.getRecentWorkOrders()
      .then(res => setRecentWO(res.data))
      .catch(err => console.error('WO error:', err))
      .finally(() => setLoadingWO(false));
  }, []);

  if (loadingStats && loadingMT && loadingWO) return <SkeletonDashboard />;

  const m = stats?.molds || {};
  const mt = stats?.maintenance || {};
  const wo = stats?.workOrders || {};
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const totalPending = (mt.pending || 0) + (wo.pending || 0);

  const pieData = [
    { name: 'พร้อมใช้งาน', value: m.active || 0, color: '#2563eb' },
    { name: 'ใช้งานอยู่', value: m.inUse || 0, color: '#6366f1' },
    { name: 'กำลังซ่อม', value: m.maintenance || 0, color: '#14b8a6' },
    { name: 'ชำรุด', value: m.damaged || 0, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const quickNums = [
    { value: m.total || 0, label: 'แม่พิมพ์ทั้งหมด', color: '#4a7cff', sparkPoints: '0,20 10,16 20,18 30,14 40,16 50,12 60,10' },
    { value: m.active || 0, label: 'พร้อมใช้งาน', color: '#22d3b0', sparkPoints: '0,22 10,18 20,20 30,10 40,12 50,6 60,4' },
    { value: mt.total || 0, label: 'งานแจ้งซ่อมรวม', color: '#a78bfa', sparkPoints: '0,20 10,22 20,18 30,20 40,15 50,18 60,14' },
    { value: wo.total || 0, label: 'New Model', color: '#f59e0b', sparkPoints: '0,22 10,14 20,18 30,12 40,16 50,10 60,14' },
  ];

  const statusCards = [
    {
      key: 'mt-pending',
      num: mt.pending || 0,
      label: 'รอดำเนินการ (ซ่อม)',
      iconClass: 'icon-orange',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      chart: (
        <svg className="db-mini-chart" viewBox="0 0 180 50" fill="none">
          <defs><linearGradient id="g-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></linearGradient></defs>
          <polygon points="0,40 30,35 60,38 90,25 120,30 150,18 180,22 180,50 0,50" fill="url(#g-orange)" />
          <polyline points="0,40 30,35 60,38 90,25 120,30 150,18 180,22" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      key: 'wo-progress',
      num: wo.inProgress || 0,
      label: 'กำลังดำเนินการ (New Model)',
      iconClass: 'icon-blue',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      chart: (
        <svg className="db-mini-chart" viewBox="0 0 180 50" fill="none">
           <rect x="10" y="30" width="18" height="20" rx="3" fill="#c7d8ff" />
           <rect x="38" y="20" width="18" height="30" rx="3" fill="#a5beff" />
           <rect x="66" y="35" width="18" height="15" rx="3" fill="#c7d8ff" />
           <rect x="94" y="15" width="18" height="35" rx="3" fill="#4a7cff" />
           <rect x="122" y="25" width="18" height="25" rx="3" fill="#c7d8ff" />
           <rect x="150" y="10" width="18" height="40" rx="3" fill="#7aa0ff" />
        </svg>
      )
    },
    {
      key: 'm-damaged',
      num: m.damaged || 0,
      label: 'แม่พิมพ์ชำรุด',
      iconClass: 'icon-purple',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      chart: (
        <svg className="db-mini-chart" viewBox="0 0 180 50" fill="none">
          <defs><linearGradient id="g-purple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/></linearGradient></defs>
          <polygon points="0,40 40,38 80,36 100,34 140,30 180,20 180,50 0,50" fill="url(#g-purple)" />
          <polyline points="0,40 40,38 80,36 100,34 140,30 180,20" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <div className="db-wrapper">
      <div className="db-section-title">ภาพรวมระบบ (Overview)</div>
      
      {/* ── QUICK STATS ROW ─────────────────────────────────── */}
      <div className="db-quick-stats-row">
        <div className="db-glass-card">
          <div className="db-nums-grid">
            {quickNums.map((item) => (
              <div className="db-num-item" key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="db-num-value">{item.value}</div>
                    <div className="db-num-label">{item.label}</div>
                  </div>
                  <svg className="db-sparkline" viewBox="0 0 60 28" fill="none">
                    <polyline points={item.sparkPoints} stroke={item.color} strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Card */}
        <div className="db-welcome-card">
          <div>
            <div className="db-welcome-text">
              <h2>สวัสดี,<br />{user?.firstName || user?.username || 'ผู้ใช้งาน'}</h2>
              <p className="db-welcome-role">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</p>
            </div>
            <div className="db-welcome-btns" style={{ marginTop: '1rem' }}>
              <Link to="/maintenance" className="db-btn-blue">เปิดงานแจ้งซ่อม</Link>
              <Link to="/work-orders" className="db-btn-teal">ตรวจสอบ New Model</Link>
            </div>
          </div>
          {/* SVG Illustration Placeholder */}
          <svg width="110" height="90" viewBox="0 0 110 90" fill="none" className="db-welcome-illus">
            <rect x="10" y="65" width="90" height="6" rx="3" fill="#c7d8f8" />
            <rect x="30" y="38" width="36" height="26" rx="4" fill="#7baaf7" />
            <rect x="33" y="41" width="30" height="18" rx="2" fill="#b8d0ff" />
            <circle cx="72" cy="38" r="8" fill="#f4c2a1" />
            <rect x="64" y="46" width="16" height="20" rx="5" fill="#4a7cff" />
            <rect x="76" y="22" width="28" height="14" rx="6" fill="#e0eaff" />
          </svg>
        </div>
      </div>

      {/* ── MAIN STATUS GRID ─────────────────────────────────── */}
      <div className="db-section-title" style={{ marginTop: '1.5rem' }}>รายการที่ต้องติดตาม (Action Required)</div>
      <div className="db-status-grid">
        {statusCards.map((card, i) => (
          <div className="db-status-card" key={card.key} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="db-status-card-header">
              <div>
                <div className="db-status-num">{card.num}</div>
                <div className="db-status-label">{card.label}</div>
              </div>
              <div className={`db-status-icon ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
            {card.chart}
          </div>
        ))}
      </div>

      {/* ── CHARTS ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">สถานะแม่พิมพ์</h2>
              <p className="card-subtitle">สัดส่วนความพร้อมใช้งาน</p>
            </div>
          </div>
          <div style={{ height: '240px', padding: '1rem' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((item) => <Cell key={item.name} fill={item.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '18px', border: '1px solid rgba(148, 163, 184, 0.24)', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted text-center" style={{ marginTop: '5rem' }}>ไม่มีข้อมูล</p>}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">ปริมาณงาน</h2>
              <p className="card-subtitle">เปรียบเทียบตามสถานะ</p>
            </div>
          </div>
          <div style={{ height: '240px', padding: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'รอ', mt: mt.pending || 0, wo: wo.pending || 0 },
                { name: 'ดำเนินการ', mt: mt.inProgress || 0, wo: wo.inProgress || 0 },
                { name: 'เสร็จ', mt: mt.completed || 0, wo: wo.completed || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="mt" name="ซ่อม" fill="#4a7cff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wo" name="New Model" fill="#22d3b0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── TABLES ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">งานแจ้งซ่อมหน้าใหม่</h2>
              <p className="card-subtitle">รายการที่ต้องติดตาม</p>
            </div>
            <Link to="/maintenance" className="btn btn-secondary btn-sm">รับงานทั้งหมด</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>รหัส</th><th>แม่พิมพ์</th><th>สถานะ</th></tr></thead>
              <tbody>
                {recentMT.length > 0 ? recentMT.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{item.requestCode}</td>
                    <td>{item.mold?.moldCode || '-'}</td>
                    <td><span className={`badge ${statusMap[item.status]?.tone || 'badge-info'}`}>{statusMap[item.status]?.label || item.status}</span></td>
                  </tr>
                )) : <tr><td colSpan="3" className="text-center text-muted">ไม่มีคำร้อง</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">New Model ที่ดำเนินการ</h2>
              <p className="card-subtitle">กิจกรรมสร้างแม่พิมพ์</p>
            </div>
            <Link to="/work-orders" className="btn btn-secondary btn-sm">อัปเดตงาน</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>รหัส</th><th>รายละเอียด</th><th>สถานะ</th></tr></thead>
              <tbody>
                {recentWO.length > 0 ? recentWO.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{item.orderCode}</td>
                    <td>{item.title}</td>
                    <td><span className={`badge ${statusMap[item.status]?.tone || 'badge-info'}`}>{statusMap[item.status]?.label || item.status}</span></td>
                  </tr>
                )) : <tr><td colSpan="3" className="text-center text-muted">ไม่มีคำสั่งทำแม่พิมพ์ใหม่</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
