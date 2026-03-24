import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiTool, FiClipboard, FiAlertTriangle, FiCheckCircle, FiClock, FiArrowRight } from 'react-icons/fi';
import { dashboardAPI } from '../services/api';
import { SkeletonDashboard } from '../components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const statusMap = {
  pending: { label: 'รอดำเนินการ', tone: 'status-pill-pending' },
  in_progress: { label: 'กำลังดำเนินการ', tone: 'status-pill-progress' },
  completed: { label: 'เสร็จสิ้น', tone: 'status-pill-completed' },
  cancelled: { label: 'ยกเลิก', tone: 'status-pill-cancelled' },
};

const StatCard = ({ title, value, icon: Icon, tone = 'primary', subtitle }) => (
  <div className={`metric-card metric-card--${tone} animate-fade-in-up`}>
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
        {subtitle && <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      <div className="metric-card-icon">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
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
    { name: 'ใช้งานอยู่', value: m.inUse || 0, color: '#0f172a' },
    { name: 'กำลังซ่อม', value: m.maintenance || 0, color: '#14b8a6' },
    { name: 'ชำรุด', value: m.damaged || 0, color: '#f59e0b' },
  ].filter((item) => item.value > 0);
  const todayLabel = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="dashboard-hero animate-fade-in-up">
        <div className="dashboard-hero-grid">
          <div>
            <span className="hero-badge">Moldshop Command Center</span>
            <h1 className="hero-title">ติดตามวงจรแม่พิมพ์ งานซ่อม และ New Model จากมุมมองเดียว</h1>
            <p className="hero-subtitle">
              สวัสดี {user.firstName || 'ทีมงาน'} • วันนี้ {todayLabel} คุณสามารถเห็นแม่พิมพ์ที่พร้อมใช้งาน งานที่กำลังรอ และรายการที่ต้องตัดสินใจได้ทันที
            </p>
            <div className="hero-action-row">
              <Link to="/maintenance" className="btn-primary">เปิดงานแจ้งซ่อม</Link>
              <Link to="/work-orders" className="hero-button-secondary">ดู New Model</Link>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hero-metric-top">
                <span>แม่พิมพ์พร้อมใช้งาน</span>
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <strong>{m.active || 0}</strong>
              <p>จากทั้งหมด {m.total || 0} ชุดในระบบ</p>
            </div>
            <div className="hero-metric">
              <div className="hero-metric-top">
                <span>งานที่รอดำเนินการ</span>
                <FiClock className="h-5 w-5" />
              </div>
              <strong>{totalPending}</strong>
              <p>รวมงานแจ้งซ่อมและ New Model ที่ยังไม่ปิด</p>
            </div>
            <div className="hero-metric">
              <div className="hero-metric-top">
                <span>แม่พิมพ์ที่ต้องติดตาม</span>
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <strong>{(m.maintenance || 0) + (m.damaged || 0)}</strong>
              <p>กำลังซ่อม {m.maintenance || 0} • ชำรุด {m.damaged || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="แม่พิมพ์ทั้งหมด" value={m.total || 0} icon={FiBox} tone="primary" subtitle={`พร้อมใช้งาน ${m.active || 0} ชุด`} />
        <StatCard title="รองานแจ้งซ่อม" value={mt.total || 0} icon={FiTool} tone="warning" subtitle={`รอดำเนินการ ${mt.pending || 0} รายการ`} />
        <StatCard title="New Model" value={wo.total || 0} icon={FiClipboard} tone="success" subtitle={`กำลังดำเนินการ ${wo.inProgress || 0}`} />
        <StatCard title="แม่พิมพ์ชำรุด" value={m.damaged || 0} icon={FiAlertTriangle} tone="danger" subtitle="ต้องดำเนินการ" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Maintenance */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-base font-semibold text-slate-950">งานแจ้งซ่อมล่าสุด</h3>
              <p className="mt-1 text-sm text-slate-500">เรียงจากรายการล่าสุดที่ทีมต้องติดตาม</p>
            </div>
            <Link to="/maintenance" className="panel-link">
              ดูทั้งหมด <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="list-stack">
            {loadingMT ? <div className="list-row"><p className="empty-copy">กำลังดึงข้อมูล...</p></div> : recentMT.map((item) => {
              const s = statusMap[item.status] || statusMap.pending;
              return (
                <div key={item.id} className="list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{item.mold?.moldCode || item.requestCode}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    <div className="list-meta">
                      <span>แจ้ง: {item.reportDate ? new Date(item.reportDate).toLocaleDateString('th-TH') : new Date(item.createdAt).toLocaleDateString('th-TH')}</span>
                      <span>ผลิต: {item.productionDate ? new Date(item.productionDate).toLocaleDateString('th-TH') : '-'}</span>
                    </div>
                  </div>
                  <span className={`status-pill ${s.tone}`}>{s.label}</span>
                </div>
              );
            })}
            {!loadingMT && recentMT.length === 0 && <div className="list-row"><p className="empty-copy">ไม่มีรายการงานแจ้งซ่อมล่าสุด</p></div>}
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-base font-semibold text-slate-950">New Model ล่าสุด</h3>
              <p className="mt-1 text-sm text-slate-500">ติดตามลำดับงานที่กำลังขยับอยู่ในระบบ</p>
            </div>
            <Link to="/work-orders" className="panel-link">
              ดูทั้งหมด <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="list-stack">
            {loadingWO ? <div className="list-row"><p className="empty-copy">กำลังดึงข้อมูล...</p></div> : recentWO.map((item) => {
              const s = statusMap[item.status] || statusMap.pending;
              return (
                <div key={item.id} className="list-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{item.orderCode}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.title} {item.assignedTo ? `— ${item.assignedTo.firstName}` : ''}</p>
                  </div>
                  <span className={`status-pill ${s.tone}`}>{s.label}</span>
                </div>
              );
            })}
            {!loadingWO && recentWO.length === 0 && <div className="list-row"><p className="empty-copy">ไม่มีรายการ New Model ล่าสุด</p></div>}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 animate-fade-in-up">
        {/* Mold Status Donut Chart */}
        <div className="panel-card p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-950">สถานะแม่พิมพ์</h3>
            <p className="mt-1 text-sm text-slate-500">ภาพรวมความพร้อมของแม่พิมพ์ในระบบ</p>
          </div>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
            <div className="mx-auto h-56 w-56 xl:mx-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((item) => <Cell key={item.name} fill={item.color} stroke="none" />)}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value} ชุด`}
                      contentStyle={{
                        borderRadius: '18px',
                        border: '1px solid rgba(148, 163, 184, 0.24)',
                        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  ไม่มีข้อมูลสถานะ
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {pieData.length > 0 ? pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-950">{item.value}</span>
                </div>
              )) : <p className="empty-copy">ยังไม่มีข้อมูลแม่พิมพ์ให้สรุปในกราฟ</p>}
            </div>
          </div>
        </div>

        {/* Maintenance & Work Order Bar Chart */}
        <div className="panel-card p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-950">สรุปงานตามสถานะ</h3>
            <p className="mt-1 text-sm text-slate-500">เปรียบเทียบปริมาณงานแจ้งซ่อมและ New Model ในแต่ละสถานะ</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'รอ', maintenance: mt.pending || 0, workOrder: wo.pending || 0 },
              { name: 'กำลังทำ', maintenance: mt.inProgress || 0, workOrder: wo.inProgress || 0 },
              { name: 'เสร็จ', maintenance: mt.completed || 0, workOrder: wo.completed || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '18px',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)'
                }}
              />
              <Bar dataKey="maintenance" name="งานแจ้งซ่อม" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="workOrder" name="New Model" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend mt-4">
            <span><span className="chart-legend-dot" style={{ backgroundColor: '#2563eb' }}></span>งานแจ้งซ่อม</span>
            <span><span className="chart-legend-dot" style={{ backgroundColor: '#14b8a6' }}></span>New Model</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
