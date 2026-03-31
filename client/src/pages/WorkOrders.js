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

  const quickNums = [
    { value: total, label: 'โปรเจกต์ทั้งหมด', color: '#4a7cff', sparkPoints: '0,5 10,15 20,10 30,20 40,15 50,22 60,18' },
    { value: activeProjects, label: 'กำลังดำเนินการ', color: '#f59e0b', sparkPoints: '0,20 10,18 20,22 30,15 40,18 50,12 60,10' },
    { value: completedProjects, label: 'เสร็จสิ้น', color: '#10b981', sparkPoints: '0,10 10,15 20,8 30,12 40,6 50,14 60,8' },
    { value: lateProjects, label: 'เกินกำหนด', color: '#ef4444', sparkPoints: '0,15 10,12 20,18 30,22 40,15 50,10 60,14' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚀 งาน New Model (Work Orders)</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>ติดตามความคืบหน้าของโปรเจกต์สร้างแม่พิมพ์ใหม่แบบ end-to-end</p>
        </div>
        <div className="page-header-actions flex gap-2">
          <Link to="/work-orders/calendar" className="btn btn-secondary">
            <FiCalendar className="mr-1 h-4 w-4 inline" /> ปฏิทิน
          </Link>
          <button onClick={openModal} className="btn btn-primary">
            <FiPlus className="mr-1 h-4 w-4 inline" /> สร้าง New Model
          </button>
        </div>
      </div>

      <div className="db-quick-stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="db-glass-card" style={{ width: '100%' }}>
          <div className="db-nums-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {quickNums.map((item) => (
              <div className="db-num-item" key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="db-num-value">{item.value}</div>
                    <div className="db-num-label">{item.label}</div>
                  </div>
                  <svg className="db-sparkline" viewBox="0 0 60 28" fill="none">
                    <polyline points={item.sparkPoints} stroke={item.color} strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา เลข New Model, ชื่องาน, แม่พิมพ์..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              onClick={() => setFilterStage('')}
              className={`btn btn-sm ${!filterStage ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '100px' }}
            >
              ทั้งหมด ({total})
            </button>
            {STAGES.filter(s => s.step > 0).map(s => (
              <button
                key={s.key}
                onClick={() => setFilterStage(filterStage === s.key ? '' : s.key)}
                className={`btn btn-sm ${filterStage === s.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.3rem 0.75rem', 
                  borderRadius: '100px',
                  background: filterStage === s.key ? s.color : 'transparent',
                  color: filterStage === s.key ? '#fff' : s.color,
                  borderColor: filterStage === s.key ? s.color : `${s.color}33`,
                }}
              >
                {s.label} {summary[s.key] !== undefined ? `(${summary[s.key]})` : ''}
              </button>
            ))}
          </div>
        </div>

      {loading ? <SkeletonList count={4} /> : (
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)' }}>
          {(() => {
            if (items.length === 0) {
              return (
                <div className="empty-state">
                  <div className="empty-state-icon text-slate-300">
                    <FiClipboard className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="empty-state-title">ไม่พบงาน New Model</div>
                  <p className="mt-2 text-sm text-slate-500 text-center">ลองปรับตัวกรองหรือสร้างโปรเจกต์ใหม่เพื่อเริ่มต้น</p>
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
              <section key={customer} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                  }}>
                    {customer !== 'ไม่ระบุลูกค้า' ? customer.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)', margin: 0 }}>{customer}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>โปรเจกต์ New Model ของลูกค้ารายนี้</p>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                    {groups[customer].length} Projects
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {groups[customer].map((wo) => {
                    const pri = priorityMap[wo.priority] || priorityMap.normal;
                    return (
                      <div
                        key={wo.id}
                        onClick={() => openUpdateModal(wo)}
                        style={{
                          background: 'var(--surface-base)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-color)' }}>{wo.orderCode}</span>
                            <span
                              className="badge"
                              style={{ color: pri.color, backgroundColor: pri.bg, borderColor: pri.color === '#ffffff' ? 'black' : 'transparent', fontSize: '0.75rem' }}
                            >
                              {pri.label}
                            </span>
                            <StagePipeline currentStatus={wo.status} compact />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{typeMap[wo.type] || wo.type}</span>
                        </div>

                        <div className="flex justify-between items-start gap-4 mb-5">
                          <div className="min-w-0 flex-1">
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: '0' }}>{wo.title}</h3>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400" style={{ margin: '0.25rem 0 0 0' }}>{wo.moldCode || wo.mold_code || '-'}</p>
                          </div>
                          <button
                            onClick={(e) => openEditModal(e, wo)}
                            title="แก้ไขข้อมูล"
                            style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>

                        <StagePipeline currentStatus={wo.status} />

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
      </div>

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
