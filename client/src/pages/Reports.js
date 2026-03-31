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

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[var(--text-muted)]">กำลังโหลดข้อมูล...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 รายงานระบบแม่พิมพ์</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>สรุปข้อมูลสถิติและรายงานต่างๆ ของ Moldshop</p>
        </div>
        <div className="page-header-actions flex gap-2">
          <button onClick={handleExport} className="btn" style={{ background: 'var(--color-success)', color: 'white' }}>
            <FiDownload className="mr-1 h-4 w-4 inline" /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      {/* Report Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBarChart2 size={20} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-color)' }}>สรุปแม่พิมพ์</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>ทั้งหมด</span>
              <span style={{ fontWeight: 700, color: 'var(--text-color)' }}>{moldStats.total} ชุด</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>พร้อมใช้งาน</span>
              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{moldStats.active} ชุด</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>กำลังซ่อม / ชำรุด</span>
              <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{moldStats.maintenance + moldStats.damaged} ชุด</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiPieChart size={20} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-color)' }}>สรุปงานแจ้งซ่อม</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>ทั้งหมด</span>
              <span style={{ fontWeight: 700, color: 'var(--text-color)' }}>{mtStats.total} รายการ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>เสร็จสิ้น</span>
              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{mtStats.completed} รายการ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>ค้างดำเนินการ</span>
              <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>{mtStats.pending + mtStats.inProgress} รายการ</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrendingUp size={20} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-color)' }}>สรุป New Model</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>ทั้งหมด</span>
              <span style={{ fontWeight: 700, color: 'var(--text-color)' }}>{woStats.total} รายการ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>เสร็จสิ้น</span>
              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{woStats.completed} รายการ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>กำลังดำเนินการ</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{woStats.inProgress} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
        {/* Mold Status Chart (placeholder) */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-color)' }}>สถานะแม่พิมพ์ตามลูกค้า</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ลูกค้า</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-success)' }}>พร้อมใช้</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-primary)' }}>ใช้งานอยู่</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-warning)' }}>ซ่อม</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-danger)' }}>ชำรุด</th>
                  <th style={{ textAlign: 'center', color: 'var(--text-color)' }}>รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerRows.map((row, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-[var(--text-color)]">{row.customer}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--color-success)' }}>{row.active}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--color-primary)' }}>{row.inUse}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--color-warning)' }}>{row.maintenance}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--color-danger)' }}>{row.damaged}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-color)' }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }}>
                  <td className="font-bold text-[var(--text-color)]" style={{ padding: '0.75rem 1rem' }}>รวมทั้งหมด</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-success)' }}>{moldStats.active}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>{moldStats.inUse}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-warning)' }}>{moldStats.maintenance}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-danger)' }}>{moldStats.damaged}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-color)' }}>{moldStats.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Top Maintenance Molds */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-color)' }}>แม่พิมพ์ที่ซ่อมบ่อยที่สุด</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.85rem', width: '90px', textAlign: 'center' }}>
                    {item.mold}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{item.count} ครั้ง</span>
                    </div>
                    <div style={{ width: '100%', background: 'var(--border-color)', borderRadius: '100px', height: '8px' }}>
                      <div style={{ height: '8px', borderRadius: '100px', background: 'var(--color-warning)', width: `${(item.count / maxCount) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ));
            })()}
            {mtItems.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-4">ยังไม่มีข้อมูลงานแจ้งซ่อม</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
