import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiTool, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiCamera, FiImage, FiX } from 'react-icons/fi';
import { maintenanceAPI, moldsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';
import Select from 'react-select';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// Helper: Supabase URLs are full URLs (https://...), legacy local paths start with /uploads/
const getImageUrl = (img) => img?.startsWith('http') ? img : `${API_BASE}${img}`;

const statusMap = {
  pending: { label: 'รอดำเนินการ', color: 'text-gray-600 bg-gray-100' },
  in_progress: { label: 'กำลังซ่อม', color: 'text-orange-600 bg-orange-50' },
  completed: { label: 'เสร็จสิ้น', color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600 bg-red-50' },
};
const typeMap = { repair: 'ซ่อมแซม', pm: 'PM', inspection: 'ตรวจสอบ', cleaning: 'ทำความสะอาด' };

const Maintenance = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, working: 0, done: 0 });

  const fetchData = async (statusParam) => {
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
  };

  const fetchCounts = async () => {
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
  };

  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchData(tab); }, [tab]);

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
      selectedFiles.forEach(file => formData.append('images', file));

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
  const [updateForm, setUpdateForm] = useState({ status: '', assignedToId: '' });
  const [updating, setUpdating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const openUpdateModal = async (item) => {
    setUpdatingItem(item);
    setUpdateForm({
      status: item.status || 'pending',
      assignedToId: item.assignedToId || '',
    });
    try { const { data } = await usersAPI.getAll(); setUserOptions(data); } catch (e) { }
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { status: updateForm.status };
      if (updateForm.assignedToId) payload.assignedToId = updateForm.assignedToId;
      if (updateForm.status === 'completed') payload.completedDate = new Date().toISOString();
      await maintenanceAPI.update(updatingItem.id, payload);
      toast.success('อัปเดตสถานะสำเร็จ');
      setShowUpdateModal(false);
      fetchData(tab); fetchCounts();
    } catch (err) { toast.error(err.response?.data?.message || 'อัปเดตไม่สำเร็จ'); }
    finally { setUpdating(false); }
  };

  const handleUploadMoreImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !updatingItem) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
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

  // ===== Image Lightbox =====
  const [lightboxImg, setLightboxImg] = useState(null);

  const filtered = items;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">งานแจ้งซ่อม</h1>
          <p className="text-gray-500 mt-1">รายการแจ้งซ่อมและบำรุงรักษาแม่พิมพ์</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <Link to="/maintenance/calendar" className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FiCalendar className="mr-2 h-4 w-4" /> ปฏิทินแผนซ่อม
          </Link>
          <button onClick={openModal} className="inline-flex items-center px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
            <FiPlus className="mr-2 h-4 w-4" /> แจ้งซ่อม
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-4">
        {[
          { key: 'all', label: 'ทั้งหมด', icon: FiTool },
          { key: 'pending', label: 'รอดำเนินการ', icon: FiAlertCircle },
          { key: 'working', label: 'กำลังซ่อม', icon: FiClock },
          { key: 'done', label: 'เสร็จสิ้น', icon: FiCheckCircle },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors
              ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-500' : 'bg-gray-200'}`}>
              {counts[t.key]}
            </span>
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
            placeholder="ค้นหา รหัสแม่พิมพ์, รายละเอียด..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cards Grouped by Customer */}
      {loading ? <SkeletonList count={4} /> : (
        <div className="space-y-6">
          {(() => {
            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <FiTool className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ไม่พบรายการงานแจ้งซ่อม</p>
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
              <div key={customer} className="mb-6">
                <div className="flex items-center gap-3 mb-3 pl-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                    {customer !== 'ไม่ระบุลูกค้า' ? customer.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{customer}</h2>
                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {groups[customer].length} รายการ
                  </span>
                </div>

                <div className="space-y-3">
                  {groups[customer].map((item) => {
                    const s = statusMap[item.status] || statusMap.pending;
                    const images = item.images || [];
                    return (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors ml-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{item.requestCode}</span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-blue-600 text-sm">{item.mold?.moldCode || '-'}</span>
                              <span className="text-xs text-gray-500">{typeMap[item.type] || item.type}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                              <span>ผู้รับผิดชอบ: {item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : '-'}</span>
                              <span>วันที่แจ้ง: {item.reportDate ? new Date(item.reportDate).toLocaleDateString('th-TH') : new Date(item.createdAt).toLocaleDateString('th-TH')}</span>
                              <span>วันขึ้นผลิต: {item.productionDate ? new Date(item.productionDate).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                            {/* Thumbnail images */}
                            {images.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <FiImage className="text-gray-400 h-3.5 w-3.5 flex-shrink-0" />
                                {images.slice(0, 3).map((img, i) => (
                                  <img
                                    key={i}
                                    src={getImageUrl(img)}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400"
                                    onClick={(e) => { e.stopPropagation(); setLightboxImg(getImageUrl(img)); }}
                                  />
                                ))}
                                {images.length > 3 && (
                                  <span className="text-xs text-gray-400">+{images.length - 3} รูป</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => openUpdateModal(item)} className={`text-xs font-medium px-3 py-1.5 rounded-full ${s.color} hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all`} title="คลิกเพื่ออัปเดตสถานะ">
                              {s.label}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

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
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="อัปเดตสถานะงานแจ้งซ่อม" size="md">
        {updatingItem && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">{updatingItem.requestCode}</p>
              <p className="text-gray-600 mt-1">{updatingItem.mold?.moldCode} — {updatingItem.description?.substring(0, 60)}</p>
            </div>

            {/* Existing images */}
            {updatingItem.images && updatingItem.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพแนบ</label>
                <div className="flex flex-wrap gap-2">
                  {updatingItem.images.map((img, i) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                      onClick={() => setLightboxImg(getImageUrl(img))}
                    />
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
                  { key: 'pending', label: 'รอดำเนินการ', color: 'border-gray-300 text-gray-600', active: 'bg-gray-100 border-gray-500 ring-2 ring-gray-300' },
                  { key: 'in_progress', label: 'กำลังซ่อม', color: 'border-orange-300 text-orange-600', active: 'bg-orange-50 border-orange-500 ring-2 ring-orange-300' },
                  { key: 'completed', label: 'เสร็จสิ้น', color: 'border-green-300 text-green-600', active: 'bg-green-50 border-green-500 ring-2 ring-green-300' },
                  { key: 'cancelled', label: 'ยกเลิก', color: 'border-red-300 text-red-600', active: 'bg-red-50 border-red-500 ring-2 ring-red-300' },
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
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" disabled={updating} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{updating ? 'กำลังบันทึก...' : 'อัปเดต'}</button>
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
