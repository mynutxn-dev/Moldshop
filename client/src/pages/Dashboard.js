import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiTool, FiClipboard, FiAlertTriangle, FiCheckCircle, FiClock, FiArrowRight } from 'react-icons/fi';
import { dashboardAPI } from '../services/api';
import { SkeletonDashboard } from '../components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const statusMap = {
  pending: { label: 'รอดำเนินการ', color: 'text-gray-600 bg-gray-100' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-orange-600 bg-orange-50' },
  completed: { label: 'เสร็จสิ้น', color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600 bg-red-50' },
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1 animate-count-up">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">ภาพรวมระบบจัดการแม่พิมพ์</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard title="แม่พิมพ์ทั้งหมด" value={m.total || 0} icon={FiBox} color="gradient-blue" subtitle={`พร้อมใช้งาน ${m.active || 0} ชุด`} />
        <StatCard title="รองานแจ้งซ่อม" value={mt.total || 0} icon={FiTool} color="gradient-orange" subtitle={`รอดำเนินการ ${mt.pending || 0} รายการ`} />
        <StatCard title="New Model" value={wo.total || 0} icon={FiClipboard} color="gradient-green" subtitle={`กำลังดำเนินการ ${wo.inProgress || 0}`} />
        <StatCard title="แม่พิมพ์ชำรุด" value={m.damaged || 0} icon={FiAlertTriangle} color="gradient-red" subtitle="ต้องดำเนินการ" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">งานแจ้งซ่อมล่าสุด</h3>
            <Link to="/maintenance" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              ดูทั้งหมด <FiArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingMT ? <div className="p-4 text-sm text-gray-400">กำลังดึงข้อมูล...</div> : recentMT.map((item) => {
              const s = statusMap[item.status] || statusMap.pending;
              return (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.mold?.moldCode || item.requestCode}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <div className="flex flex-wrap gap-x-2 mt-1 text-[10px] text-gray-400">
                      <span>แจ้ง: {item.reportDate ? new Date(item.reportDate).toLocaleDateString('th-TH') : new Date(item.createdAt).toLocaleDateString('th-TH')}</span>
                      <span>ผลิต: {item.productionDate ? new Date(item.productionDate).toLocaleDateString('th-TH') : '-'}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>
              );
            })}
            {!loadingMT && recentMT.length === 0 && <p className="p-4 text-sm text-gray-400">ไม่มีรายการ</p>}
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">New Model ล่าสุด</h3>
            <Link to="/work-orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              ดูทั้งหมด <FiArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingWO ? <div className="p-4 text-sm text-gray-400">กำลังดึงข้อมูล...</div> : recentWO.map((item) => {
              const s = statusMap[item.status] || statusMap.pending;
              return (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.orderCode}</p>
                    <p className="text-xs text-gray-500">{item.title} {item.assignedTo ? `— ${item.assignedTo.firstName}` : ''}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>
              );
            })}
            {!loadingWO && recentWO.length === 0 && <p className="p-4 text-sm text-gray-400">ไม่มีรายการ</p>}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
        {/* Mold Status Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">สถานะแม่พิมพ์</h3>
          <div className="flex items-center">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'พร้อมใช้งาน', value: m.active || 0 },
                      { name: 'ใช้งานอยู่', value: m.inUse || 0 },
                      { name: 'กำลังซ่อม', value: m.maintenance || 0 },
                      { name: 'ชำรุด', value: m.damaged || 0 },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={3} dataKey="value"
                  >
                    {['#22c55e', '#3b82f6', '#f97316', '#ef4444'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} ชุด`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3 ml-4">
              {[
                { label: 'พร้อมใช้งาน', value: m.active || 0, color: 'bg-green-500' },
                { label: 'ใช้งานอยู่', value: m.inUse || 0, color: 'bg-blue-500' },
                { label: 'กำลังซ่อม', value: m.maintenance || 0, color: 'bg-orange-500' },
                { label: 'ชำรุด', value: m.damaged || 0, color: 'bg-red-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance & Work Order Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">สรุปงานตามสถานะ</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'รอ', maintenance: mt.pending || 0, workOrder: wo.pending || 0 },
              { name: 'กำลังทำ', maintenance: mt.inProgress || 0, workOrder: wo.inProgress || 0 },
              { name: 'เสร็จ', maintenance: mt.completed || 0, workOrder: wo.completed || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="maintenance" name="งานแจ้งซ่อม" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="workOrder" name="New Model" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center space-x-6 mt-2 text-xs">
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-orange-500 mr-1.5" />งานแจ้งซ่อม</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-blue-500 mr-1.5" />New Model</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
