const express = require('express');
const { Inventory, InventoryHistory } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/inventory - ดึงรายการสต๊อคทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { itemCode: { [Op.iLike]: `%${search}%` } },
        { itemName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;

    const items = await Inventory.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/inventory - เพิ่มรายการใหม่
router.post('/', auth, technicianUp, async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'รหัสรายการซ้ำ' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/inventory/:id - แก้ไขรายการ
router.put('/:id', auth, technicianUp, async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการ' });
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/inventory/:id - ลบรายการ
router.delete('/:id', auth, technicianUp, async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการ' });
    await item.destroy();
    res.json({ message: 'ลบรายการสำเร็จ' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/inventory/:id/stock-in - รับของเข้าสต๊อค
router.post('/:id/stock-in', auth, async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการ' });

    const { quantity, performedBy, source, notes } = req.body;
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'จำนวนต้องมากกว่า 0' });

    await item.update({ quantity: item.quantity + qty });
    await InventoryHistory.create({
      inventoryId: item.id,
      type: 'in',
      quantity: qty,
      performedBy: performedBy || 'ไม่ระบุ',
      source: source || '',
      notes: notes || '',
    });

    res.json(item);
  } catch (error) {
    console.error('Stock-in error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/inventory/:id/stock-out - เบิกของออก
router.post('/:id/stock-out', auth, async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการ' });

    const { quantity, performedBy, source, notes } = req.body;
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'จำนวนต้องมากกว่า 0' });
    if (qty > item.quantity) return res.status(400).json({ message: `ของในสต๊อคมีเพียง ${item.quantity} ${item.unit}` });

    await item.update({ quantity: item.quantity - qty });
    await InventoryHistory.create({
      inventoryId: item.id,
      type: 'out',
      quantity: qty,
      performedBy: performedBy || 'ไม่ระบุ',
      source: source || '',
      notes: notes || '',
    });

    res.json(item);
  } catch (error) {
    console.error('Stock-out error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/inventory/history - ดึงประวัติทั้งหมด
router.get('/history', auth, async (req, res) => {
  try {
    const records = await InventoryHistory.findAll({
      order: [['created_at', 'DESC']],
      limit: 200,
      include: [{ model: Inventory, as: 'item', attributes: ['itemCode', 'itemName', 'unit'] }],
    });
    res.json(records);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
