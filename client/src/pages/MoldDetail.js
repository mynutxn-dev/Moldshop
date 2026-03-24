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
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Link to="/molds" className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all">
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{mold.moldCode} — {mold.name}</h1>
          <p className="text-gray-400 font-medium italic">ลูกค้า: {mold.customer} | Part: {mold.partNumber || '-'}</p>
        </div>
        <button className="inline-flex items-center px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-black/20 transform hover:-translate-y-1">
          <FiEdit2 className="mr-2 h-4 w-4" /> แก้ไข
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center uppercase text-xs tracking-widest">
              <FiBox className="mr-2 h-4 w-4 text-black" /> ข้อมูลแม่พิมพ์
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['สถานะ', statusLabels[mold.status] || mold.status],
                ['Mold Size', mold.machineType || '-'],
                ['ตำแหน่งจัดเก็บ', mold.location || '-'],
              ].map(([label, value], i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shot Count */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">จำนวน Shot</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">{(mold.shotCount || 0).toLocaleString()}</span>
              <span className="text-sm text-gray-500">/ {(mold.maxShot || 0).toLocaleString()} shots</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 p-1 overflow-hidden border border-gray-100">
              <div
                className="h-full rounded-full bg-black transition-all duration-1000"
                style={{ width: `${shotPercent}%`, opacity: shotPercent > 80 ? 1 : shotPercent > 50 ? 0.7 : 0.4 }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">ใช้ไปแล้ว {shotPercent}% ของอายุการใช้งาน</p>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">ประวัติการใช้งาน</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {history.map((item, i) => (
                <div key={i} className="p-4 flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm">{actionLabels[item.action] || item.action}</p>
                      <span className="text-xs text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : ''}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">โดย: {item.performedBy ? `${item.performedBy.firstName} ${item.performedBy.lastName}` : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          {/* Maintenance Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center uppercase text-xs tracking-widest">
              <FiTool className="mr-2 h-4 w-4 text-black" /> การบำรุงรักษา
            </h3>
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">บำรุงรักษาล่าสุด</p>
                <p className="font-black text-gray-900 text-sm mt-1">{mold.lastMaintenanceDate || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">บำรุงรักษาครั้งถัดไป</p>
                <p className="font-black text-black text-base mt-1 underline decoration-2 underline-offset-4">{mold.nextMaintenanceDate || '-'}</p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all shadow-md">
              แจ้งงานแจ้งซ่อม
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
            <h3 className="font-bold text-gray-900 mb-4">ดำเนินการ</h3>
            <div className="space-y-3">
              <button className="w-full py-3 text-sm font-bold text-black border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all">
                เบิกใช้งาน
              </button>
              <button className="w-full py-3 text-sm font-bold text-gray-600 border-2 border-gray-200 rounded-xl hover:border-black hover:text-black transition-all">
                คืนแม่พิมพ์
              </button>
              <button className="w-full py-3 text-sm font-bold text-white bg-gray-800 rounded-xl hover:bg-black transition-all">
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
