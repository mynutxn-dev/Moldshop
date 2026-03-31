import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import { workOrdersAPI } from '../services/api';

// ====== Stage Config (shared) ======
const STAGES = [
    { key: 'mold_design', label: 'Mold Design', label_th: 'ออกแบบ', step: 1, color: '#6366f1' },
    { key: 'aluminium_casting', label: 'Aluminium Casting', label_th: 'หล่ออลูมิเนียม', step: 2, color: '#0ea5e9' },
    { key: 'machine_mold', label: 'Machine Mold', label_th: 'กลึง/กัด', step: 3, color: '#f59e0b' },
    { key: 'finishing_mold', label: 'Finishing Mold', label_th: 'ตกแต่ง', step: 4, color: '#10b981' },
    { key: 'finishing_assembly', label: 'Finishing & Assembly', label_th: 'ประกอบ', step: 5, color: '#8b5cf6' },
    { key: 'trial_mold', label: 'Trial Mold', label_th: 'ทดสอบ', step: 6, color: '#ef4444' },
    { key: 'completed', label: 'Completed', label_th: 'เสร็จสิ้น', step: 7, color: '#22c55e' },
    { key: 'cancelled', label: 'Cancelled', label_th: 'ยกเลิก', step: 0, color: '#9ca3af' },
];
const stageMap = Object.fromEntries(STAGES.map(s => [s.key, s]));

const priorityBorder = {
    urgent: '#ef4444',
    high: '#f97316',
    normal: '#3b82f6',
    low: '#9ca3af',
};

const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const dayTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// ======================================================
const WorkOrderCalendar = () => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await workOrdersAPI.getAll({ limit: 200 });
                setItems(data.workOrders);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter WOs visible in this month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

    const visibleItems = items.filter(wo => {
        const start = wo.startDate ? new Date(wo.startDate) : new Date(wo.createdAt);
        const end = wo.dueDate ? new Date(wo.dueDate) : (wo.completedDate ? new Date(wo.completedDate) : start);
        return start <= monthEnd && end >= monthStart;
    });

    const getBarPosition = (wo) => {
        const start = wo.startDate ? new Date(wo.startDate) : new Date(wo.createdAt);
        const end = wo.dueDate ? new Date(wo.dueDate) : (wo.completedDate ? new Date(wo.completedDate) : start);

        let startDay = (start.getFullYear() === year && start.getMonth() === month) ? start.getDate() : 1;
        let endDay = (end.getFullYear() === year && end.getMonth() === month) ? end.getDate() : daysInMonth;

        if (startDay < 1) startDay = 1;
        if (endDay > daysInMonth) endDay = daysInMonth;

        return { startDay, endDay, totalDays: endDay - startDay + 1 };
    };

    // Summary counts
    const stageCounts = {};
    STAGES.forEach(s => { stageCounts[s.key] = visibleItems.filter(i => i.status === s.key).length; });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/work-orders" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <FiArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="page-title">📅 ปฏิทิน New model</h1>
                        <p className="text-muted" style={{ marginTop: '0.25rem' }}>Gantt · แสดงระยะเวลาการทำงานแม่พิมพ์รายเดือน</p>
                    </div>
                </div>
                <div className="page-header-actions mt-3 sm:mt-0">
                    <Link to="/work-orders" className="btn btn-secondary">
                        <FiList className="mr-1.5 h-4 w-4 inline" /> มุมมองรายการ
                    </Link>
                </div>
            </div>

            {/* Stage Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
                {STAGES.filter(s => s.step > 0).map(s => (
                    <span
                        key={s.key}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: s.color + '20', color: s.color, border: `1px solid ${s.color}44` }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        {s.label}
                        {stageCounts[s.key] > 0 && <span className="font-bold">({stageCounts[s.key]})</span>}
                    </span>
                ))}
            </div>

            {/* Gantt Chart */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
                {/* Month Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                    <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <FiChevronLeft className="h-5 w-5" />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>{monthNames[month]} {year + 543}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{visibleItems.length} New model ในเดือนนี้</p>
                    </div>
                    <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <FiChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-gray-400 text-sm">กำลังโหลดข้อมูล...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <div style={{ minWidth: `${Math.max(860, daysInMonth * 36 + 240)}px` }}>

                            {/* Day Header Row */}
                            <div className="flex border-b border-gray-200 sticky top-0 z-10 bg-white">
                                <div className="w-[240px] min-w-[240px] px-4 py-2.5 bg-gray-50 text-xs font-bold text-gray-600 border-r border-gray-200 flex items-center">
                                    New Model / สถานะ
                                </div>
                                <div className="flex flex-1">
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                        const date = new Date(year, month, day);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const isToday = day === todayDay;
                                        return (
                                            <div
                                                key={day}
                                                className="flex-1 min-w-[34px] text-center py-1.5 text-[10px] border-r border-gray-100"
                                                style={{
                                                    background: isToday ? '#4f46e5' : isWeekend ? '#f9fafb' : 'white',
                                                    color: isToday ? 'white' : isWeekend ? '#9ca3af' : '#6b7280',
                                                }}
                                            >
                                                <div className="font-bold">{day}</div>
                                                <div style={{ opacity: 0.8 }}>{dayTH[date.getDay()]}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Work Order Rows */}
                            {visibleItems.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-sm">ไม่มีงานNew model ในเดือนนี้</div>
                            ) : (
                                visibleItems.map(wo => {
                                    const { startDay, totalDays } = getBarPosition(wo);
                                    const stage = stageMap[wo.status] || stageMap['mold_design'];
                                    const border = priorityBorder[wo.priority] || '#3b82f6';
                                    const moldLabel = wo.mold?.moldCode || '—';

                                    return (
                                        <div key={wo.id} className="flex border-b border-gray-100 hover:bg-indigo-50/30 group transition-colors">
                                            {/* Left label */}
                                            <div className="w-[240px] min-w-[240px] px-3 py-2 border-r border-gray-200 flex flex-col justify-center">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-xs text-gray-900">{wo.orderCode}</span>
                                                    <span
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                        style={{ background: stage.color + '18', color: stage.color }}
                                                    >
                                                        {stage.label_th}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate mt-0.5 max-w-[220px]" title={wo.title}>
                                                    {moldLabel} — {wo.title}
                                                </p>
                                            </div>

                                            {/* Gantt Area */}
                                            <div className="flex-1 relative flex" style={{ minHeight: '48px' }}>
                                                {/* Grid columns */}
                                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                                    const date = new Date(year, month, day);
                                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                    const isToday = day === todayDay;
                                                    return (
                                                        <div
                                                            key={day}
                                                            className="flex-1 min-w-[34px] border-r border-gray-100"
                                                            style={{ background: isToday ? '#eef2ff' : isWeekend ? '#fafafa' : 'transparent' }}
                                                        />
                                                    );
                                                })}

                                                {/* Bar */}
                                                <div
                                                    className="absolute top-2 bottom-2"
                                                    style={{
                                                        left: `${((startDay - 1) / daysInMonth) * 100}%`,
                                                        width: `${(totalDays / daysInMonth) * 100}%`,
                                                        minWidth: 28,
                                                    }}
                                                >
                                                    <div
                                                        className="h-full rounded-lg flex items-center px-2 shadow-sm group-hover:shadow-md transition-shadow cursor-default"
                                                        style={{
                                                            background: stage.color,
                                                            border: `2px solid ${border}`,
                                                            opacity: wo.status === 'cancelled' ? 0.45 : 1,
                                                        }}
                                                        title={`${wo.orderCode}: ${wo.title}\nสถานะ: ${stage.label}\nระยะเวลา: ${totalDays} วัน\n${wo.startDate || new Date(wo.createdAt).toLocaleDateString('th-TH')} → ${wo.dueDate || '?'}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                                                            {totalDays > 2 ? `${wo.orderCode} (${totalDays}d)` : wo.orderCode}
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

            {/* Bottom Stage Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                {STAGES.filter(s => s.step > 0 && s.key !== 'cancelled').slice(0, 4).map(s => (
                    <div key={s.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.color + '18' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: s.color }}>{stageCounts[s.key] || 0}</span>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label_th}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {STAGES.filter(s => s.step > 0 && s.key !== 'cancelled').slice(4).map(s => (
                    <div key={s.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.color + '18' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: s.color }}>{stageCounts[s.key] || 0}</span>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label_th}</p>
                        </div>
                    </div>
                ))}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{stageCounts['cancelled'] || 0}</span>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>Cancelled</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ยกเลิก</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--color-primary-light)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{visibleItems.length}</span>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}>ทั้งหมด</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ในเดือนนี้</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderCalendar;
