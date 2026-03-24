import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiUserCheck, FiUserX } from 'react-icons/fi';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
// removed unused auth context import
import { useNavigate } from 'react-router-dom';

const roleMap = {
    admin: { label: 'ผู้ดูแลระบบ', tone: 'role-pill-admin' },
    manager: { label: 'ผู้จัดการ', tone: 'role-pill-manager' },
    technician: { label: 'ช่างเทคนิค', tone: 'role-pill-technician' },
    operator: { label: 'พนักงานคุมเครื่อง', tone: 'role-pill-operator' },
    viewer: { label: 'ผู้เยี่ยมชม', tone: 'role-pill-viewer' },
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();
    // Check auth
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'admin') {
            toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            navigate('/');
        }
    }, [navigate]);

    const emptyForm = {
        employeeId: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
        department: 'Moldshop',
        phone: '',
        email: '',
    };

    const [form, setForm] = useState(emptyForm);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await usersAPI.getAll();
            setUsers(data);
        } catch (err) {
            console.error(err);
            toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!form.employeeId || !form.username || !form.password || !form.firstName || !form.lastName) {
            toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return;
        }
        setSaving(true);
        try {
            await usersAPI.create(form);
            toast.success('เพิ่มผู้ใช้สำเร็จ');
            setShowAddModal(false);
            setForm(emptyForm);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'เพิ่มผู้ใช้ไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (user) => {
        setEditingId(user.id);
        setForm({
            employeeId: user.employeeId || '',
            username: user.username || '',
            password: '', // default empty for edit
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role || 'viewer',
            department: user.department || 'Moldshop',
            phone: user.phone || '',
            email: user.email || '',
        });
        setShowEditModal(true);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        if (!form.employeeId || !form.username || !form.firstName || !form.lastName) {
            toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return;
        }

        // Create payload, only include password if it's filled
        const payload = { ...form };
        if (!payload.password) {
            delete payload.password;
        }

        setSaving(true);
        try {
            await usersAPI.update(editingId, payload);
            toast.success('แก้ไขข้อมูลสำเร็จ');
            setShowEditModal(false);
            setForm(emptyForm);
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'แก้ไขข้อมูลไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const confirmToggleActive = (user) => {
        setConfirmModal({ isOpen: true, user });
    };

    const handleToggleActive = async () => {
        const user = confirmModal.user;
        if (!user) return;

        const action = user.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';

        try {
            if (user.isActive) {
                await usersAPI.delete(user.id);
            } else {
                await usersAPI.update(user.id, { isActive: true });
            }
            toast.success(`${action}สำเร็จ`);
            fetchUsers();
        } catch (err) {
            toast.error(`${action}ไม่สำเร็จ`);
        } finally {
            setConfirmModal({ isOpen: false, user: null });
        }
    };

    const filtered = users.filter(u =>
        (u.firstName?.toLowerCase().includes(search.toLowerCase())) ||
        (u.lastName?.toLowerCase().includes(search.toLowerCase())) ||
        (u.username?.toLowerCase().includes(search.toLowerCase())) ||
        (u.employeeId?.toLowerCase().includes(search.toLowerCase()))
    );
    const activeCount = users.filter((user) => user.isActive).length;
    const inactiveCount = users.length - activeCount;
    const adminCount = users.filter((user) => user.role === 'admin').length;

    return (
        <div className="space-y-6">
            <section className="page-hero animate-fade-in-up">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="page-kicker">Access Management</p>
                        <h1 className="page-title">จัดการผู้ใช้งานและสิทธิ์เข้าถึงให้ทีมทำงานได้ชัดเจนขึ้น</h1>
                        <p className="page-subtitle">
                            ดูรายชื่อพนักงาน บทบาท และสถานะการใช้งานจากพื้นที่เดียว พร้อมเพิ่มผู้ใช้ใหม่ แก้ไขข้อมูล หรือเปิด-ปิดสิทธิ์ได้อย่างรวดเร็ว
                        </p>
                    </div>
                    <div className="page-actions">
                        <button onClick={() => setShowAddModal(true)} className="btn-primary">
                            <FiPlus className="h-4 w-4" /> เพิ่มผู้ใช้
                        </button>
                    </div>
                </div>
                <div className="overview-strip">
                    <div className="overview-card overview-card--primary">
                        <span className="overview-card-label">ผู้ใช้ทั้งหมด</span>
                        <strong className="overview-card-value">{users.length}</strong>
                        <span className="overview-card-meta">บัญชีในระบบ</span>
                    </div>
                    <div className="overview-card overview-card--success">
                        <span className="overview-card-label">ใช้งานอยู่</span>
                        <strong className="overview-card-value">{activeCount}</strong>
                        <span className="overview-card-meta">พร้อมเข้าสู่ระบบ</span>
                    </div>
                    <div className="overview-card overview-card--danger">
                        <span className="overview-card-label">ระงับ</span>
                        <strong className="overview-card-value">{inactiveCount}</strong>
                        <span className="overview-card-meta">ต้องตรวจสอบสิทธิ์</span>
                    </div>
                    <div className="overview-card overview-card--neutral">
                        <span className="overview-card-label">ผู้ดูแลระบบ</span>
                        <strong className="overview-card-value">{adminCount}</strong>
                        <span className="overview-card-meta">บัญชีที่มีสิทธิ์สูงสุด</span>
                    </div>
                </div>
            </section>

            <div className="filter-surface">
                <div className="search-field w-full md:w-1/2">
                    <FiSearch className="h-4 w-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาจาก ชื่อ, นามสกุล, username, รหัสพนักงาน..."
                    />
                </div>
            </div>

            {loading ? <SkeletonTable rows={5} cols={6} /> : (
                <div className="table-shell">
                    <div className="overflow-x-auto">
                        <table className="text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">รหัสพนักงาน</th>
                                    <th className="text-left">ชื่อ-นามสกุล</th>
                                    <th className="text-left">Username</th>
                                    <th className="text-left">แผนก</th>
                                    <th className="text-left">ระดับสิทธิ์</th>
                                    <th className="text-left">สถานะ</th>
                                    <th className="text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                                        <td className="table-code">{u.employeeId}</td>
                                        <td className="text-slate-900">{u.firstName} {u.lastName}</td>
                                        <td>{u.username}</td>
                                        <td>{u.department || '-'}</td>
                                        <td>
                                            <span className={`role-pill ${(roleMap[u.role] || roleMap.viewer).tone}`}>
                                                {(roleMap[u.role] || roleMap.viewer).label}
                                            </span>
                                        </td>
                                        <td>
                                            {u.isActive ? (
                                                <span className="user-state user-state-active">
                                                    <FiUserCheck className="h-4 w-4" /> ใช้งาน
                                                </span>
                                            ) : (
                                                <span className="user-state user-state-inactive">
                                                    <FiUserX className="h-4 w-4" /> ระงับ
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEditModal(u)} className="action-icon-button" title="แก้ไข">
                                                    <FiEdit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => confirmToggleActive(u)} className={`action-icon-button ${u.isActive ? 'is-danger' : 'is-success'}`} title={u.isActive ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'}>
                                                    {u.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                                            ไม่พบข้อมูลผู้ใช้งาน
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer-note">
                        แสดง {filtered.length} จาก {users.length} รายการ
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="เพิ่มพนักงานใหม่" size="lg">
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสพนักงาน *</label>
                            <input type="text" name="employeeId" value={form.employeeId} onChange={handleFormChange} required placeholder="เช่น EMP001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input type="text" name="username" value={form.username} onChange={handleFormChange} required placeholder="สำหรับเข้าสู่ระบบ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                            <input type="text" name="firstName" value={form.firstName} onChange={handleFormChange} required placeholder="ชื่อจริง" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                            <input type="text" name="lastName" value={form.lastName} onChange={handleFormChange} required placeholder="นามสกุล" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน *</label>
                            <input type="password" name="password" value={form.password} onChange={handleFormChange} required placeholder="กำหนดรหัสผ่านเบื้องต้น" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                            <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="อีเมล (ถ้ามี)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleFormChange} placeholder="เบอร์โทรติดต่อ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                            <input type="text" name="department" value={form.department} onChange={handleFormChange} placeholder="แผนก" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสิทธิ์ (Role) *</label>
                            <select name="role" value={form.role} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="viewer">ผู้เยี่ยมชม (Viewer) - ดูข้อมูลได้อย่างเดียว</option>
                                <option value="operator">พนักงานคุมเครื่อง (Operator)</option>
                                <option value="technician">ช่างเทคนิค (Technician)</option>
                                <option value="manager">ผู้จัดการ (Manager)</option>
                                <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการได้ทุกอย่าง</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
                        <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setForm(emptyForm); }} title="แก้ไขข้อมูลพนักงาน" size="lg">
                <form onSubmit={handleEditUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสพนักงาน *</label>
                            <input type="text" name="employeeId" value={form.employeeId} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input type="text" name="username" value={form.username} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                            <input type="text" name="firstName" value={form.firstName} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                            <input type="text" name="lastName" value={form.lastName} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
                            <input type="password" name="password" value={form.password} onChange={handleFormChange} placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                            <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                            <input type="text" name="department" value={form.department} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสิทธิ์ (Role) *</label>
                            <select name="role" value={form.role} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="viewer">ผู้เยี่ยมชม (Viewer)</option>
                                <option value="operator">พนักงานคุมเครื่อง (Operator)</option>
                                <option value="technician">ช่างเทคนิค (Technician)</option>
                                <option value="manager">ผู้จัดการ (Manager)</option>
                                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
                        <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข'}</button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, user: null })} title="ยืนยันการทำรายการ" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-700">
                        คุณต้องการ{confirmModal.user?.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}ผู้ใช้ <strong>{confirmModal.user?.firstName} {confirmModal.user?.lastName}</strong> ใช่หรือไม่?
                    </p>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={() => setConfirmModal({ isOpen: false, user: null })} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
                        <button type="button" onClick={handleToggleActive} className={`px-6 py-2 text-sm font-medium text-white rounded-lg ${confirmModal.user?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>ยืนยัน</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Users;
