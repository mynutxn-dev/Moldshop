import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTool, FiBox } from 'react-icons/fi';
import { moldsAPI } from '../services/api';

const statusLabels = {
  active: 'พร้อมใช้งาน', in_use: 'ใช้งานอยู่', maintenance: 'กำลังซ่อม', damaged: 'ชำรุด', retired: 'ปลดระวาง',
};
const actionLabels = {
  checkout: 'เบิกใช้งาน', return: 'คืนแม่พิมพ์', maintenance: 'บำรุงรักษา', repair: 'ซ่อมแซม',
  inspection: 'ตรวจสอบ', production: 'ใช้งานผลิต', status_change: 'เปลี่ยนสถานะ',
};

const MoldDetail = () => {
  const { id } = useParams();
  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await moldsAPI.getOne(id);
        setMold(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">กำลังโหลด...</p></div>;
  if (!mold) return <div className="text-center py-20"><p className="text-gray-500">ไม่พบแม่พิมพ์</p><Link to="/molds" className="text-blue-600 mt-2 inline-block">กลับไปรายการ</Link></div>;

  const history = mold.history || [];
  const shotPercent = mold.maxShot ? Math.round((mold.shotCount / mold.maxShot) * 100) : 0;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/molds" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <FiArrowLeft className="h-5 w-5 inline" />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.75rem' }}>{mold.moldCode} — {mold.name}</h1>
            <p className="text-muted" style={{ fontWeight: 500, fontStyle: 'italic', marginTop: '0.25rem' }}>ลูกค้า: {mold.customer} | Part: {mold.partNumber || '-'}</p>
          </div>
        </div>
        <div className="page-header-actions mt-3 sm:mt-0">
          <button className="btn btn-primary">
            <FiEdit2 className="mr-1.5 h-4 w-4 inline" /> แก้ไข
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specs */}
          <div className="card">
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-color)' }}>
              <FiBox className="mr-2 h-4 w-4 text-[var(--color-primary)]" /> ข้อมูลแม่พิมพ์
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                ['สถานะ', statusLabels[mold.status] || mold.status],
                ['Mold Size', mold.machineType || '-'],
                ['ตำแหน่งจัดเก็บ', mold.location || '-'],
              ].map(([label, value], i) => (
                <div key={i}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, fontSize: '1rem', color: 'var(--text-color)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shot Count */}
          <div className="card">
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-color)' }}>จำนวน Shot</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-color)' }}>{(mold.shotCount || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {(mold.maxShot || 0).toLocaleString()} shots</span>
            </div>
            <div style={{ width: '100%', background: 'var(--border-color)', borderRadius: '100px', height: '12px', overflow: 'hidden' }}>
              <div
                style={{ height: '100%', borderRadius: '100px', background: 'var(--color-primary)', transition: 'width 1s ease', width: `${shotPercent}%`, opacity: shotPercent > 80 ? 1 : shotPercent > 50 ? 0.7 : 0.4 }}
              ></div>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ใช้ไปแล้ว {shotPercent}% ของอายุการใช้งาน</p>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-color)' }}>ประวัติการใช้งาน</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {history.map((item, i) => (
                <div key={i} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-color)' }}>{actionLabels[item.action] || item.action}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : ''}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.description}</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>โดย: {item.performedBy ? `${item.performedBy.firstName} ${item.performedBy.lastName}` : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Maintenance Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-color)' }}>
              <FiTool className="mr-2 h-4 w-4 text-[var(--color-warning)]" /> การบำรุงรักษา
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>บำรุงรักษาล่าสุด</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 900, color: 'var(--text-color)', fontSize: '0.85rem' }}>{mold.lastMaintenanceDate || '-'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>บำรุงรักษาครั้งถัดไป</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 900, color: 'var(--text-color)', fontSize: '1rem', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px' }}>{mold.nextMaintenanceDate || '-'}</p>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', padding: '0.75rem' }}>
              แจ้งงานแจ้งซ่อม
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-color)' }}>ดำเนินการ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', border: '2px solid var(--text-color)', color: 'var(--text-color)', background: 'transparent' }}>
                เบิกใช้งาน
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                คืนแม่พิมพ์
              </button>
              <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                สร้าง New Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoldDetail;
