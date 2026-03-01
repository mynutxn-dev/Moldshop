const express = require('express');
const { WorkOrder, Mold, User } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/work-orders
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, priority, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { orderCode: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const offset = (page - 1) * limit;
    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'moldCode', 'name'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      workOrders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/work-orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const wo = await WorkOrder.findByPk(req.params.id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: User, as: 'assignedTo', attributes: { exclude: ['password'] } },
        { model: User, as: 'createdBy', attributes: { exclude: ['password'] } },
      ],
    });
    if (!wo) return res.status(404).json({ message: 'ไม่พบใบสั่งงาน' });
    res.json(wo);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/work-orders
router.post('/', auth, technicianUp, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await WorkOrder.count();
    const orderCode = `WO-${year}-${String(count + 1).padStart(3, '0')}`;

    const wo = await WorkOrder.create({
      orderCode,
      createdById: req.user.id,
      ...req.body,
    });
    res.status(201).json(wo);
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/work-orders/:id
router.put('/:id', auth, technicianUp, async (req, res) => {
  try {
    const wo = await WorkOrder.findByPk(req.params.id);
    if (!wo) return res.status(404).json({ message: 'ไม่พบใบสั่งงาน' });

    if (req.body.status === 'completed' && !wo.completedDate) {
      req.body.completedDate = new Date();
      req.body.progress = 100;
    } else if (req.body.status === 'trial_mold' && !wo.progress) {
      req.body.progress = 83;
    }

    await wo.update(req.body);
    res.json(wo);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/work-orders/:id
router.delete('/:id', auth, technicianUp, async (req, res) => {
  try {
    const wo = await WorkOrder.findByPk(req.params.id);
    if (!wo) return res.status(404).json({ message: 'ไม่พบใบสั่งงาน' });
    await wo.destroy();
    res.json({ message: 'ลบใบสั่งงานสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
