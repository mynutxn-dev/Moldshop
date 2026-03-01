import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiClipboard, FiUser, FiCalendar, FiChevronRight, FiTool, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import { workOrdersAPI, moldsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';

// ====== สถานะการเริ่มงาน (New Model) ======
const STAGES = [
  { key: 'mold_design', label: 'Mold Design', label_th: 'ออกแบบแม่พิมพ์', step: 1, color: '#6366f1', bg: '#eef2ff' },
  { key: 'aluminium_casting', label: 'Aluminium Casting', label_th: 'หล่ออลูมิเนียม', step: 2, color: '#0ea5e9', bg: '#e0f2fe' },
  { key: 'machine_mold', label: 'Machine Mold', label_th: 'กลึง/กัดแม่พิมพ์', step: 3, color: '#f59e0b', bg: '#fef3c7' },
  { key: 'finishing_mold', label: 'Finishing Mold', label_th: 'ตกแต่งแม่พิมพ์', step: 4, color: '#10b981', bg: '#d1fae5' },
  { key: 'finishing_assembly', label: 'Finishing & Assembly', label_th: 'ตกแต่งและประกอบ', step: 5, color: '#8b5cf6', bg: '#ede9fe' },
  { key: 'trial_mold', label: 'Trial Mold', label_th: 'ทดสอบแม่พิมพ์', step: 6, color: '#ef4444', bg: '#fee2e2' },
  { key: 'completed', label: 'Completed', label_th: 'เสร็จสิ้น', step: 7, color: '#22c55e', bg: '#dcfce7' },
  { key: 'cancelled', label: 'Cancelled', label_th: 'ยกเลิก', step: 0, color: '#9ca3af', bg: '#f3f4f6' },
];

const stageMap = Object.fromEntries(STAGES.map(s => [s.key, s]));

const priorityMap = {
  urgent: { label: 'เร่งด่วน', color: '#ef4444', bg: '#fee2e2' },
  high: { label: 'สูง', color: '#f97316', bg: '#ffedd5' },
  normal: { label: 'ปกติ', color: '#3b82f6', bg: '#eff6ff' },
  low: { label: 'ต่ำ', color: '#9ca3af', bg: '#f3f4f6' },
};

const typeMap = {
  new_mold: 'สร้างใหม่',
  modify: 'แก้ไข',
  repair: 'ซ่อมแซม',
  trial: 'ทดสอบ Trial',
  improvement: 'ปรับปรุง',
};

// ====== Stage Progress Bar ======
const StagePipeline = ({ currentStatus, compact = false }) => {
  const pipeline = STAGES.filter(s => s.step > 0 && s.key !== 'completed');
  const currentStep = stageMap[currentStatus]?.step ?? 0;
  const isDone = currentStatus === 'completed';
  const isCancelled = currentStatus === 'cancelled';

  if (compact) {
    const stage = stageMap[currentStatus];
    if (!stage) return null;
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ color: stage.color, backgroundColor: stage.bg, border: `1px solid ${stage.color}33` }}
      >
        {isCancelled ? <FiX size={10} /> : isDone ? <FiCheck size={10} /> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, display: 'inline-block' }} />}
        {stage.label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0 mt-3 overflow-x-auto pb-1">
      {pipeline.map((s, idx) => {
        const isActive = s.step === currentStep && !isDone && !isCancelled;
        const isPast = (isDone || s.step < currentStep) && !isCancelled;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center min-w-[52px]">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  borderColor: isPast || isActive ? s.color : '#d1d5db',
                  background: isPast ? s.color : isActive ? s.bg : '#f9fafb',
                  color: isPast ? '#fff' : isActive ? s.color : '#9ca3af',
                }}
              >
                {isPast ? <FiCheck size={12} /> : s.step}
              </div>
              <span
                className="text-[9px] font-medium text-center mt-1 leading-tight"
                style={{ color: isActive ? s.color : isPast ? '#6b7280' : '#9ca3af', maxWidth: 52 }}
              >
                {s.label}
              </span>
            </div>
            {idx < pipeline.length - 1 && (
              <div
                className="flex-1 h-0.5 mb-4 mx-0.5 min-w-[8px]"
                style={{ background: isPast && pipeline[idx + 1] && (isDone || pipeline[idx + 1].step <= currentStep) ? s.color : '#e5e7eb' }}
              />
            )}
          </React.Fragment>
        );
      })}
      {/* Completed badge */}
      <div className="flex flex-col items-center min-w-[44px]">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
          style={{
            borderColor: isDone ? '#22c55e' : '#d1d5db',
            background: isDone ? '#22c55e' : '#f9fafb',
            color: isDone ? '#fff' : '#9ca3af',
          }}
        >
          <FiCheck size={12} />
        </div>
        <span className="text-[9px] font-medium text-center mt-1 leading-tight" style={{ color: isDone ? '#22c55e' : '#9ca3af' }}>
          เสร็จ
        </span>
      </div>
    </div>
  );
};

// ====== Main Component ======
const WorkOrders = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (search) params.search = search;
      if (filterStage) params.status = filterStage;
      const { data } = await workOrdersAPI.getAll(params);
      setItems(data.workOrders);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const results = await Promise.all(
        STAGES.map(s => workOrdersAPI.getAll({ limit: 1, status: s.key }))
      );
      const map = {};
      STAGES.forEach((s, i) => { map[s.key] = results[i].data.total; });
      setSummary(map);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); fetchSummary(); }, []);
  useEffect(() => { fetchData(); }, [search, filterStage]);

  // ===== Create Modal =====
  const [showModal, setShowModal] = useState(false);
  const emptyForm = { title: '', type: 'new_mold', description: '', dueDate: '', status: 'mold_design' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCreateWO = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('กรุณากรอกชื่องาน'); return; }
    setSaving(true);
    try {
      await workOrdersAPI.create(form);
      toast.success('สร้าง New Model สำเร็จ');
      setShowModal(false); setForm(emptyForm); fetchData(); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'สร้างไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  // ===== Update Modal =====
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingWO, setUpdatingWO] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [updateForm, setUpdateForm] = useState({ status: 'mold_design', progress: 0, assignedToId: '' });
  const [updating, setUpdating] = useState(false);

  const openUpdateModal = async (wo) => {
    setUpdatingWO(wo);
    setUpdateForm({
      status: wo.status || 'mold_design',
      progress: wo.progress || 0,
      assignedToId: wo.assignedToId || '',
    });
    try { const { data } = await usersAPI.getAll(); setUserOptions(data); } catch (e) { }
    setShowUpdateModal(true);
  };

  const handleUpdateWO = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const stageObj = stageMap[updateForm.status];
      const payload = { status: updateForm.status };
      if (updateForm.status === 'completed') {
        payload.progress = 100;
        payload.completedDate = new Date().toISOString();
      } else if (stageObj && stageObj.step > 0) {
        // Auto-calculate progress from stage step
        payload.progress = Math.round(((stageObj.step - 1) / 6) * 100);
      }
      if (updateForm.assignedToId) payload.assignedToId = updateForm.assignedToId;
      await workOrdersAPI.update(updatingWO.id, payload);
      toast.success('อัปเดตสถานะงานสำเร็จ');
      setShowUpdateModal(false);
      fetchData(); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'อัปเดตไม่สำเร็จ'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Model</h1>
          <p className="text-gray-500 mt-1 text-sm">Newmodel · ติดตามสถานะการผลิตแม่พิมพ์</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <Link
            to="/work-orders/calendar"
            className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FiCalendar className="mr-2 h-4 w-4" /> ปฏิทิน
          </Link>
          <button
            onClick={openModal}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
          >
            <FiPlus className="mr-2 h-4 w-4" /> สร้าง New Model
          </button>
        </div>
      </div>

      {/* Stage Summary Chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilterStage('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${!filterStage ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
        >
          ทั้งหมด ({total})
        </button>
        {STAGES.filter(s => s.step > 0).map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStage(filterStage === s.key ? '' : s.key)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all"
            style={{
              background: filterStage === s.key ? s.color : s.bg,
              color: filterStage === s.key ? '#fff' : s.color,
              borderColor: s.color + '55',
            }}
          >
            {s.label} {summary[s.key] !== undefined ? `(${summary[s.key]})` : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา เลข New Model, ชื่องาน, แม่พิมพ์..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cards */}
      {loading ? <SkeletonList count={4} /> : (
        <div className="space-y-3">
          {items.map((wo) => {
            const stage = stageMap[wo.status] || stageMap['mold_design'];
            const pri = priorityMap[wo.priority] || priorityMap.normal;
            return (
              <div
                key={wo.id}
                onClick={() => openUpdateModal(wo)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
              >
                {/* Top row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{wo.orderCode}</span>
                    <StagePipeline currentStatus={wo.status} compact />
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: pri.color, background: pri.bg }}
                    >
                      {pri.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{typeMap[wo.type] || wo.type}</span>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 text-[15px]">{wo.title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><FiClipboard size={11} />{wo.mold?.moldCode || 'ไม่ระบุแม่พิมพ์'}</span>
                  <span className="flex items-center gap-1"><FiUser size={11} />{wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : 'ยังไม่มอบหมาย'}</span>
                  <span className="flex items-center gap-1"><FiCalendar size={11} />กำหนด: {wo.dueDate || '-'}</span>
                </div>

                {/* Stage Pipeline */}
                <StagePipeline currentStatus={wo.status} />
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <FiClipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ไม่พบงาน New model</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Create Work Order Modal ===== */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="สร้าง New Model ใหม่" size="lg">
        <form onSubmit={handleCreateWO} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ New Model *</label>
            <input
              type="text" name="title" value={form.title} onChange={handleFormChange}
              placeholder="เช่น สร้างแม่พิมพ์ Part A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะเริ่มต้น</label>
              <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                {STAGES.filter(s => s.step > 0 && s.key !== 'completed').map(s => (
                  <option key={s.key} value={s.key}>{s.step}. {s.label} — {s.label_th}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดเสร็จ</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <textarea
              name="description" value={form.description} onChange={handleFormChange} rows="3"
              placeholder="อธิบายรายละเอียดงาน..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'สร้าง New Model'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Update Stage Modal ===== */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="อัปเดตสถานะงาน" size="md">
        {updatingWO && (
          <form onSubmit={handleUpdateWO} className="space-y-4">
            {/* Work order info */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm border border-gray-100">
              <p className="font-bold text-gray-900">{updatingWO.orderCode} — {updatingWO.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{updatingWO.mold?.moldCode || '-'} | {typeMap[updatingWO.type] || updatingWO.type}</p>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <FiTool size={14} /> สถานะการดำเนินงาน
              </label>
              <div className="grid grid-cols-1 gap-2">
                {STAGES.filter(s => s.step > 0 && s.key !== 'cancelled').map(s => {
                  const isSelected = updateForm.status === s.key;
                  return (
                    <button
                      key={s.key} type="button"
                      onClick={() => setUpdateForm({ ...updateForm, status: s.key })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: isSelected ? s.color : '#e5e7eb',
                        background: isSelected ? s.bg : '#fafafa',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: isSelected ? s.color : '#e5e7eb', color: isSelected ? '#fff' : '#9ca3af' }}
                      >
                        {s.key === 'completed' ? <FiCheck size={13} /> : s.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: isSelected ? s.color : '#374151' }}>{s.label}</p>
                        <p className="text-xs" style={{ color: isSelected ? s.color + 'bb' : '#9ca3af' }}>{s.label_th}</p>
                      </div>
                      {isSelected && <FiCheck size={16} style={{ color: s.color }} />}
                    </button>
                  );
                })}
                {/* Cancelled */}
                <button
                  type="button"
                  onClick={() => setUpdateForm({ ...updateForm, status: 'cancelled' })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: updateForm.status === 'cancelled' ? '#ef4444' : '#e5e7eb',
                    background: updateForm.status === 'cancelled' ? '#fee2e2' : '#fafafa',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: updateForm.status === 'cancelled' ? '#ef4444' : '#e5e7eb', color: updateForm.status === 'cancelled' ? '#fff' : '#9ca3af' }}
                  >
                    <FiX size={13} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: updateForm.status === 'cancelled' ? '#ef4444' : '#374151' }}>Cancelled</p>
                    <p className="text-xs" style={{ color: updateForm.status === 'cancelled' ? '#ef4444aa' : '#9ca3af' }}>ยกเลิกงาน</p>
                  </div>
                  {updateForm.status === 'cancelled' && <FiCheck size={16} style={{ color: '#ef4444' }} />}
                </button>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">มอบหมายให้</label>
              <select
                value={updateForm.assignedToId}
                onChange={(e) => setUpdateForm({ ...updateForm, assignedToId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="">ยังไม่มอบหมาย</option>
                {userOptions.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" disabled={updating} className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {updating ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrders;
