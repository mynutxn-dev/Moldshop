import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { moldsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import CreatableSelect from 'react-select/creatable';

const statusMap = {
  active: { label: 'พร้อมใช้งาน', tone: 'status-pill-completed' },
  in_use: { label: 'ใช้งานอยู่', tone: 'status-pill-progress' },
  maintenance: { label: 'กำลังซ่อม', tone: 'status-pill-pending' },
  damaged: { label: 'ชำรุด', tone: 'status-pill-cancelled' },
  retired: { label: 'ปลดระวาง', tone: 'status-pill-cancelled' },
};

const MoldList = () => {
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

  return (
    <div className="space-y-6">
      <section className="page-hero animate-fade-in-up">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="page-kicker">Mold Registry</p>
            <h1 className="page-title">จัดการทะเบียนแม่พิมพ์ให้ค้นหาเร็วและเห็นสถานะได้ชัดขึ้น</h1>
            <p className="page-subtitle">
              ตรวจสอบแม่พิมพ์ทั้งหมดในระบบ พร้อมดูสถานะ ลูกค้า ตำแหน่งจัดเก็บ และเข้าถึงหน้า detail หรือแก้ไขข้อมูลได้รวดเร็วจากพื้นที่เดียว
            </p>
          </div>
          <div className="page-actions">
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <FiPlus className="h-4 w-4" /> เพิ่มแม่พิมพ์
            </button>
          </div>
        </div>
        <div className="overview-strip">
          <div className="overview-card overview-card--primary">
            <span className="overview-card-label">แม่พิมพ์ทั้งหมด</span>
            <strong className="overview-card-value">{total}</strong>
            <span className="overview-card-meta">รายการในทะเบียนหลัก</span>
          </div>
          <div className="overview-card overview-card--success">
            <span className="overview-card-label">พร้อมใช้งาน</span>
            <strong className="overview-card-value">{statusCounts.active}</strong>
            <span className="overview-card-meta">พร้อมใช้ใน production</span>
          </div>
          <div className="overview-card overview-card--warning">
            <span className="overview-card-label">กำลังซ่อม</span>
            <strong className="overview-card-value">{statusCounts.maintenance}</strong>
            <span className="overview-card-meta">อยู่ระหว่างซ่อมบำรุง</span>
          </div>
          <div className="overview-card overview-card--neutral">
            <span className="overview-card-label">ใช้งานอยู่ / ชำรุด</span>
            <strong className="overview-card-value">{statusCounts.in_use + statusCounts.damaged}</strong>
            <span className="overview-card-meta">ต้องติดตามเพิ่มเติม</span>
          </div>
        </div>
      </section>

      <div className="filter-surface">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="search-field flex-1">
            <FiSearch className="h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา รหัส, ชื่อ, ลูกค้า..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select sm:w-60"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="active">พร้อมใช้งาน</option>
            <option value="in_use">ใช้งานอยู่</option>
            <option value="maintenance">กำลังซ่อม</option>
            <option value="damaged">ชำรุด</option>
            <option value="retired">ปลดระวาง</option>
          </select>
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} cols={7} /> : (
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="text-left">รหัส</th>
                  <th className="text-left">ชื่อแม่พิมพ์</th>
                  <th className="hidden text-left md:table-cell">ลูกค้า</th>
                  <th className="hidden text-left lg:table-cell">Mold Size</th>
                  <th className="hidden text-left lg:table-cell">ตำแหน่ง</th>
                  <th className="text-left">สถานะ</th>
                  <th className="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mold) => (
                  <tr key={mold.id}>
                    <td className="table-code">{mold.moldCode || mold.mold_code}</td>
                    <td className="text-slate-900">{mold.name}</td>
                    <td className="hidden md:table-cell">{mold.customer || '-'}</td>
                    <td className="hidden lg:table-cell">{mold.machineType || '-'}</td>
                    <td className="hidden lg:table-cell">{mold.location || '-'}</td>
                    <td>
                      <span className={`status-pill ${(statusMap[mold.status] || statusMap.active).tone}`}>
                        {(statusMap[mold.status] || statusMap.active).label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/molds/${mold.id}`} className="action-icon-button" title="ดูรายละเอียด">
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => openEditModal(mold)} className="action-icon-button" title="แก้ไข">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(mold.id)} className="action-icon-button is-danger" title="ลบ">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-note">
            แสดง {filtered.length} จาก {total} รายการ
          </div>
        </div>
      )}

      {/* Add Mold Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="เพิ่มแม่พิมพ์ใหม่" size="lg">
        <form onSubmit={handleAddMold} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสแม่พิมพ์ *</label>
              <input type="text" name="moldCode" value={form.moldCode} onChange={handleFormChange} placeholder="เช่น MOLD-009" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแม่พิมพ์ *</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="เช่น แม่พิมพ์ฝาครอบ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
              <CreatableSelect
                isClearable
                options={customerOptions}
                value={form.customer ? { value: form.customer, label: form.customer } : null}
                onChange={(selected) => handleFormChange({ target: { name: 'customer', value: selected ? selected.value : '' } })}
                placeholder="เลือกลูกค้า หรือพิมพ์เพื่อเพิ่มใหม่..."
                className="text-sm"
                styles={{
                  control: (base) => ({ ...base, borderColor: '#d1d5db', borderRadius: '0.5rem', padding: '2px 0' }),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input type="text" name="partNumber" value={form.partNumber} onChange={handleFormChange} placeholder="เช่น TYT-FC-2024-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mold Size</label>
              <input type="text" name="machineType" value={form.machineType} onChange={handleFormChange} placeholder="เช่น Injection 850T" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งจัดเก็บ</label>
              <input type="text" name="location" value={form.location} onChange={handleFormChange} placeholder="เช่น Rack A-01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea name="notes" value={form.notes} onChange={handleFormChange} rows="2" placeholder="รายละเอียดเพิ่มเติม..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Mold Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setForm(emptyForm); }} title="แก้ไขแม่พิมพ์" size="lg">
        <form onSubmit={handleEditMold} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสแม่พิมพ์</label>
              <input type="text" name="moldCode" value={form.moldCode} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแม่พิมพ์ *</label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="เช่น แม่พิมพ์ฝาครอบ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
              <CreatableSelect
                isClearable
                options={customerOptions}
                value={form.customer ? { value: form.customer, label: form.customer } : null}
                onChange={(selected) => handleFormChange({ target: { name: 'customer', value: selected ? selected.value : '' } })}
                placeholder="เลือกลูกค้า หรือพิมพ์เพื่อเพิ่มใหม่..."
                className="text-sm"
                styles={{
                  control: (base) => ({ ...base, borderColor: '#d1d5db', borderRadius: '0.5rem', padding: '2px 0' }),
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input type="text" name="partNumber" value={form.partNumber} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mold Size</label>
              <input type="text" name="machineType" value={form.machineType} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งจัดเก็บ</label>
              <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea name="notes" value={form.notes} onChange={handleFormChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MoldList;
