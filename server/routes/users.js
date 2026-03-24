const express = require('express');
const { User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/users
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/users - สร้างผู้ใช้ใหม่ (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.create(req.body);
    const { password, ...userData } = user.toJSON();
    res.status(201).json(userData);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรือรหัสพนักงานซ้ำ' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/users/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    await user.update(req.body);
    const { password, ...userData } = user.toJSON();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    await user.update({ isActive: false });
    res.json({ message: 'ปิดการใช้งานผู้ใช้สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/users/transfer-data - ย้าย ownership ข้อมูลงานจาก user เก่า → user ใหม่
router.post('/transfer-data', auth, adminOnly, async (req, res) => {
  const { Mold, Maintenance, WorkOrder } = require('../models');
  const transaction = await require('../config/database').sequelize.transaction();
  
  try {
    const { fromUserId, toUserId } = req.body;
    
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ message: 'ต้องระบุ fromUserId และ toUserId' });
    }
    
    // ตรวจสอบว่า user ทั้งสองมีอยู่จริง
    const fromUser = await User.findByPk(fromUserId);
    const toUser = await User.findByPk(toUserId);
    
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    
    // อัปเดต Molds (createdBy, updatedBy)
    const moldResult = await Mold.update(
      { createdBy: toUserId, updatedBy: toUserId },
      { where: { createdBy: fromUserId }, transaction }
    );
    
    // อัปเดต Maintenance (createdBy, assignedTo)
    const mtCreated = await Maintenance.update(
      { createdBy: toUserId },
      { where: { createdBy: fromUserId }, transaction }
    );
    const mtAssigned = await Maintenance.update(
      { assignedTo: toUserId },
      { where: { assignedTo: fromUserId }, transaction }
    );
    
    // อัปเดต WorkOrders (createdBy, assignedTo)
    const woCreated = await WorkOrder.update(
      { createdBy: toUserId },
      { where: { createdBy: fromUserId }, transaction }
    );
    const woAssigned = await WorkOrder.update(
      { assignedTo: toUserId },
      { where: { assignedTo: fromUserId }, transaction }
    );
    
    await transaction.commit();
    
    res.json({
      message: 'ย้ายข้อมูลสำเร็จ',
      transferred: {
        molds: moldResult[0],
        maintenanceCreated: mtCreated[0],
        maintenanceAssigned: mtAssigned[0],
        workOrdersCreated: woCreated[0],
        workOrdersAssigned: woAssigned[0],
      },
      fromUser: fromUser.username,
      toUser: toUser.username,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Transfer data error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการย้ายข้อมูล', error: error.message });
  }
});

module.exports = router;
