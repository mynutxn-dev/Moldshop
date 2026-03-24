import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiClipboard, FiCalendar, FiTool, FiCheck, FiX, FiEdit2, FiCamera } from 'react-icons/fi';
import { workOrdersAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';
import imageCompression from 'browser-image-compression';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
const getImageUrl = (img) => img?.startsWith('http') ? img : `${API_BASE}${img}`;

// Helper: Compress image before upload
const compressImage = async (file) => {
  const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1600, useWebWorker: true };
  try { return await imageCompression(file, options); }
  catch (error) { console.error('Compression error:', error); return file; }
};

const STAGES = [
  { key: 'mold_design', label: 'Mold Design', label_th: 'ออกแบบแม่พิมพ์', step: 1, color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'aluminium_casting', label: 'Aluminium Casting', label_th: 'หล่ออลูมิเนียม', step: 2, color: '#ec4899', bg: '#fdf2f8' },
  { key: 'machine_mold', label: 'Machine Mold', label_th: 'กลึง/กัดแม่พิมพ์', step: 3, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'finishing_mold', label: 'Finishing Mold', label_th: 'ตกแต่งแม่พิมพ์', step: 4, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'finishing_assembly', label: 'Finishing & Assembly', label_th: 'ตกแต่งและประกอบ', step: 5, color: '#06b6d4', bg: '#ecfeff' },
  { key: 'trial_mold', label: 'Trial Mold', label_th: 'ทดสอบแม่พิมพ์', step: 6, color: '#10b981', bg: '#ecfdf5' },
  { key: 'completed', label: 'Completed', label_th: 'เสร็จสิ้น', step: 7, color: '#059669', bg: '#d1fae5' },
  { key: 'cancelled', label: 'Cancelled', label_th: 'ยกเลิก', step: 0, color: '#ef4444', bg: '#fef2f2' },
];

const stageMap = Object.fromEntries(STAGES.map(s => [s.key, s]));

const priorityMap = {
  urgent: { label: 'เร่งด่วน', color: '#ffffff', bg: '#dc2626' },
  high: { label: 'สูง', color: '#ffffff', bg: '#ea580c' },
  normal: { label: 'ปกติ', color: '#374151', bg: '#e5e7eb' },
  low: { label: 'ต่ำ', color: '#ffffff', bg: '#6b7280' },
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

  const fetchData = useCallback(async () => {
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
  }, [search, filterStage]);

  const fetchSummary = useCallback(async () => {
    try {
      const results = await Promise.all(
        STAGES.map(s => workOrdersAPI.getAll({ limit: 1, status: s.key }))
      );
      const map = {};
      STAGES.forEach((s, i) => { map[s.key] = results[i].data.total; });
      setSummary(map);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== Create Modal =====
  const [showModal, setShowModal] = useState(false);
  const emptyForm = { title: '', type: 'new_mold', description: '', dueDate: '', status: 'mold_design', customer: '' };
  const [form, setForm] = useState(emptyForm);
  const [formImages, setFormImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    setForm(emptyForm);
    setFormImages([]);
    setShowModal(true);
  };
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormImages(prev => [...prev, ...files].slice(0, 5)); // Limit to 5 images
  };

  const removeFormImage = (index) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateWO = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('กรุณากรอกชื่องาน'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key]) formData.append(key, form[key]);
      });

      for (const file of formImages) {
        const compressedFile = await compressImage(file);
        formData.append('images', compressedFile);
      }

      await workOrdersAPI.create(formData);
      toast.success('สร้าง New Model สำเร็จ');
      setShowModal(false); setForm(emptyForm); setFormImages([]); fetchData(); fetchSummary();
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

  // ===== Edit Info Modal =====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', dueDate: '', description: '', customer: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const openEditModal = (e, wo) => {
    e.stopPropagation();
    setEditingWO(wo);
    setEditForm({
      title: wo.title || '',
      dueDate: wo.dueDate || '',
      description: wo.description || '',
      customer: wo.customer || '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title) { toast.error('กรุณากรอกชื่องาน'); return; }
    setSavingEdit(true);
    try {
      await workOrdersAPI.update(editingWO.id, editForm);
      toast.success('อัปเดตข้อมูลสำเร็จ');
      setShowEditModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'อัปเดตไม่สำเร็จ'); }
    finally { setSavingEdit(false); }
  };

  const handleUploadWOImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !editingWO) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        const compressedFile = await compressImage(file);
        formData.append('images', compressedFile);
      }
      const { data } = await workOrdersAPI.uploadImages(editingWO.id, formData);
      setEditingWO(data);
      toast.success('อัพโหลดรูปสำเร็จ');
      fetchData();
    } catch (err) {
      toast.error('อัพโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteWOImage = async (imageUrl) => {
    if (!editingWO) return;
    try {
      const { data } = await workOrdersAPI.deleteImage(editingWO.id, imageUrl);
      setEditingWO(data);
      toast.success('ลบรูปสำเร็จ');
      fetchData();
    } catch (err) {
      toast.error('ลบรูปไม่สำเร็จ');
    }
  };

  const activeProjects = items.filter((item) => !['completed', 'cancelled'].includes(item.status)).length;
  const completedProjects = summary.completed || 0;
  const lateProjects = items.filter((item) => item.dueDate && new Date(item.dueDate) < new Date() && !['completed', 'cancelled'].includes(item.status)).length;

  return (
    <div className="space-y-6">
      <section className="page-hero animate-fade-in-up">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="page-kicker">New Model Pipeline</p>
            <h1 className="page-title">ติดตามงาน New Model แบบ end-to-end จากมุมมองที่อ่านง่ายขึ้น</h1>
            <p className="page-subtitle">
              เห็นภาพรวมของทุก stage ตั้งแต่ออกแบบจนเสร็จสิ้น พร้อม drill-in ไปอัปเดตสถานะ แก้ไขข้อมูล หรือแนบรูปประกอบงานได้จากหน้าเดียว
            </p>
          </div>
          <div className="page-actions">
            <Link to="/work-orders/calendar" className="btn-secondary">
              <FiCalendar className="h-4 w-4" /> ปฏิทิน
            </Link>
            <button onClick={openModal} className="btn-primary">
              <FiPlus className="h-4 w-4" /> สร้าง New Model
            </button>
          </div>
        </div>
        <div className="overview-strip">
          <div className="overview-card overview-card--primary">
            <span className="overview-card-label">ทั้งหมด</span>
            <strong className="overview-card-value">{total}</strong>
            <span className="overview-card-meta">โปรเจกต์ในระบบ</span>
          </div>
          <div className="overview-card overview-card--warning">
            <span className="overview-card-label">กำลังดำเนินการ</span>
            <strong className="overview-card-value">{activeProjects}</strong>
            <span className="overview-card-meta">ยังไม่ปิดงาน</span>
          </div>
          <div className="overview-card overview-card--success">
            <span className="overview-card-label">เสร็จสิ้น</span>
            <strong className="overview-card-value">{completedProjects}</strong>
            <span className="overview-card-meta">ปิดงานแล้ว</span>
          </div>
          <div className="overview-card overview-card--danger">
            <span className="overview-card-label">เกินกำหนด</span>
            <strong className="overview-card-value">{lateProjects}</strong>
            <span className="overview-card-meta">ต้องติดตามเร่งด่วน</span>
          </div>
        </div>
      </section>

      <div className="filter-surface space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStage('')}
            className={`status-pill ${!filterStage ? 'status-pill-progress' : 'status-pill-cancelled'}`}
          >
            ทั้งหมด ({total})
          </button>
          {STAGES.filter(s => s.step > 0).map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStage(filterStage === s.key ? '' : s.key)}
              className="status-pill"
              style={{
                background: filterStage === s.key ? s.color : s.bg,
                color: filterStage === s.key ? '#fff' : s.color,
                borderColor: `${s.color}33`,
              }}
            >
              {s.label} {summary[s.key] !== undefined ? `(${summary[s.key]})` : ''}
            </button>
          ))}
        </div>
        <div className="search-field">
          <FiSearch className="h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา เลข New Model, ชื่องาน, แม่พิมพ์..."
          />
        </div>
      </div>

      {loading ? <SkeletonList count={4} /> : (
        <div className="space-y-6">
          {(() => {
            if (items.length === 0) {
              return (
                <div className="empty-state-card">
                  <FiClipboard className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-base font-semibold text-slate-900">ไม่พบงาน New Model</p>
                  <p className="mt-2 text-sm text-slate-500">ลองปรับตัวกรองหรือสร้างโปรเจกต์ใหม่เพื่อเริ่มต้น</p>
                </div>
              );
            }

            // 1) Group items by customer
            const groups = items.reduce((acc, wo) => {
              const cust = wo.customer ? wo.customer.trim() : 'ไม่ระบุลูกค้า';
              if (!acc[cust]) acc[cust] = [];
              acc[cust].push(wo);
              return acc;
            }, {});

            // 2) Sort group keys A-Z (Put "ไม่ระบุลูกค้า" at the end)
            const sortedCustomers = Object.keys(groups).sort((a, b) => {
              if (a === 'ไม่ระบุลูกค้า') return 1;
              if (b === 'ไม่ระบุลูกค้า') return -1;
              return a.localeCompare(b);
            });

            // 3) Render each group
            return sortedCustomers.map(customer => (
              <section key={customer}>
                <div className="group-header pl-1">
                  <div className="group-avatar">
                    {customer !== 'ไม่ระบุลูกค้า' ? customer.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">{customer}</h2>
                    <p className="mt-1 text-sm text-slate-500">โปรเจกต์ New Model ของลูกค้ารายนี้</p>
                  </div>
                  <span className="group-chip">
                    {groups[customer].length} Projects
                  </span>
                </div>

                <div className="space-y-3">
                  {groups[customer].map((wo) => {
                    const pri = priorityMap[wo.priority] || priorityMap.normal;
                    return (
                      <div
                        key={wo.id}
                        onClick={() => openUpdateModal(wo)}
                        className="record-card ml-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black tracking-tight text-slate-950">{wo.orderCode}</span>
                            <span
                              className="group-chip"
                              style={{ color: pri.color, backgroundColor: pri.bg, borderColor: pri.color === '#ffffff' ? 'black' : 'transparent' }}
                            >
                              {pri.label}
                            </span>
                            <StagePipeline currentStatus={wo.status} compact />
                          </div>
                          <span className="record-card-id">{typeMap[wo.type] || wo.type}</span>
                        </div>

                        <div className="flex justify-between items-start gap-4 mb-5">
                          <div className="min-w-0 flex-1">
                            <h3 className="record-card-title">{wo.title}</h3>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{wo.moldCode || wo.mold_code || '-'}</p>
                          </div>
                          <button
                            onClick={(e) => openEditModal(e, wo)}
                            className="action-icon-button"
                            title="แก้ไขข้อมูล"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </div>

                        <StagePipeline currentStatus={wo.status} />

                        <div className="record-card-meta mt-5">
                          <span>
                            <FiCalendar className="h-4 w-4" />
                            Due {wo.due_date ? new Date(wo.due_date).toLocaleDateString('th-TH') : '-'}
                          </span>
                          <span>
                            Updated: {new Date(wo.updated_at || wo.updatedAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ));
          })()}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า (Customer)</label>
            <input
              type="text" name="customer" value={form.customer} onChange={handleFormChange}
              placeholder="เช่น Toyota, Honda..."
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

          {/* Image Upload for New WO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพประกอบ (สูงสุด 5 รูป)</label>
            {formImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formImages.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFormImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 text-[10px]"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formImages.length < 5 && (
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors w-fit">
                <FiCamera className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">แนบรูปภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
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

      {/* ===== Edit Info Modal ===== */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="แก้ไขข้อมูล New Model" size="lg">
        {editingWO && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ New Model *</label>
              <input
                type="text" name="title" value={editForm.title} onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า (Customer)</label>
              <input
                type="text" name="customer" value={editForm.customer} onChange={handleEditChange}
                placeholder="เช่น Toyota, Honda..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันกำหนดเสร็จ</label>
              <input
                type="date" name="dueDate" value={editForm.dueDate} onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea
                name="description" value={editForm.description} onChange={handleEditChange} rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Image Gallery */}
            {editingWO.images && editingWO.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพแนบ ({editingWO.images.length} รูป)</label>
                <div className="flex flex-wrap gap-2">
                  {editingWO.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                        onClick={() => setLightboxImg(getImageUrl(img))}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteWOImage(img); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        title="ลบรูปนี้"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload images */}
            <div>
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors w-fit">
                <FiCamera className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{uploadingImages ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปภาพ'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadWOImages}
                  className="hidden"
                  disabled={uploadingImages}
                />
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" disabled={savingEdit} className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ===== Image Lightbox ===== */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <FiX size={20} />
          </button>
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
