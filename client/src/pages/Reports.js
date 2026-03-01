import React, { useState, useEffect } from 'react';
import { FiDownload, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { moldsAPI, maintenanceAPI, workOrdersAPI } from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [moldStats, setMoldStats] = useState({ total: 0, active: 0, inUse: 0, maintenance: 0, damaged: 0 });
  const [mtStats, setMtStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [woStats, setWoStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [molds, setMolds] = useState([]);
  const [mtItems, setMtItems] = useState([]);
  const [woItems, setWoItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [moldsRes, mtRes, woRes] = await Promise.all([
          moldsAPI.getAll({ limit: 200 }),
          maintenanceAPI.getAll({ limit: 200 }),
          workOrdersAPI.getAll({ limit: 200 }),
        ]);
        const m = moldsRes.data.molds;
        setMolds(m);
        setMoldStats({
          total: m.length,
          active: m.filter(x => x.status === 'active').length,
          inUse: m.filter(x => x.status === 'in_use').length,
          maintenance: m.filter(x => x.status === 'maintenance').length,
          damaged: m.filter(x => x.status === 'damaged').length,
        });
        const mt = mtRes.data.requests;
        setMtItems(mt);
        setMtStats({
          total: mt.length,
          pending: mt.filter(x => x.status === 'pending').length,
          inProgress: mt.filter(x => x.status === 'in_progress').length,
          completed: mt.filter(x => x.status === 'completed').length,
        });
        const wo = woRes.data.workOrders;
        setWoItems(wo);
        setWoStats({
          total: wo.length,
          pending: wo.filter(x => x.status === 'pending').length,
          inProgress: wo.filter(x => x.status === 'in_progress').length,
          completed: wo.filter(x => x.status === 'completed').length,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // Group molds by customer
  const customerGroups = molds.reduce((acc, m) => {
    const c = m.customer || 'ไม่ระบุ';
    if (!acc[c]) acc[c] = { customer: c, active: 0, inUse: 0, maintenance: 0, damaged: 0, total: 0 };
    acc[c][m.status === 'in_use' ? 'inUse' : (m.status || 'active')]++;
    acc[c].total++;
    return acc;
  }, {});
  const customerRows = Object.values(customerGroups).sort((a, b) => b.total - a.total);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    // Sheet 1: Molds
    const moldData = molds.map(m => ({
      'รหัส': m.moldCode, 'ชื่อ': m.name, 'ลูกค้า': m.customer, 'สถานะ': m.status,
      'Mold Size': m.machineType || '', 'ตำแหน่ง': m.location || '',
      'Shot Count': m.shotCount || 0, 'Max Shot': m.maxShot || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(moldData), 'แม่พิมพ์');
    // Sheet 2: Maintenance
    const mtData = mtItems.map(m => ({
      'เลขที่': m.requestCode, 'แม่พิมพ์': m.mold?.moldCode || '', 'ประเภท': m.type,
      'รายละเอียด': m.description, 'ความเร่งด่วน': m.priority, 'สถานะ': m.status,
      'กำหนด': m.dueDate || '', 'ผู้รับผิดชอบ': m.assignedTo ? `${m.assignedTo.firstName} ${m.assignedTo.lastName}` : '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mtData), 'งานแจ้งซ่อม');
    // Sheet 3: Work Orders
    const woData = woItems.map(w => ({
      'เลขที่': w.orderCode, 'ชื่องาน': w.title, 'แม่พิมพ์': w.mold?.moldCode || '',
      'ประเภท': w.type, 'สถานะ': w.status, 'ความคืบหน้า': `${w.progress || 0}%`,
      'กำหนด': w.dueDate || '', 'ผู้รับผิดชอบ': w.assignedTo ? `${w.assignedTo.firstName} ${w.assignedTo.lastName}` : '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(woData), 'New Model');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `Moldshop_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Export สำเร็จ');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">กำลังโหลดข้อมูล...</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-500 mt-1">สรุปข้อมูลสถิติและรายงานต่างๆ</p>
        </div>
        <button onClick={handleExport} className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          <FiDownload className="mr-2 h-4 w-4" /> Export Excel
        </button>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">สรุปแม่พิมพ์</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ทั้งหมด</span>
              <span className="font-semibold text-gray-900">{moldStats.total} ชุด</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">พร้อมใช้งาน</span>
              <span className="font-semibold text-green-600">{moldStats.active} ชุด</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">กำลังซ่อม / ชำรุด</span>
              <span className="font-semibold text-red-600">{moldStats.maintenance + moldStats.damaged} ชุด</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiPieChart className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">สรุปงานแจ้งซ่อม</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ทั้งหมด</span>
              <span className="font-semibold text-gray-900">{mtStats.total} รายการ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">เสร็จสิ้น</span>
              <span className="font-semibold text-green-600">{mtStats.completed} รายการ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ค้างดำเนินการ</span>
              <span className="font-semibold text-orange-600">{mtStats.pending + mtStats.inProgress} รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">สรุป New Model</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ทั้งหมด</span>
              <span className="font-semibold text-gray-900">{woStats.total} รายการ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">เสร็จสิ้น</span>
              <span className="font-semibold text-green-600">{woStats.completed} รายการ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">กำลังดำเนินการ</span>
              <span className="font-semibold text-blue-600">{woStats.inProgress} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mold Status Chart (placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">สถานะแม่พิมพ์ตามลูกค้า</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ลูกค้า</th>
                <th className="text-center px-4 py-3 font-semibold text-green-600">พร้อมใช้</th>
                <th className="text-center px-4 py-3 font-semibold text-blue-600">ใช้งานอยู่</th>
                <th className="text-center px-4 py-3 font-semibold text-orange-600">ซ่อม</th>
                <th className="text-center px-4 py-3 font-semibold text-red-600">ชำรุด</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-900">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.customer}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{row.active}</td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">{row.inUse}</td>
                  <td className="px-4 py-3 text-center text-orange-600 font-medium">{row.maintenance}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{row.damaged}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td className="px-4 py-3 font-bold text-gray-900">รวมทั้งหมด</td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{moldStats.active}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">{moldStats.inUse}</td>
                <td className="px-4 py-3 text-center font-bold text-orange-600">{moldStats.maintenance}</td>
                <td className="px-4 py-3 text-center font-bold text-red-600">{moldStats.damaged}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{moldStats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Top Maintenance Molds */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">แม่พิมพ์ที่ซ่อมบ่อยที่สุด</h3>
        <div className="space-y-3">
          {(() => {
            const moldCount = {};
            mtItems.forEach(m => {
              const code = m.mold?.moldCode || 'N/A';
              const name = m.mold?.name || '';
              if (!moldCount[code]) moldCount[code] = { mold: code, name, count: 0 };
              moldCount[code].count++;
            });
            const sorted = Object.values(moldCount).sort((a, b) => b.count - a.count).slice(0, 5);
            const maxCount = sorted[0]?.count || 1;
            return sorted.map((item, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-blue-600">{item.mold}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count} ครั้ง</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-orange-500" style={{ width: `${(item.count / maxCount) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ));
          })()}
          {mtItems.length === 0 && <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีข้อมูลงานแจ้งซ่อม</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
