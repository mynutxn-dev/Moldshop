import React, { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiSearch, FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle, FiClock, FiShoppingCart, FiList, FiPlusCircle, FiArrowUp, FiArrowDown, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { inventoryAPI } from '../services/api';

const statusMap = {
  available: { label: 'พร้อมใช้', color: 'text-green-600 bg-green-50' },
  low_stock: { label: 'ใกล้หมด', color: 'text-orange-600 bg-orange-50' },
  out_of_stock: { label: 'หมดสต๊อค', color: 'text-red-600 bg-red-50' },
};


const categories = ['น๊อต/สกรู', 'เครื่องมือตัด', 'เม็ดมีด/Insert', 'อะไหล่ Mold', 'วัสดุสิ้นเปลือง', 'อุปกรณ์วัด', 'อื่นๆ'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInItem, setStockInItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [withdrawItem, setWithdrawItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');

  const emptyForm = { itemCode: '', itemName: '', category: '', location: '', quantity: 0, minStock: 0, unit: 'ชิ้น', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const emptyWithdrawForm = { quantity: 1, withdrawBy: '', purpose: '', moldCode: '' };
  const emptyStockInForm = { quantity: 1, receivedBy: '', supplier: '', notes: '' };
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stockInForm, setStockInForm] = useState(emptyStockInForm);
  const [withdrawForm, setWithdrawForm] = useState(emptyWithdrawForm);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll();
      setItems(res.data);
    } catch (error) {
      toast.error('โหลดข้อมูลสต๊อคไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await inventoryAPI.getHistory();
      setHistory(res.data);
    } catch (error) {
      toast.error('โหลดประวัติไม่สำเร็จ');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

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

  const openStockInModal = (item) => {
    setStockInItem(item);
    setStockInForm({ ...emptyStockInForm });
    setShowStockInModal(true);
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!stockInItem) return;
    const qty = parseInt(stockInForm.quantity) || 0;
    if (qty <= 0) { toast.error('กรุณาระบุจำนวนที่ต้องการรับเข้า'); return; }
    if (!stockInForm.receivedBy.trim()) { toast.error('กรุณาระบุชื่อผู้รับของ'); return; }
    try {
      await inventoryAPI.stockIn(stockInItem.id, {
        quantity: qty,
        performedBy: stockInForm.receivedBy.trim(),
        source: stockInForm.supplier.trim(),
        notes: stockInForm.notes.trim(),
      });
      toast.success(`รับเข้า ${stockInItem.itemName} จำนวน ${qty} ${stockInItem.unit} สำเร็จ`);
      setShowStockInModal(false);
      setStockInItem(null);
      setStockInForm(emptyStockInForm);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'รับเข้าสต๊อคไม่สำเร็จ');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemCode || !form.itemName) {
      toast.error('กรุณากรอกรหัสและชื่อรายการ');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, form);
        toast.success('อัปเดตรายการสำเร็จ');
      } else {
        await inventoryAPI.create(form);
        toast.success('เพิ่มรายการสำเร็จ');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawItem) return;
    const qty = parseInt(withdrawForm.quantity) || 0;
    if (qty <= 0) { toast.error('กรุณาระบุจำนวนที่ต้องการเบิก'); return; }
    if (!withdrawForm.withdrawBy.trim()) { toast.error('กรุณาระบุชื่อผู้เบิก'); return; }
    try {
      await inventoryAPI.stockOut(withdrawItem.id, {
        quantity: qty,
        performedBy: withdrawForm.withdrawBy.trim(),
        source: withdrawForm.moldCode.trim(),
        notes: withdrawForm.purpose.trim(),
      });
      toast.success(`เบิก ${withdrawItem.itemName} จำนวน ${qty} ${withdrawItem.unit} สำเร็จ`);
      setShowWithdrawModal(false);
      setWithdrawItem(null);
      setWithdrawForm(emptyWithdrawForm);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เบิกของไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('แน่ใจจะลบรายการนี้?')) return;
    try {
      await inventoryAPI.delete(id);
      toast.success('ลบรายการสำเร็จ');
      fetchItems();
    } catch (error) {
      toast.error('ลบรายการไม่สำเร็จ');
    }
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

  const quickNums = [
    { value: filtered.length, label: 'ทั้งหมด', color: '#4a7cff', sparkPoints: '0,5 10,15 20,10 30,20 40,15 50,22 60,18' },
    { value: filtered.filter(i => getStatus(i) === 'available').length, label: 'พร้อมใช้', color: '#10b981', sparkPoints: '0,20 10,18 20,22 30,15 40,18 50,12 60,10' },
    { value: filtered.filter(i => getStatus(i) === 'low_stock').length, label: 'ใกล้หมด', color: '#f59e0b', sparkPoints: '0,10 10,15 20,8 30,12 40,6 50,14 60,8' },
    { value: filtered.filter(i => getStatus(i) === 'out_of_stock').length, label: 'หมดสต๊อค', color: '#ef4444', sparkPoints: '0,15 10,12 20,18 30,22 40,15 50,10 60,14' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 จัดการสต๊อค (Inventory)</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>อุปกรณ์ เครื่องมือ และวัสดุสำหรับงาน Moldshop</p>
        </div>
        <div className="page-header-actions flex gap-2">
          <button onClick={fetchItems} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <FiRefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <FiPlus className="mr-1 h-4 w-4 inline" /> เพิ่มรายการ
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('stock')}
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', borderRadius: '100px' }}
        >
          <FiPackage className="mr-1.5 h-4 w-4 inline" /> สต๊อค
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', borderRadius: '100px' }}
        >
          <FiList className="mr-1.5 h-4 w-4 inline" /> ประวัติเบิก
          {history.length > 0 && <span className="badge badge-neutral ml-2">{history.length > 99 ? '99+' : history.length}</span>}
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
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
            <div className="search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหา รหัส, ชื่ออุปกรณ์..."
                />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input w-auto">
                <option value="">หมวดหมู่ทั้งหมด</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

          {loading ? <SkeletonTable rows={8} cols={7} /> : items.length === 0 && !search && !categoryFilter ? (
            <div className="empty-state">
              <div className="empty-state-icon text-slate-300">
                <FiPackage className="h-12 w-12 mx-auto" />
              </div>
              <div className="empty-state-title">ยังไม่มีรายการสต๊อค</div>
              <p className="text-sm mt-1 text-slate-500">กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>รหัส</th>
                      <th>ชื่อรายการ</th>
                      <th>หมวดหมู่</th>
                      <th>ที่จัดเก็บ</th>
                      <th style={{ textAlign: 'center' }}>คงเหลือ</th>
                      <th>สถานะ</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>จัดการ</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((item) => {
                        const status = getStatus(item);
                        // Convert old statusMap tones to new badge classes
                        let tone = 'badge-neutral';
                        if (status === 'available') tone = 'badge-success';
                        else if (status === 'low_stock') tone = 'badge-warning';
                        else if (status === 'out_of_stock') tone = 'badge-danger';

                        return (
                          <tr key={item.id}>
                            <td className="font-semibold text-[var(--color-primary)]">{item.itemCode}</td>
                            <td>
                              <div>
                                <p className="font-semibold text-[var(--text-color)]">{item.itemName}</p>
                                {item.notes && <p className="text-xs text-[var(--text-muted)]">{item.notes}</p>}
                              </div>
                            </td>
                            <td className="text-[var(--text-muted)]">{item.category}</td>
                            <td className="text-[var(--text-muted)]">{item.location}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, color: status !== 'available' ? 'var(--color-danger)' : 'var(--text-color)' }}>
                                {item.quantity} {item.unit}
                              </span>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ขั้นต่ำ {item.minStock}</p>
                            </td>
                            <td>
                              <span className={`badge ${tone}`}>
                                {statusMap[status]?.label || 'ไม่ทราบ'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                  onClick={() => openStockInModal(item)}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--bg-secondary)', 
                                    color: 'var(--color-success)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  title="รับเข้าสต๊อค"
                                >
                                  <FiPlusCircle size={16} />
                                </button>
                                <button
                                  onClick={() => openWithdrawModal(item)}
                                  disabled={item.quantity <= 0}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--bg-secondary)', 
                                    color: 'var(--color-primary)', cursor: item.quantity <= 0 ? 'not-allowed' : 'pointer', opacity: item.quantity <= 0 ? 0.5 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  title="เบิกออก"
                                >
                                  <FiShoppingCart size={16} />
                                </button>
                                <button onClick={() => openModal(item)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                  <FiEdit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                  <FiTrash2 size={16} />
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
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiPackage className="h-12 w-12 mx-auto mb-3" />
                  <p>ไม่พบรายการสต๊อค</p>
                </div>
              )}
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                แสดง {filtered.length} จาก {items.length} รายการ
                {lowStock.length > 0 && <span style={{ marginLeft: '0.5rem', color: 'var(--color-warning)', fontWeight: 600 }}>⚠️ {lowStock.length} รายการใกล้หมด</span>}
              </div>
            </div>
          )}
          </div>
        </>
      ) : (
        /* ===== ประวัติเบิกของ ===== */
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่/เวลา</th>
                  <th>รหัส</th>
                  <th>รายการ</th>
                  <th style={{ textAlign: 'center' }}>จำนวน</th>
                  <th>ผู้เบิก</th>
                  <th>วัตถุประสงค์</th>
                  <th>รหัส Mold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(record.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                      <br />
                      <span style={{ fontWeight: 600 }}>{new Date(record.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="font-semibold text-[var(--color-primary)]">{record.item?.itemCode}</td>
                    <td className="font-semibold text-[var(--text-color)]">{record.item?.itemName}</td>
                    <td style={{ textAlign: 'center' }}>
                      {record.type === 'in' ? (
                        <span className="badge badge-success">
                          <FiArrowUp className="inline mr-1" />+{record.quantity} {record.item?.unit}
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <FiArrowDown className="inline mr-1" />-{record.quantity} {record.item?.unit}
                        </span>
                      )}
                    </td>
                    <td className="text-[var(--text-muted)]">{record.performedBy}</td>
                    <td className="text-[var(--text-muted)]">{record.notes || '-'}</td>
                    <td className="text-[var(--text-muted)]">{record.source || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyLoading && <div style={{ padding: '2rem', textAlign: 'center' }}><FiRefreshCw className="animate-spin h-6 w-6 mx-auto text-slate-400" /></div>}
          {!historyLoading && history.length === 0 && (
            <div className="empty-state" style={{ marginTop: '1rem' }}>
              <div className="empty-state-icon">
                <FiList className="h-12 w-12 mx-auto" />
              </div>
              <p>ยังไม่มีประวัติการเบิก/รับของ</p>
            </div>
          )}
          {history.length > 0 && (
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนขั้นต่ำ</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value === '' ? '' : parseInt(e.target.value) })} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

      {/* ===== Stock-In Modal ===== */}
      <Modal isOpen={showStockInModal} onClose={() => setShowStockInModal(false)} title="รับของเข้าสต๊อค" size="md">
        {stockInItem && (
          <form onSubmit={handleStockIn} className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiPackage className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{stockInItem.itemName}</p>
                  <p className="text-sm text-gray-500">{stockInItem.itemCode} · คงเหลือปัจจุบัน <span className="font-bold text-green-600">{stockInItem.quantity} {stockInItem.unit}</span></p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่รับเข้า *</label>
                <input
                  type="number"
                  value={stockInForm.quantity}
                  onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">หลังรับ: <span className="font-bold text-green-600">{stockInItem.quantity + (parseInt(stockInForm.quantity) || 0)} {stockInItem.unit}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับของ *</label>
                <input
                  type="text"
                  value={stockInForm.receivedBy}
                  onChange={(e) => setStockInForm({ ...stockInForm, receivedBy: e.target.value })}
                  placeholder={user.firstName || 'ชื่อผู้รับของ'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แหล่งที่มา / Supplier</label>
                <input
                  type="text"
                  value={stockInForm.supplier}
                  onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}
                  placeholder="เช่น บริษัท ABC, ซื้อสด"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={stockInForm.notes}
                  onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
                  placeholder="เช่น ซื้อเพิ่ม, รับคืนจากงาน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setShowStockInModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                ยืนยันรับเข้า
              </button>
            </div>
          </form>
        )}
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
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
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
