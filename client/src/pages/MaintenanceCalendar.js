import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import { maintenanceAPI } from '../services/api';

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
};

const statusColors = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-gray-400',
};

const statusLabels = {
  pending: 'รอ',
  in_progress: 'ซ่อม',
  completed: 'เสร็จ',
  cancelled: 'ยกเลิก',
};

const typeLabels = { repair: 'ซ่อม', pm: 'PM', inspection: 'ตรวจ', cleaning: 'สะอาด' };

const MaintenanceCalendar = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await maintenanceAPI.getAll({ limit: 100 });
        setItems(data.requests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  // Filter items that have date ranges overlapping this month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

  const visibleItems = items.filter(item => {
    const start = new Date(item.reportDate || item.createdAt);
    const end = item.productionDate ? new Date(item.productionDate) : (item.completedDate ? new Date(item.completedDate) : start);
    return start <= monthEnd && end >= monthStart;
  });

  const getBarPosition = (item) => {
    const start = new Date(item.reportDate || item.createdAt);
    const end = item.productionDate ? new Date(item.productionDate) : (item.completedDate ? new Date(item.completedDate) : start);

    let startDay = start.getFullYear() === year && start.getMonth() === month ? start.getDate() : 1;
    let endDay = end.getFullYear() === year && end.getMonth() === month ? end.getDate() : daysInMonth;

    if (startDay < 1) startDay = 1;
    if (endDay > daysInMonth) endDay = daysInMonth;

    return { startDay, endDay, totalDays: endDay - startDay + 1 };
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/maintenance" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <FiArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="page-title">📅 แผนงานแจ้งซ่อม</h1>
            <p className="text-muted" style={{ marginTop: '0.25rem' }}>ปฏิทินแสดงระยะเวลางานแจ้งซ่อม</p>
          </div>
        </div>
        <div className="page-header-actions mt-3 sm:mt-0">
          <Link to="/maintenance" className="btn btn-secondary">
            <FiList className="mr-1.5 h-4 w-4 inline" /> มุมมองรายการ
          </Link>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>{monthNames[month]} {year + 543}</h2>
          <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-gray-100 text-xs">
          <span className="font-medium text-gray-500">สถานะ:</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-1"></span>รอดำเนินการ</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>กำลังซ่อม</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>เสร็จสิ้น</span>
          <span className="ml-4 font-medium text-gray-500">ขอบ:</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded border-2 border-red-500 mr-1"></span>เร่งด่วน/สูง</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded border-2 border-blue-500 mr-1"></span>ปกติ</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(800, daysInMonth * 38 + 220)}px` }}>
              {/* Day Headers */}
              <div className="flex border-b border-gray-200">
                <div className="w-[220px] min-w-[220px] px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 border-r border-gray-200 flex items-center">
                  รายการงานแจ้งซ่อม
                </div>
                <div className="flex-1 flex">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const date = new Date(year, month, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = day === todayDay;
                    return (
                      <div
                        key={day}
                        className={`flex-1 min-w-[36px] text-center py-2 text-xs border-r border-gray-100
                          ${isToday ? 'bg-blue-600 text-white font-bold' : isWeekend ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600'}
                        `}
                      >
                        <div className="font-semibold">{day}</div>
                        <div className="text-[10px]">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][date.getDay()]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rows */}
              {visibleItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">ไม่มีรายการงานแจ้งซ่อมในเดือนนี้</div>
              ) : (
                visibleItems.map(item => {
                  const { startDay, totalDays } = getBarPosition(item);
                  const barColor = statusColors[item.status] || 'bg-gray-400';
                  const borderColor = (item.priority === 'urgent' || item.priority === 'high') ? 'border-red-500' : 'border-blue-400';
                  const moldCode = item.mold?.moldCode || item.requestCode;

                  return (
                    <div key={item.id} className="flex border-b border-gray-100 hover:bg-blue-50/30 group">
                      {/* Label */}
                      <div className="w-[220px] min-w-[220px] px-3 py-2 border-r border-gray-200 flex flex-col justify-center">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-gray-900">{item.requestCode}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[item.priority]} text-white`}>
                            {item.priority === 'urgent' ? '!!' : item.priority === 'high' ? '!' : ''}
                            {typeLabels[item.type] || item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5" title={item.description}>
                          {moldCode} — {item.description?.substring(0, 30)}{item.description?.length > 30 ? '...' : ''}
                        </p>
                      </div>

                      {/* Gantt Area */}
                      <div className="flex-1 flex relative" style={{ minHeight: '44px' }}>
                        {/* Grid lines */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const date = new Date(year, month, day);
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isToday = day === todayDay;
                          return (
                            <div
                              key={day}
                              className={`flex-1 min-w-[36px] border-r border-gray-100
                                ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50/50' : ''}
                              `}
                            />
                          );
                        })}

                        {/* Bar */}
                        <div
                          className="absolute top-1.5 bottom-1.5 flex items-center"
                          style={{
                            left: `${((startDay - 1) / daysInMonth) * 100}%`,
                            width: `${(totalDays / daysInMonth) * 100}%`,
                          }}
                        >
                          <div className={`w-full h-7 ${barColor} rounded-md border-2 ${borderColor} flex items-center px-2 shadow-sm cursor-default group-hover:shadow-md transition-shadow`}
                            title={`${item.requestCode}: ${item.description}\nวันที่แจ้ง: ${item.reportDate ? new Date(item.reportDate).toLocaleDateString('th-TH') : new Date(item.createdAt).toLocaleDateString('th-TH')}\nวันขึ้นผลิต: ${item.productionDate || '?'}\nสถานะ: ${statusLabels[item.status]}`}
                          >
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                              {moldCode} ({totalDays} วัน) — {statusLabels[item.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>{visibleItems.length}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>รายการทั้งหมด</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>{visibleItems.filter(i => i.status === 'pending').length}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>รอดำเนินการ</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-warning)' }}>{visibleItems.filter(i => i.status === 'in_progress').length}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>กำลังซ่อม</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-success)' }}>{visibleItems.filter(i => i.status === 'completed').length}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>เสร็จสิ้น</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCalendar;
