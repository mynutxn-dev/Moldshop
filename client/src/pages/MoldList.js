import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { moldsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import CreatableSelect from 'react-select/creatable';

const statusMap = {
  active: { label: 'พร้อมใช้งาน', tone: 'badge-success' },
  in_use: { label: 'ใช้งานอยู่', tone: 'badge-primary' },
  maintenance: { label: 'กำลังซ่อม', tone: 'badge-warning' },
  damaged: { label: 'ชำรุด', tone: 'badge-danger' },
  retired: { label: 'ปลดระวาง', tone: 'badge-neutral' },
};

export default function MoldList() {
  const [molds, setMolds] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMolds = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await moldsAPI.getAll(params);
      setMolds(data.molds);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchMolds();
  }, [fetchMolds]);

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบแม่พิมพ์นี้?')) return;
    try {
      await moldsAPI.delete(id);
      toast.success('ลบแม่พิมพ์สำเร็จ');
      fetchMolds();
    } catch (err) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyForm = { moldCode: '', name: '', customer: '', partNumber: '', machineType: '', location: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddMold = async (e) => {
    e.preventDefault();
    if (!form.moldCode || !form.name) { toast.error('กรุณากรอกรหัสและชื่อแม่พิมพ์'); return; }
    setSaving(true);
    try {
      await moldsAPI.create(form);
      toast.success('เพิ่มแม่พิมพ์สำเร็จ');
      setShowAddModal(false);
      setForm(emptyForm);
      fetchMolds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เพิ่มไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const openEditModal = (mold) => {
    setEditingId(mold.id);
    setForm({
      moldCode: mold.moldCode || mold.mold_code || '',
      name: mold.name || '',
      customer: mold.customer || '',
      partNumber: mold.partNumber || '',
      machineType: mold.machineType || '',
      location: mold.location || '',
      notes: mold.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditMold = async (e) => {
    e.preventDefault();
    if (!form.moldCode || !form.name) { toast.error('กรุณากรอกรหัสและชื่อแม่พิมพ์'); return; }
    setSaving(true);
    try {
      await moldsAPI.update(editingId, form);
      toast.success('แก้ไขแม่พิมพ์สำเร็จ');
      setShowEditModal(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchMolds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'แก้ไขไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const filtered = molds;
  const statusCounts = {
    active: molds.filter((mold) => mold.status === 'active').length,
    in_use: molds.filter((mold) => mold.status === 'in_use').length,
    maintenance: molds.filter((mold) => mold.status === 'maintenance').length,
    damaged: molds.filter((mold) => mold.status === 'damaged').length,
  };

  const uniqueCustomers = [...new Set(molds.map(m => m.customer).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const customerOptions = uniqueCustomers.map(c => ({ value: c, label: c }));

  const quickNums = [
    { value: total, label: 'แม่พิมพ์ทั้งหมด', color: '#4a7cff', sparkPoints: '0,5 10,15 20,10 30,20 40,15 50,22 60,18' },
    { value: statusCounts.active, label: 'พร้อมใช้งาน', color: '#22d3b0', sparkPoints: '0,20 10,18 20,22 30,15 40,18 50,12 60,10' },
    { value: statusCounts.maintenance, label: 'กำลังซ่อม', color: '#f59e0b', sparkPoints: '0,10 10,15 20,8 30,12 40,6 50,14 60,8' },
    { value: statusCounts.in_use + statusCounts.damaged, label: 'ใช้งาน/ชำรุด', color: '#ef4444', sparkPoints: '0,15 10,12 20,18 30,22 40,15 50,10 60,14' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ ทะเบียนแม่พิมพ์ (Mold Registry)</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>ตรวจสอบสถานะ ตำแหน่ง และรายชื่อแม่พิมพ์ทั้งหมดในระบบ</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ เพิ่มแม่พิมพ์
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
        <div className="search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อ, ลูกค้า..."
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: '100%', height: '100%' }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">พร้อมใช้งาน</option>
              <option value="in_use">ใช้งานอยู่</option>
              <option value="maintenance">กำลังซ่อม</option>
              <option value="damaged">ชำรุด</option>
              <option value="retired">ปลดระวาง</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อแม่พิมพ์</th>
                <th className="hidden md:table-cell">ลูกค้า</th>
                <th className="hidden lg:table-cell">Mold Size</th>
                <th className="hidden lg:table-cell">ตำแหน่ง</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">กำลังโหลดข้อมูล...</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((mold) => (
                  <tr key={mold.id}>
                    <td><span className="font-medium">{mold.moldCode || mold.mold_code}</span></td>
                    <td>{mold.name}</td>
                    <td className="hidden md:table-cell">{mold.customer || '-'}</td>
                    <td className="hidden lg:table-cell">{mold.machineType || '-'}</td>
                    <td className="hidden lg:table-cell">{mold.location || '-'}</td>
                    <td>
                      <span className={`badge ${(statusMap[mold.status] || statusMap.active).tone}`}>
                        {(statusMap[mold.status] || statusMap.active).label}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/molds/${mold.id}`} className="btn btn-sm btn-secondary">
                          👁️
                        </Link>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(mold)}>
                          ✏️
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(mold.id)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">⚙️</div>
                      <div className="empty-state-title">ไม่พบแม่พิมพ์</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          แสดง {filtered.length} จาก {total} รายการ
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="➕ เพิ่มแม่พิมพ์ใหม่" size="lg">
        <form onSubmit={handleAddMold} className="space-y-4" style={{ marginTop: '1rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label required">รหัสแม่พิมพ์</label>
              <input type="text" name="moldCode" value={form.moldCode} onChange={handleFormChange} required className="form-input" placeholder="MOLD-001" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label required">ชื่อแม่พิมพ์</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} required className="form-input" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">ลูกค้า</label>
              <CreatableSelect
                isClearable
                options={customerOptions}
                value={form.customer ? { value: form.customer, label: form.customer } : null}
                onChange={(selected) => handleFormChange({ target: { name: 'customer', value: selected ? selected.value : '' } })}
                placeholder="เลือกลูกค้า หรือพิมพ์เพิ่ม..."
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-color)',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: 'var(--input-border-focus)' }
                  }),
                  singleValue: (base) => ({ ...base, color: 'var(--text-color)' }),
                  input: (base) => ({ ...base, color: 'var(--text-color)' }),
                  menu: (base) => ({ ...base, backgroundColor: 'var(--card-bg)', zIndex: 9999 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? 'var(--hover-bg)' : 'transparent',
                    color: 'var(--text-color)',
                  })
                }}
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Part Number</label>
              <input type="text" name="partNumber" value={form.partNumber} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Mold Size (Machine Type)</label>
              <input type="text" name="machineType" value={form.machineType} onChange={handleFormChange} className="form-input" placeholder="เช่น Injection 850T" />
            </div>
            <div className="form-group mb-0 sm:col-span-2">
              <label className="form-label">ตำแหน่งจัดเก็บ</label>
              <input type="text" name="location" value={form.location} onChange={handleFormChange} className="form-input" placeholder="เช่น Rack A" />
            </div>
            <div className="form-group mb-0 sm:col-span-2">
              <label className="form-label">หมายเหตุ</label>
              <textarea name="notes" value={form.notes} onChange={handleFormChange} rows="2" className="form-input"></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">ยกเลิก</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setForm(emptyForm); }} title="✏️ แก้ไขแม่พิมพ์" size="lg">
        <form onSubmit={handleEditMold} className="space-y-4" style={{ marginTop: '1rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">รหัสแม่พิมพ์</label>
              <input type="text" name="moldCode" value={form.moldCode} disabled className="form-input" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label required">ชื่อแม่พิมพ์</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} required className="form-input" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">ลูกค้า</label>
              <CreatableSelect
                isClearable
                options={customerOptions}
                value={form.customer ? { value: form.customer, label: form.customer } : null}
                onChange={(selected) => handleFormChange({ target: { name: 'customer', value: selected ? selected.value : '' } })}
                placeholder="เลือกลูกค้า หรือพิมพ์เพิ่ม..."
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-color)',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: 'var(--input-border-focus)' }
                  }),
                  singleValue: (base) => ({ ...base, color: 'var(--text-color)' }),
                  input: (base) => ({ ...base, color: 'var(--text-color)' }),
                  menu: (base) => ({ ...base, backgroundColor: 'var(--card-bg)', zIndex: 9999 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? 'var(--hover-bg)' : 'transparent',
                    color: 'var(--text-color)',
                  })
                }}
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Part Number</label>
              <input type="text" name="partNumber" value={form.partNumber} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Mold Size (Machine Type)</label>
              <input type="text" name="machineType" value={form.machineType} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="form-group mb-0 sm:col-span-2">
              <label className="form-label">ตำแหน่งจัดเก็บ</label>
              <input type="text" name="location" value={form.location} onChange={handleFormChange} className="form-input" />
            </div>
            <div className="form-group mb-0 sm:col-span-2">
              <label className="form-label">หมายเหตุ</label>
              <textarea name="notes" value={form.notes} onChange={handleFormChange} rows="2" className="form-input"></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="btn btn-secondary">ยกเลิก</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
