import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiUserCheck, FiUserX, FiTrash2 } from 'react-icons/fi';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';

const roleMap = {
    admin: { label: 'ผู้ดูแลระบบ', tone: 'badge-warning' },
    manager: { label: 'ผู้จัดการ', tone: 'badge-primary' },
    technician: { label: 'ช่างเทคนิค', tone: 'badge-info' },
    operator: { label: 'พนักงานคุมเครื่อง', tone: 'badge-secondary' },
    viewer: { label: 'ผู้เยี่ยมชม', tone: 'badge-neutral' },
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();
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
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
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
            password: '',
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
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return;
        }

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

    const quickNums = [
        { value: users.length, label: 'ผู้ใช้ทั้งหมดในระบบ', color: '#4a7cff', sparkPoints: '0,20 10,16 20,18 30,14 40,16 50,12 60,10' },
        { value: activeCount, label: 'บัญชีที่ใช้งานอยู่', color: '#22d3b0', sparkPoints: '0,22 10,18 20,20 30,10 40,12 50,6 60,4' },
        { value: inactiveCount, label: 'ระงับบัญชี', color: '#ef4444', sparkPoints: '0,20 10,22 20,18 30,20 40,15 50,18 60,14' },
        { value: adminCount, label: 'ผู้ดูแลระบบ', color: '#f59e0b', sparkPoints: '0,22 10,14 20,18 30,12 40,16 50,10 60,14' },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">👤 จัดการผู้ใช้งาน (Users)</h1>
                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>จัดการสิทธิ์เข้าถึง ปรับบทบาท และแก้ไขข้อมูลพนักงาน</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        ➕ เพิ่มผู้ใช้งาน
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
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อ, นามสกุล, username, รหัสพนักงาน..."
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>รหัส</th>
                                <th>ชื่อ-นามสกุล</th>
                                <th>Username</th>
                                <th>แผนก</th>
                                <th>ระดับสิทธิ์</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center">กำลังโหลดข้อมูล...</td></tr>
                            ) : filtered.length > 0 ? (
                                filtered.map((u) => (
                                    <tr key={u.id}>
                                        <td><span className="font-medium">{u.employeeId}</span></td>
                                        <td>{u.firstName} {u.lastName}</td>
                                        <td>{u.username}</td>
                                        <td>{u.department || '-'}</td>
                                        <td>
                                            <span className={`badge ${(roleMap[u.role] || roleMap.viewer).tone}`}>
                                                {(roleMap[u.role] || roleMap.viewer).label}
                                            </span>
                                        </td>
                                        <td>
                                            <span 
                                                className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => confirmToggleActive(u)}
                                            >
                                                {u.isActive ? '✓ ใช้งานอยู่' : '✗ ระงับ'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(u)}>✏️</button>
                                                <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => confirmToggleActive(u)}>
                                                    {u.isActive ? '🗑️' : 'เปิด'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">👤</div>
                                            <div className="empty-state-title">ไม่พบผู้ใช้งาน</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    แสดง {filtered.length} จาก {users.length} รายการ
                </div>
            </div>

            {/* Modal Components - Using existing Modal wrapper but styled with basic classes */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="➕ เพิ่มผู้ใช้งานใหม่" size="lg">
                <form onSubmit={handleAddUser} className="space-y-4" style={{ marginTop: '1rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group mb-0">
                            <label className="form-label required">รหัสพนักงาน</label>
                            <input type="text" name="employeeId" value={form.employeeId} onChange={handleFormChange} required className="form-input" placeholder="EMP001" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">Username</label>
                            <input type="text" name="username" value={form.username} onChange={handleFormChange} required className="form-input" placeholder="เข้าสู่ระบบ" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">ชื่อ</label>
                            <input type="text" name="firstName" value={form.firstName} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">นามสกุล</label>
                            <input type="text" name="lastName" value={form.lastName} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">รหัสผ่าน</label>
                            <input type="password" name="password" value={form.password} onChange={handleFormChange} required className="form-input" placeholder="ตั้งรหัสผ่านเริ่มต้น" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">อีเมล</label>
                            <input type="email" name="email" value={form.email} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">เบอร์โทรศัพท์</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">แผนก</label>
                            <input type="text" name="department" value={form.department} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0 sm:col-span-2">
                            <label className="form-label required">ระดับสิทธิ์ (Role)</label>
                            <select name="role" value={form.role} onChange={handleFormChange} className="form-select">
                                <option value="viewer">👤 ผู้เยี่ยมชม (Viewer)</option>
                                <option value="operator">พนักงานคุมเครื่อง (Operator)</option>
                                <option value="technician">ช่างเทคนิค (Technician)</option>
                                <option value="manager">ผู้จัดการ (Manager)</option>
                                <option value="admin">👑 ผู้ดูแลระบบ (Admin)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">ยกเลิก</button>
                        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setForm(emptyForm); }} title="✏️ แก้ไขข้อมูลพนักงาน" size="lg">
                <form onSubmit={handleEditUser} className="space-y-4" style={{ marginTop: '1rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group mb-0">
                            <label className="form-label required">รหัสพนักงาน</label>
                            <input type="text" name="employeeId" value={form.employeeId} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">Username</label>
                            <input type="text" name="username" value={form.username} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">ชื่อ</label>
                            <input type="text" name="firstName" value={form.firstName} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label required">นามสกุล</label>
                            <input type="text" name="lastName" value={form.lastName} onChange={handleFormChange} required className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">รหัสผ่านใหม่ <span className="text-muted">(เว้นว่างถ้าไม่เปลี่ยน)</span></label>
                            <input type="password" name="password" value={form.password} onChange={handleFormChange} className="form-input" placeholder="••••••••" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">อีเมล</label>
                            <input type="email" name="email" value={form.email} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">เบอร์โทรศัพท์</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">แผนก</label>
                            <input type="text" name="department" value={form.department} onChange={handleFormChange} className="form-input" />
                        </div>
                        <div className="form-group mb-0 sm:col-span-2">
                            <label className="form-label required">ระดับสิทธิ์ (Role)</label>
                            <select name="role" value={form.role} onChange={handleFormChange} className="form-select">
                                <option value="viewer">👤 ผู้เยี่ยมชม (Viewer)</option>
                                <option value="operator">พนักงานคุมเครื่อง (Operator)</option>
                                <option value="technician">ช่างเทคนิค (Technician)</option>
                                <option value="manager">ผู้จัดการ (Manager)</option>
                                <option value="admin">👑 ผู้ดูแลระบบ (Admin)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" onClick={() => { setShowEditModal(false); setForm(emptyForm); }} className="btn btn-secondary">ยกเลิก</button>
                        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, user: null })} title="⚠️ ยืนยันการทำรายการ" size="sm">
                <div style={{ marginTop: '1rem' }}>
                    <p style={{ color: 'var(--text-color)', marginBottom: '1.5rem' }}>
                        คุณต้องการ{confirmModal.user?.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}ผู้ใช้ <strong>{confirmModal.user?.firstName} {confirmModal.user?.lastName}</strong> ใช่หรือไม่?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setConfirmModal({ isOpen: false, user: null })} className="btn btn-secondary">ยกเลิก</button>
                        <button type="button" onClick={handleToggleActive} className={`btn ${confirmModal.user?.isActive ? 'btn-danger' : 'btn-primary'}`}>
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
