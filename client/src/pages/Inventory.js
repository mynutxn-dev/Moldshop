import React, { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle, FiClock, FiShoppingCart, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

const statusMap = {
  available: { label: 'พร้อมใช้', color: 'text-green-600 bg-green-50' },
  low_stock: { label: 'ใกล้หมด', color: 'text-orange-600 bg-orange-50' },
  out_of_stock: { label: 'หมดสต๊อค', color: 'text-red-600 bg-red-50' },
};

const STORAGE_KEY = 'moldshop_inventory';
const HISTORY_KEY = 'moldshop_inventory_history';

// ข้อมูลตัวอย่างเริ่มต้น
const defaultItems = [
  { id: 'inv-1', itemCode: 'BLT-001', itemName: 'สกรูหัวจม M8x30', category: 'น๊อต/สกรู', location: 'ชั้น A-01', quantity: 150, minStock: 50, unit: 'ตัว', notes: 'ใช้กับงาน Mold ทั่วไป' },
  { id: 'inv-2', itemCode: 'BLT-002', itemName: 'สกรูหัวจม M10x40', category: 'น๊อต/สกรู', location: 'ชั้น A-01', quantity: 80, minStock: 30, unit: 'ตัว', notes: '' },
  { id: 'inv-3', itemCode: 'BLT-003', itemName: 'น๊อตหกเหลี่ยม M12', category: 'น๊อต/สกรู', location: 'ชั้น A-02', quantity: 100, minStock: 40, unit: 'ตัว', notes: '' },
  { id: 'inv-4', itemCode: 'EMI-001', itemName: 'ดอกเอ็นมิล Ø10 Carbide', category: 'เครื่องมือตัด', location: 'ตู้เครื่องมือ B', quantity: 5, minStock: 3, unit: 'ชิ้น', notes: '4 ฟัน, ความยาว 75mm' },
  { id: 'inv-5', itemCode: 'EMI-002', itemName: 'ดอกเอ็นมิล Ø16 Carbide', category: 'เครื่องมือตัด', location: 'ตู้เครื่องมือ B', quantity: 3, minStock: 2, unit: 'ชิ้น', notes: '4 ฟัน' },
  { id: 'inv-6', itemCode: 'DRL-001', itemName: 'ดอกสว่าน Ø8.5 HSS', category: 'เครื่องมือตัด', location: 'ตู้เครื่องมือ B', quantity: 10, minStock: 5, unit: 'ชิ้น', notes: '' },
  { id: 'inv-7', itemCode: 'INS-001', itemName: 'เม็ดมีด CNMG 120408', category: 'เม็ดมีด/Insert', location: 'ตู้เครื่องมือ C', quantity: 20, minStock: 10, unit: 'เม็ด', notes: 'สำหรับงานกลึง' },
  { id: 'inv-8', itemCode: 'PIN-001', itemName: 'Ejector Pin Ø6x200', category: 'อะไหล่ Mold', location: 'ชั้น D-01', quantity: 25, minStock: 10, unit: 'ชิ้น', notes: '' },
  { id: 'inv-9', itemCode: 'PIN-002', itemName: 'Ejector Pin Ø8x250', category: 'อะไหล่ Mold', location: 'ชั้น D-01', quantity: 15, minStock: 8, unit: 'ชิ้น', notes: '' },
  { id: 'inv-10', itemCode: 'SPR-001', itemName: 'สปริงแม่พิมพ์ TF25x50', category: 'อะไหล่ Mold', location: 'ชั้น D-02', quantity: 30, minStock: 10, unit: 'ชิ้น', notes: 'สีเขียว (Medium)' },
  { id: 'inv-11', itemCode: 'GRS-001', itemName: 'จารบีหล่อลื่น Mold', category: 'วัสดุสิ้นเปลือง', location: 'ชั้น E-01', quantity: 8, minStock: 3, unit: 'กระป๋อง', notes: '' },
  { id: 'inv-12', itemCode: 'POL-001', itemName: 'กระดาษทราย #400', category: 'วัสดุสิ้นเปลือง', location: 'ชั้น E-02', quantity: 50, minStock: 20, unit: 'แผ่น', notes: 'สำหรับขัด Mold' },
];

const categories = ['น๊อต/สกรู', 'เครื่องมือตัด', 'เม็ดมีด/Insert', 'อะไหล่ Mold', 'วัสดุสิ้นเปลือง', 'อุปกรณ์วัด', 'อื่นๆ'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [withdrawItem, setWithdrawItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'history'

  const emptyForm = { itemCode: '', itemName: '', category: '', location: '', quantity: 0, minStock: 0, unit: 'ชิ้น', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const emptyWithdrawForm = { quantity: 1, withdrawBy: '', purpose: '', moldCode: '' };
  const [withdrawForm, setWithdrawForm] = useState(emptyWithdrawForm);

  // โหลดจาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(defaultItems);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    setLoading(false);
  }, []);

  // บันทึกลง localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history, loading]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const openWithdrawModal = (item) => {
    setWithdrawItem(item);
    setWithdrawForm({ ...emptyWithdrawForm, quantity: 1 });
    setShowWithdrawModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.itemCode || !form.itemName) {
      toast.error('กรุณากรอกรหัสและชื่อรายการ');
      return;
    }
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...form } : i));
      toast.success('อัปเดตรายการสำเร็จ');
    } else {
      const newItem = { ...form, id: `inv-${Date.now()}`, quantity: parseInt(form.quantity) || 0, minStock: parseInt(form.minStock) || 0 };
      setItems(prev => [newItem, ...prev]);
      toast.success('เพิ่มรายการสำเร็จ');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditingItem(null);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!withdrawItem) return;
    const qty = parseInt(withdrawForm.quantity) || 0;
    if (qty <= 0) { toast.error('กรุณาระบุจำนวนที่ต้องการเบิก'); return; }
    if (qty > withdrawItem.quantity) { toast.error(`ของในสต๊อคมีเพียง ${withdrawItem.quantity} ${withdrawItem.unit}`); return; }
    if (!withdrawForm.withdrawBy.trim()) { toast.error('กรุณาระบุชื่อผู้เบิก'); return; }

    // ตัดยอด
    setItems(prev => prev.map(i =>
      i.id === withdrawItem.id ? { ...i, quantity: i.quantity - qty } : i
    ));

    // บันทึกประวัติ
    const record = {
      id: `wh-${Date.now()}`,
      itemId: withdrawItem.id,
      itemCode: withdrawItem.itemCode,
      itemName: withdrawItem.itemName,
      unit: withdrawItem.unit,
      quantity: qty,
      withdrawBy: withdrawForm.withdrawBy.trim(),
      purpose: withdrawForm.purpose.trim(),
      moldCode: withdrawForm.moldCode.trim(),
      date: new Date().toISOString(),
    };
    setHistory(prev => [record, ...prev]);

    toast.success(`เบิก ${withdrawItem.itemName} จำนวน ${qty} ${withdrawItem.unit} สำเร็จ`);
    setShowWithdrawModal(false);
    setWithdrawItem(null);
    setWithdrawForm(emptyWithdrawForm);
  };

  const handleDelete = (id) => {
    if (!window.confirm('แน่ใจจะลบรายการนี้?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('ลบรายการสำเร็จ');
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.itemCode.toLowerCase().includes(search.toLowerCase()) || item.itemName.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getStatus = (item) => {
    if (item.quantity <= 0) return 'out_of_stock';
    if (item.quantity <= item.minStock) return 'low_stock';
    return 'available';
  };

  const lowStock = filtered.filter(i => i.quantity <= i.minStock);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสต๊อค</h1>
          <p className="text-gray-500 mt-1 text-sm">อุปกรณ์ เครื่องมือ และวัสดุสำหรับงาน Moldshop</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors btn-press">
            <FiPlus className="mr-2 h-4 w-4" /> เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-xl p-1 max-w-xs">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'stock' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiPackage className="mr-1.5 h-4 w-4" /> สต๊อค
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiList className="mr-1.5 h-4 w-4" /> ประวัติเบิก
          {history.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{history.length}</span>}
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</p>
                </div>
                <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center">
                  <FiPackage className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">พร้อมใช้</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{filtered.filter(i => getStatus(i) === 'available').length}</p>
                </div>
                <div className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">ใกล้หมด</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{filtered.filter(i => getStatus(i) === 'low_stock').length}</p>
                </div>
                <div className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center">
                  <FiClock className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">หมดสต๊อค</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{filtered.filter(i => getStatus(i) === 'out_of_stock').length}</p>
                </div>
                <div className="w-10 h-10 gradient-red rounded-xl flex items-center justify-center">
                  <FiAlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหา รหัส, ชื่ออุปกรณ์..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">หมวดหมู่ทั้งหมด</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? <SkeletonTable rows={8} cols={7} /> : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อรายการ</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">หมวดหมู่</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">ที่จัดเก็บ</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">คงเหลือ</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item) => {
                      const status = getStatus(item);
                      const st = statusMap[status];
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors table-row-hover">
                          <td className="px-4 py-3 font-medium text-blue-600">{item.itemCode}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.itemName}</p>
                              {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.category}</td>
                          <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{item.location}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${status !== 'available' ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.quantity} {item.unit}
                            </span>
                            <p className="text-xs text-gray-400">ขั้นต่ำ {item.minStock}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => openWithdrawModal(item)}
                                disabled={item.quantity <= 0}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                title="เบิกของ"
                              >
                                <FiShoppingCart className="h-4 w-4" />
                              </button>
                              <button onClick={() => openModal(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <FiPackage className="h-12 w-12 mx-auto mb-3" />
                  <p>ไม่พบรายการสต๊อค</p>
                </div>
              )}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                แสดง {filtered.length} จาก {items.length} รายการ
                {lowStock.length > 0 && <span className="ml-2 text-orange-600 font-medium">⚠️ {lowStock.length} รายการใกล้หมด</span>}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ===== ประวัติเบิกของ ===== */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">วันที่/เวลา</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">รายการ</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">จำนวน</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">ผู้เบิก</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">วัตถุประสงค์</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">รหัส Mold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                      <br />
                      {new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">{record.itemCode}</td>
                    <td className="px-4 py-3 text-gray-900">{record.itemName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                        -{record.quantity} {record.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{record.withdrawBy}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{record.purpose || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{record.moldCode || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <FiList className="h-12 w-12 mx-auto mb-3" />
              <p>ยังไม่มีประวัติการเบิกของ</p>
            </div>
          )}
          {history.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              ทั้งหมด {history.length} รายการ
            </div>
          )}
        </div>
      )}

      {/* ===== Add/Edit Modal ===== */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสรายการ *</label>
              <input type="text" value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} placeholder="เช่น BLT-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการ *</label>
              <input type="text" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="เช่น สกรูหัวจม M8x30" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">เลือกหมวดหมู่...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ที่จัดเก็บ</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="เช่น ชั้น A-01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนขั้นต่ำ</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="ชิ้น">ชิ้น</option>
                <option value="ตัว">ตัว</option>
                <option value="เม็ด">เม็ด</option>
                <option value="แผ่น">แผ่น</option>
                <option value="ชุด">ชุด</option>
                <option value="เซ็ต">เซ็ต</option>
                <option value="กระป๋อง">กระป๋อง</option>
                <option value="ขวด">ขวด</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="2" placeholder="รายละเอียดเพิ่มเติม..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Withdraw Modal ===== */}
      <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="เบิกของจากสต๊อค" size="md">
        {withdrawItem && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* รายการที่เบิก */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiPackage className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{withdrawItem.itemName}</p>
                  <p className="text-sm text-gray-500">{withdrawItem.itemCode} · คงเหลือ <span className="font-bold text-blue-600">{withdrawItem.quantity} {withdrawItem.unit}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่เบิก *</label>
                <input
                  type="number"
                  value={withdrawForm.quantity}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, quantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  max={withdrawItem.quantity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">สูงสุด {withdrawItem.quantity} {withdrawItem.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้เบิก *</label>
                <input
                  type="text"
                  value={withdrawForm.withdrawBy}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, withdrawBy: e.target.value })}
                  placeholder={user.firstName || 'ชื่อผู้เบิก'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัส Mold (ถ้ามี)</label>
                <input
                  type="text"
                  value={withdrawForm.moldCode}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, moldCode: e.target.value })}
                  placeholder="เช่น MOLD-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วัตถุประสงค์</label>
                <input
                  type="text"
                  value={withdrawForm.purpose}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, purpose: e.target.value })}
                  placeholder="เช่น ซ่อม Mold, งาน New Model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* สรุปหลังเบิก */}
            {withdrawForm.quantity > 0 && withdrawForm.quantity <= withdrawItem.quantity && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">คงเหลือก่อนเบิก</span>
                  <span className="font-medium">{withdrawItem.quantity} {withdrawItem.unit}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>เบิกออก</span>
                  <span className="font-medium">-{withdrawForm.quantity} {withdrawItem.unit}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 mt-2 pt-2 font-bold text-gray-900">
                  <span>คงเหลือหลังเบิก</span>
                  <span className={withdrawItem.quantity - withdrawForm.quantity <= withdrawItem.minStock ? 'text-red-600' : ''}>
                    {withdrawItem.quantity - withdrawForm.quantity} {withdrawItem.unit}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                <FiShoppingCart className="inline mr-1.5 h-4 w-4" /> ยืนยันเบิกของ
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
