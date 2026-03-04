import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { moldsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import CreatableSelect from 'react-select/creatable';

const statusMap = {
  active: { label: 'พร้อมใช้งาน', color: 'text-green-600 bg-green-50' },
  in_use: { label: 'ใช้งานอยู่', color: 'text-blue-600 bg-blue-50' },
  maintenance: { label: 'กำลังซ่อม', color: 'text-orange-600 bg-orange-50' },
  damaged: { label: 'ชำรุด', color: 'text-red-600 bg-red-50' },
  retired: { label: 'ปลดระวาง', color: 'text-gray-600 bg-gray-100' },
};

const MoldList = () => {
  const [molds, setMolds] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMolds = async () => {
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
  };

  useEffect(() => {
    fetchMolds();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMolds();
  };

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

  const uniqueCustomers = [...new Set(molds.map(m => m.customer).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const customerOptions = uniqueCustomers.map(c => ({ value: c, label: c }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการแม่พิมพ์</h1>
          <p className="text-gray-500 mt-1">ทะเบียนแม่พิมพ์ทั้งหมดในระบบ</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="mr-2 h-4 w-4" /> เพิ่มแม่พิมพ์
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา รหัส, ชื่อ, ลูกค้า..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

      {/* Table */}
      {loading ? <SkeletonTable rows={6} cols={7} /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อแม่พิมพ์</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">ลูกค้า</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Mold Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">ตำแหน่ง</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((mold) => (
                  <tr key={mold.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">{mold.moldCode || mold.mold_code}</td>
                    <td className="px-4 py-3 text-gray-900">{mold.name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{mold.customer}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{mold.machineType || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{mold.location}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${(statusMap[mold.status] || statusMap.active).color}`}>
                        {(statusMap[mold.status] || statusMap.active).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <Link to={`/molds/${mold.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => openEditModal(mold)} className="p-1.5 text-gray-400 hover:text-orange-600 rounded hover:bg-orange-50">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(mold.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
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
