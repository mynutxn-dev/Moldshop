import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowRight, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const DataTransfer = () => {
  const [users, setUsers] = useState([]);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    usersAPI.getAll()
      .then(res => setUsers(res.data))
      .catch(err => toast.error('ไม่สามารถโหลดรายชื่อผู้ใช้ได้'))
      .finally(() => setLoading(false));
  }, []);

  const handleTransfer = async () => {
    if (!fromUserId || !toUserId) {
      toast.error('กรุณาเลือกผู้ใช้ทั้งสองคน');
      return;
    }
    if (fromUserId === toUserId) {
      toast.error('ไม่สามารถโอนข้อมูลไปยังผู้ใช้เดียวกันได้');
      return;
    }

    const fromUser = users.find(u => u.id.toString() === fromUserId);
    const toUser = users.find(u => u.id.toString() === toUserId);
    
    const confirmed = window.confirm(
      `ยืนยันการโอนข้อมูลจาก "${fromUser?.username}" ไปยัง "${toUser?.username}"?\n\n` +
      `ข้อมูลที่จะถูกโอน:\n` +
      `- แม่พิมพ์ที่สร้าง\n` +
      `- งานแจ้งซ่อม (ที่สร้าง + ที่ได้รับมอบหมาย)\n` +
      `- New Model (ที่สร้าง + ที่ได้รับมอบหมาย)\n\n` +
      `การกระทำนี้ไม่สามารถย้อนกลับได้!`
    );
    
    if (!confirmed) return;

    setTransferring(true);
    setResult(null);
    
    try {
      const res = await usersAPI.transferData(parseInt(fromUserId), parseInt(toUserId));
      setResult(res.data);
      toast.success('โอนย้ายข้อมูลสำเร็จ');
      setFromUserId('');
      setToUserId('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโอนย้ายข้อมูล');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">โอนย้ายข้อมูลงาน</h1>
        <p className="text-gray-500 mt-1">โอนย้าย ownership ข้อมูลงานจากผู้ใช้เก่าไปยังผู้ใช้ใหม่ (SSO)</p>
      </div>

      <div className="bg-white rounded-3xl border border-black/5 p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">คำเตือน</p>
              <p className="text-sm text-amber-700 mt-1">
                การโอนย้ายข้อมูลจะเปลี่ยนเจ้าของข้อมูลงานทั้งหมด โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ
              </p>
            </div>
          </div>
        </div>

        {/* From User */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ผู้ใช้ต้นทาง (มีข้อมูลงาน)
          </label>
          <select
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all text-sm"
          >
            <option value="">เลือกผู้ใช้...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} — {user.firstName} {user.lastName} ({user.hubUserId ? 'SSO' : 'Local'})
              </option>
            ))}
          </select>
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-4">
          <FiArrowRight className="h-6 w-6 text-gray-400" />
        </div>

        {/* To User */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ผู้ใช้ปลายทาง (SSO User ใหม่)
          </label>
          <select
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all text-sm"
          >
            <option value="">เลือกผู้ใช้...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} — {user.firstName} {user.lastName} ({user.hubUserId ? 'SSO' : 'Local'})
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={transferring || !fromUserId || !toUserId}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {transferring ? 'กำลังโอนย้าย...' : 'ยืนยันการโอนย้ายข้อมูล'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-3xl p-6">
          <div className="flex items-start space-x-3">
            <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">โอนย้ายข้อมูลสำเร็จ</p>
              <p className="text-sm text-green-700 mt-1">
                จาก <strong>{result.fromUser}</strong> ไปยัง <strong>{result.toUser}</strong>
              </p>
              <div className="mt-3 space-y-1 text-sm text-green-700">
                <p>• แม่พิมพ์: {result.transferred.molds} รายการ</p>
                <p>• งานแจ้งซ่อม (สร้าง): {result.transferred.maintenanceCreated} รายการ</p>
                <p>• งานแจ้งซ่อม (มอบหมาย): {result.transferred.maintenanceAssigned} รายการ</p>
                <p>• New Model (สร้าง): {result.transferred.workOrdersCreated} รายการ</p>
                <p>• New Model (มอบหมาย): {result.transferred.workOrdersAssigned} รายการ</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTransfer;
