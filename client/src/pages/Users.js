import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
// removed unused auth context import
import { useNavigate } from 'react-router-dom';

const roleMap = {
    admin: { label: 'ผู้ดูแลระบบ', color: 'text-purple-600 bg-purple-50' },
    manager: { label: 'ผู้จัดการ', color: 'text-blue-600 bg-blue-50' },
    technician: { label: 'ช่างเทคนิค', color: 'text-orange-600 bg-orange-50' },
    operator: { label: 'พนักงานคุมเครื่อง', color: 'text-green-600 bg-green-50' },
    viewer: { label: 'ผู้เยี่ยมชม', color: 'text-gray-600 bg-gray-50' },
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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

    const handleToggleActive = async (user) => {
        const action = user.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';
        if (!window.confirm(`ต้องการ${action}ผู้ใช้นี้?`)) return;

        try {
            if (user.isActive) {
                await usersAPI.delete(user.id); // Our backend set isActive to false
            } else {
                await usersAPI.update(user.id, { isActive: true });
            }
            toast.success(`${action}สำเร็จ`);
            fetchUsers();
        } catch (err) {
            toast.error(`${action}ไม่สำเร็จ`);
        }
    };

    const filtered = users.filter(u =>
        (u.firstName?.toLowerCase().includes(search.toLowerCase())) ||
        (u.lastName?.toLowerCase().includes(search.toLowerCase())) ||
        (u.username?.toLowerCase().includes(search.toLowerCase())) ||
        (u.employeeId?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                    <p className="text-gray-500 mt-1">รายชื่อพนักงานและสิทธิ์การใช้งานระบบ</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <FiPlus className="mr-2 h-4 w-4" /> เพิ่มผู้ใช้
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="relative w-full md:w-1/2">
                    <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาจาก ชื่อ, นามสกุล, username, รหัสพนักงาน..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? <SkeletonTable rows={5} cols={6} /> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัสพนักงาน</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Username</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">แผนก</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ระดับสิทธิ์</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((u) => (
                                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{u.employeeId}</td>
                                        <td className="px-4 py-3 text-gray-900">{u.firstName} {u.lastName}</td>
                                        <td className="px-4 py-3 text-gray-600">{u.username}</td>
                                        <td className="px-4 py-3 text-gray-600">{u.department}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${(roleMap[u.role] || roleMap.viewer).color}`}>
                                                {(roleMap[u.role] || roleMap.viewer).label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.isActive ? (
                                                <span className="inline-flex items-center text-xs font-medium text-green-600">
                                                    <FiUserCheck className="mr-1" /> ใช้งาน
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium text-red-600">
                                                    <FiUserX className="mr-1" /> ระงับ
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button onClick={() => openEditModal(u)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="แก้ไข">
                                                    <FiEdit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded ${u.isActive ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={u.isActive ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'}>
                                                    {u.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                            ไม่พบข้อมูลผู้ใช้งาน
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
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
        </div>
    );
};

export default Users;
