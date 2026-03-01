const express = require('express');
const { Mold, MoldHistory, MaintenanceRequest, User } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/molds - ดึงแม่พิมพ์ทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, customer, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { moldCode: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { customer: { [Op.iLike]: `%${search}%` } },
        { partNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (customer) where.customer = { [Op.iLike]: `%${customer}%` };

    const offset = (page - 1) * limit;
    const { count, rows } = await Mold.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      molds: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get molds error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/molds/:id - ดึงแม่พิมพ์ตาม ID
router.get('/:id', auth, async (req, res) => {
  try {
    const mold = await Mold.findByPk(req.params.id, {
      include: [
        {
          model: MoldHistory,
          as: 'history',
          limit: 20,
          order: [['created_at', 'DESC']],
          include: [{ model: User, as: 'performedBy', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
    });
    if (!mold) return res.status(404).json({ message: 'ไม่พบแม่พิมพ์' });
    res.json(mold);
  } catch (error) {
    console.error('Get mold error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/molds - เพิ่มแม่พิมพ์ใหม่
router.post('/', auth, technicianUp, async (req, res) => {
  try {
    const mold = await Mold.create(req.body);
    res.status(201).json(mold);
  } catch (error) {
    console.error('Create mold error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'รหัสแม่พิมพ์ซ้ำ' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/molds/:id - แก้ไขแม่พิมพ์
router.put('/:id', auth, technicianUp, async (req, res) => {
  try {
    const mold = await Mold.findByPk(req.params.id);
    if (!mold) return res.status(404).json({ message: 'ไม่พบแม่พิมพ์' });
    await mold.update(req.body);
    res.json(mold);
  } catch (error) {
    console.error('Update mold error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/molds/:id - ลบแม่พิมพ์
router.delete('/:id', auth, technicianUp, async (req, res) => {
  try {
    const mold = await Mold.findByPk(req.params.id);
    if (!mold) return res.status(404).json({ message: 'ไม่พบแม่พิมพ์' });
    await mold.destroy();
    res.json({ message: 'ลบแม่พิมพ์สำเร็จ' });
  } catch (error) {
    console.error('Delete mold error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/molds/:id/history - เพิ่มประวัติการใช้งาน
router.post('/:id/history', auth, async (req, res) => {
  try {
    const mold = await Mold.findByPk(req.params.id);
    if (!mold) return res.status(404).json({ message: 'ไม่พบแม่พิมพ์' });

    const history = await MoldHistory.create({
      moldId: mold.id,
      performedById: req.user.id,
      ...req.body,
    });
    res.status(201).json(history);
  } catch (error) {
    console.error('Create history error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
