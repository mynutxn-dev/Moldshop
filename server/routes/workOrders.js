const express = require('express');
const multer = require('multer');
const path = require('path');
const { WorkOrder, Mold, User } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const { uploadImage, deleteImage } = require('../config/supabaseStorage');
const router = express.Router();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|heic|octet-stream/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed. Got type: ${file.mimetype}, name: ${file.originalname}`));
    }
  },
});

const uploadFilesToSupabase = async (files) => {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map(f => uploadImage(f.buffer, f.originalname, f.mimetype)));
};

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
router.post('/', auth, technicianUp, upload.array('images', 5), async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await WorkOrder.count();
    const orderCode = `WO-${year}-${String(count + 1).padStart(3, '0')}`;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadFilesToSupabase(req.files);
    }

    const wo = await WorkOrder.create({
      orderCode,
      createdById: req.user.id,
      images,
      ...req.body,
    });
    res.status(201).json(wo);
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างงาน: ' + error.message });
  }
});

// POST /api/work-orders/:id/images - อัพโหลดรูปเพิ่ม
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const wo = await WorkOrder.findByPk(req.params.id);
    if (!wo) return res.status(404).json({ message: 'ไม่พบใบสั่งงาน' });

    const newImages = await uploadFilesToSupabase(req.files);
    const existing = wo.images || [];
    await wo.update({ images: [...existing, ...newImages] });

    res.json(wo);
  } catch (error) {
    console.error('Upload work order images error:', error);
    res.status(500).json({ message: 'อัพโหลดรูปไม่สำเร็จ: ' + error.message });
  }
});

// DELETE /api/work-orders/:id/images - ลบรูปภาพ
router.delete('/:id/images', auth, async (req, res) => {
  try {
    const wo = await WorkOrder.findByPk(req.params.id);
    if (!wo) return res.status(404).json({ message: 'ไม่พบใบสั่งงาน' });

    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'กรุณาระบุ imageUrl' });

    await deleteImage(imageUrl);

    const existing = wo.images || [];
    const updated = existing.filter(img => img !== imageUrl);
    await wo.update({ images: updated });

    res.json({ ...wo.toJSON(), images: updated });
  } catch (error) {
    console.error('Delete work order image error:', error);
    res.status(500).json({ message: 'ลบรูปไม่สำเร็จ: ' + error.message });
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
    await wo.update({ status: 'cancelled' });
    res.json({ message: 'ลบ (ยกเลิก) ใบสั่งงานสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
