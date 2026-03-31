import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiTool, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiCamera, FiX, FiEdit2, FiUser, FiArrowLeft } from 'react-icons/fi';
import { maintenanceAPI, moldsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';
import Select from 'react-select';
import imageCompression from 'browser-image-compression';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// Helper: Supabase URLs are full URLs (https://...), legacy local paths start with /uploads/
const getImageUrl = (img) => img?.startsWith('http') ? img : `${API_BASE}${img}`;

// Helper: Compress image before upload
const compressImage = async (file) => {
  const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1600, useWebWorker: true };
  try { return await imageCompression(file, options); }
  catch (error) { console.error('Compression error:', error); return file; }
};

const statusMap = {
  pending: { label: 'รอดำเนินการ', tone: 'status-pill-pending' },
  in_progress: { label: 'กำลังซ่อม', tone: 'status-pill-progress' },
  completed: { label: 'เสร็จสิ้น', tone: 'status-pill-completed' },
  cancelled: { label: 'ยกเลิก', tone: 'status-pill-cancelled' },
};
const typeMap = { repair: 'ซ่อมแซม', pm: 'PM', inspection: 'ตรวจสอบ', cleaning: 'ทำความสะอาด' };
const maintenanceTabs = [
  { key: 'all', label: 'ทั้งหมด', icon: FiTool },
  { key: 'pending', label: 'รอดำเนินการ', icon: FiAlertCircle },
  { key: 'working', label: 'กำลังซ่อม', icon: FiClock },
  { key: 'done', label: 'เสร็จสิ้น', icon: FiCheckCircle },
];

const Maintenance = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, working: 0, done: 0 });

  const fetchData = useCallback(async (statusParam) => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (statusParam && statusParam !== 'all') {
        const statusKey = { pending: 'pending', working: 'in_progress', done: 'completed' }[statusParam];
        if (statusKey) params.status = statusKey;
      }
      if (search) params.search = search;
      const { data } = await maintenanceAPI.getAll(params);
      setItems(data.requests);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, pendingRes, workingRes, doneRes] = await Promise.all([
        maintenanceAPI.getAll({ limit: 1 }),
        maintenanceAPI.getAll({ limit: 1, status: 'pending' }),
        maintenanceAPI.getAll({ limit: 1, status: 'in_progress' }),
        maintenanceAPI.getAll({ limit: 1, status: 'completed' }),
      ]);
      setCounts({
        all: allRes.data.total,
        pending: pendingRes.data.total,
        working: workingRes.data.total,
        done: doneRes.data.total,
      });
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  // ===== Create Modal =====
  const [showModal, setShowModal] = useState(false);
  const [moldOptions, setMoldOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const emptyForm = { moldId: '', type: 'repair', description: '', reportDate: new Date().toISOString().split('T')[0], productionDate: '' };
  const [form, setForm] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  const openModal = async () => {
    try { const { data } = await moldsAPI.getAll({ limit: 200 }); setMoldOptions(data.molds); } catch (e) { }
    setForm(emptyForm);
    setSelectedCustomer('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowModal(true);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast.error('อัพโหลดได้สูงสุด 5 รูป');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.moldId || !form.description) {
      toast.error('กรุณาเลือกแม่พิมพ์และกรอกรายละเอียด');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('moldId', form.moldId);
      formData.append('type', form.type);
      formData.append('description', form.description);
      if (form.reportDate) formData.append('reportDate', form.reportDate);
      if (form.productionDate) formData.append('productionDate', form.productionDate);

      for (const file of selectedFiles) {
        const compressedFile = await compressImage(file);
        formData.append('images', compressedFile, compressedFile.name || file.name || 'image.jpg');
      }

      await maintenanceAPI.create(formData);
      toast.success('แจ้งซ่อมสำเร็จ');
      setShowModal(false);
      setForm(emptyForm);
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchData(tab);
      fetchCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'แจ้งซ่อมไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // ===== Update / Detail Modal =====
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [updateForm, setUpdateForm] = useState({ status: '', assignedToId: '', description: '', type: 'repair', reportDate: '', productionDate: '' });
  const [updating, setUpdating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [closing, setClosing] = useState(false);

  const openUpdateModal = async (item) => {
    setUpdatingItem(item);
    setUpdateForm({
      status: item.status || 'pending',
      assignedToId: item.assignedToId || '',
      description: item.description || '',
      type: item.type || 'repair',
      reportDate: item.reportDate || '',
      productionDate: item.productionDate || '',
    });
    try { const { data } = await usersAPI.getAll(); setUserOptions(data); } catch (e) { }
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        status: updateForm.status,
        description: updateForm.description,
        type: updateForm.type,
        reportDate: updateForm.reportDate || null,
        productionDate: updateForm.productionDate || null,
      };
      if (updateForm.assignedToId) payload.assignedToId = updateForm.assignedToId;
      if (updateForm.status === 'completed') payload.completedDate = new Date().toISOString();
      await maintenanceAPI.update(updatingItem.id, payload);
      toast.success('อัปเดตสำเร็จ');
      setShowUpdateModal(false);
      fetchData(tab); fetchCounts();
    } catch (err) { toast.error(err.response?.data?.message || 'อัปเดตไม่สำเร็จ'); }
    finally { setUpdating(false); }
  };

  const handleCloseRequest = async () => {
    if (!updatingItem) return;
    setClosing(true);
    try {
      await maintenanceAPI.update(updatingItem.id, { status: 'cancelled' });
      toast.success('ปิดงานแจ้งซ่อมสำเร็จ');
      setShowUpdateModal(false);
      fetchData(tab); fetchCounts();
    } catch (err) { toast.error('ปิดงานไม่สำเร็จ'); }
    finally { setClosing(false); }
  };

  const handleUploadMoreImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !updatingItem) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        const compressedFile = await compressImage(file);
        formData.append('images', compressedFile, compressedFile.name || file.name || 'image.jpg');
      }
      const { data } = await maintenanceAPI.uploadImages(updatingItem.id, formData);
      setUpdatingItem(data);
      toast.success('อัพโหลดรูปสำเร็จ');
      fetchData(tab);
    } catch (err) {
      toast.error('อัพโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!updatingItem) return;
    try {
      const { data } = await maintenanceAPI.deleteImage(updatingItem.id, imageUrl);
      setUpdatingItem(data);
      toast.success('ลบรูปสำเร็จ');
      fetchData(tab);
    } catch (err) {
      toast.error('ลบรูปไม่สำเร็จ');
    }
  };

  // ===== Image Lightbox =====
  const [lightboxImg, setLightboxImg] = useState(null);

  const filtered = items;
  const quickNums = [
    { value: total, label: 'ทั้งหมด', color: '#4a7cff', sparkPoints: '0,5 10,15 20,10 30,20 40,15 50,22 60,18' },
    { value: counts.pending, label: 'รอดำเนินการ', color: '#f59e0b', sparkPoints: '0,20 10,18 20,22 30,15 40,18 50,12 60,10' },
    { value: counts.working, label: 'กำลังซ่อม', color: '#3b82f6', sparkPoints: '0,10 10,15 20,8 30,12 40,6 50,14 60,8' },
    { value: counts.done, label: 'เสร็จสิ้น', color: '#10b981', sparkPoints: '0,15 10,12 20,18 30,22 40,15 50,10 60,14' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 จัดการงานแจ้งซ่อม (Maintenance)</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>ติดตามสถานะ อัปเดตงาน และบำรุงรักษาแม่พิมพ์</p>
        </div>
        <div className="page-header-actions flex gap-2">
          <Link to="/maintenance/calendar" className="btn btn-secondary">
            <FiCalendar className="mr-1 h-4 w-4 inline" /> ปฏิทินแผนซ่อม
          </Link>
          <button onClick={openModal} className="btn btn-primary">
            <FiPlus className="mr-1 h-4 w-4 inline" /> แจ้งซ่อม
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
              placeholder="ค้นหา รหัสแม่พิมพ์, รายละเอียด, หรือ request code..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {maintenanceTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', borderRadius: '100px' }}
              >
                <t.icon className="mr-1 h-3 w-3 inline" /> {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>
        </div>

      {loading ? <SkeletonList count={4} /> : (
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)' }}>
          {(() => {
            if (filtered.length === 0) {
              return (
                <div className="empty-state">
                  <div className="empty-state-icon text-slate-300">
                    <FiTool className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="empty-state-title">ไม่พบรายการงานแจ้งซ่อม</div>
                  <p className="mt-2 text-sm text-slate-500 text-center">ลองปรับคำค้นหาหรือเปิดงานแจ้งซ่อมใหม่เพื่อเริ่มต้น</p>
                </div>
              );
            }

            // 1) Group items by customer
            const groups = filtered.reduce((acc, item) => {
              const cust = item.mold?.customer ? item.mold.customer.trim() : 'ไม่ระบุลูกค้า';
              if (!acc[cust]) acc[cust] = [];
              acc[cust].push(item);
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
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>กลุ่มงานแจ้งซ่อมของลูกค้ารายนี้</p>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                    {groups[customer].length} งาน
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {groups[customer].map((item) => {
                    const s = statusMap[item.status] || statusMap.pending;
                    const images = item.images || [];
                    return (
                      <div
                        key={item.id}
                        onClick={() => openUpdateModal(item)}
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
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{item.requestCode}</span>
                              <span style={{ color: 'var(--border-color)' }}>|</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{item.mold?.moldCode || '-'}</span>
                              <span className={`badge ${s.tone}`}>{s.label}</span>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: '0 0 0.5rem 0' }}>{item.mold_name || item.moldName || item.mold?.name || '-'}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.75rem' }}>{item.description}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FiTool /> {typeMap[item.type] || item.type}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FiUser /> {item.assignedTo ? `${item.assignedTo.firstName}` : 'ยังไม่มอบหมาย'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FiCalendar /> {item.reportDate ? new Date(item.reportDate).toLocaleDateString('th-TH') : '-'}</span>
                            </div>

                            {images.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                {images.slice(0, 4).map((img, i) => (
                                  <img
                                    key={i}
                                    src={getImageUrl(img)}
                                    alt=""
                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                                    onClick={(e) => { e.stopPropagation(); setLightboxImg(getImageUrl(img)); }}
                                  />
                                ))}
                                {images.length > 4 && (
                                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                                    +{images.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end">
                            <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' 
                            }}>
                              <FiArrowLeft className="h-4 w-4 rotate-180" />
                            </div>
                          </div>
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

      {/* ===== Create Maintenance Modal ===== */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="แจ้งงานแจ้งซ่อม" size="md">
        {(() => {
          // 1) Compute unique customers from moldOptions
          const rawCustomers = moldOptions.map(m => m.customer).filter(Boolean);
          const uniqueCustomers = [...new Set(rawCustomers)].sort((a, b) => a.localeCompare(b));

          // 2) Filter molds based on selectedCustomer
          const filteredMolds = selectedCustomer
            ? moldOptions.filter(m => m.customer === selectedCustomer)
            : moldOptions.sort((a, b) => a.moldCode.localeCompare(b.moldCode));

          return (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลือกลูกค้า (Customer) - ตัวกรอง</label>
                <Select
                  options={uniqueCustomers.map(c => ({ value: c, label: c }))}
                  value={selectedCustomer ? { value: selectedCustomer, label: selectedCustomer } : null}
                  onChange={(selected) => {
                    setSelectedCustomer(selected ? selected.value : '');
                    setForm({ ...form, moldId: '' }); // Reset mold when customer changes
                  }}
                  isClearable
                  placeholder="-- แสดงแม่พิมพ์ทั้งหมด --"
                  className="text-sm"
                  styles={{
                    control: (base) => ({ ...base, borderColor: '#d1d5db', borderRadius: '0.5rem', padding: '2px 0' }),
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แม่พิมพ์ *</label>
                <Select
                  options={filteredMolds.map(m => ({ value: m.id, label: `${m.moldCode} - ${m.name}` }))}
                  value={form.moldId ? { value: form.moldId, label: filteredMolds.find(m => m.id === form.moldId)?.moldCode + ' - ' + filteredMolds.find(m => m.id === form.moldId)?.name } : null}
                  onChange={(selected) => handleFormChange({ target: { name: 'moldId', value: selected ? selected.value : '' } })}
                  isClearable
                  placeholder={selectedCustomer ? `เลือกแม่พิมพ์ของ ${selectedCustomer}...` : 'เลือกแม่พิมพ์...'}
                  className="text-sm"
                  styles={{
                    control: (base) => ({ ...base, borderColor: '#d1d5db', borderRadius: '0.5rem', padding: '2px 0' }),
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท *</label>
                  <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="repair">ซ่อมแซม</option>
                    <option value="pm">PM (บำรุงรักษา)</option>
                    <option value="inspection">ตรวจสอบ</option>
                    <option value="cleaning">ทำความสะอาด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่แจ้งซ่อม</label>
                  <input type="date" name="reportDate" value={form.reportDate} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันขึ้นผลิต (Production Date)</label>
                  <input type="date" name="productionDate" value={form.productionDate} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด *</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows="3" placeholder="อธิบายอาการและสิ่งที่ต้องการซ่อม..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แนบรูปภาพ (สูงสุด 5 รูป)</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <FiCamera className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">เลือกรูปภาพ หรือถ่ายรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
                <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'แจ้งซ่อม'}</button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* ===== Update / Detail Modal ===== */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="แก้ไข / อัปเดตงานแจ้งซ่อม" size="md">
        {updatingItem && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{updatingItem.requestCode}</p>
                <p className="text-gray-600 mt-0.5">{updatingItem.mold?.moldCode} — {updatingItem.mold?.name}</p>
              </div>
              <FiEdit2 className="h-4 w-4 text-gray-400" />
            </div>

            {/* Editable fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea
                value={updateForm.description}
                onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                <select value={updateForm.type} onChange={(e) => setUpdateForm({ ...updateForm, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="repair">ซ่อมแซม</option>
                  <option value="pm">PM</option>
                  <option value="inspection">ตรวจสอบ</option>
                  <option value="cleaning">ทำความสะอาด</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่แจ้ง</label>
                <input type="date" value={updateForm.reportDate} onChange={(e) => setUpdateForm({ ...updateForm, reportDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันขึ้นผลิต</label>
                <input type="date" value={updateForm.productionDate} onChange={(e) => setUpdateForm({ ...updateForm, productionDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Existing images */}
            {updatingItem.images && updatingItem.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพแนบ ({updatingItem.images.length} รูป)</label>
                <div className="flex flex-wrap gap-2">
                  {updatingItem.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={() => setLightboxImg(getImageUrl(img))}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
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

            {/* Upload more images */}
            <div>
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors w-fit">
                <FiCamera className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{uploadingImages ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปเพิ่ม'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadMoreImages}
                  className="hidden"
                  disabled={uploadingImages}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'pending', label: 'รอดำเนินการ', color: 'border-amber-300 text-amber-600', active: 'bg-amber-50 border-amber-500 ring-2 ring-amber-300' },
                  { key: 'in_progress', label: 'กำลังซ่อม', color: 'border-blue-300 text-blue-600', active: 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' },
                  { key: 'completed', label: 'เสร็จสิ้น', color: 'border-emerald-300 text-emerald-600', active: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300' },
                  { key: 'cancelled', label: 'ยกเลิก', color: 'border-gray-300 text-gray-500', active: 'bg-gray-100 border-gray-500 ring-2 ring-gray-300' },
                ].map(s => (
                  <button
                    key={s.key} type="button"
                    onClick={() => setUpdateForm({ ...updateForm, status: s.key })}
                    className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${updateForm.status === s.key ? s.active : s.color + ' hover:bg-gray-50'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">มอบหมายช่าง</label>
              <select value={updateForm.assignedToId} onChange={(e) => setUpdateForm({ ...updateForm, assignedToId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">ยังไม่มอบหมาย</option>
                {userOptions.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseRequest}
                disabled={closing || updatingItem.status === 'cancelled'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiX className="mr-1.5 h-4 w-4" />
                {closing ? 'กำลังปิดงาน...' : 'ปิดงาน'}
              </button>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
                <button type="submit" disabled={updating} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{updating ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </div>
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

export default Maintenance;
