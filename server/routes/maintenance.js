const express = require('express');
const multer = require('multer');
const path = require('path');
const { MaintenanceRequest, Mold, User } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/maintenance'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `mt-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.split('/')[1])) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/maintenance - ดึงรายการซ่อมบำรุงทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, priority, type, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { requestCode: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    const offset = (page - 1) * limit;
    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'moldCode', 'name', 'customer'] },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      requests: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/maintenance/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: User, as: 'requestedBy', attributes: { exclude: ['password'] } },
        { model: User, as: 'assignedTo', attributes: { exclude: ['password'] } },
      ],
    });
    if (!request) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/maintenance - สร้างใบแจ้งซ่อม (with images)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const count = await MaintenanceRequest.count();
    const requestCode = `MT-${String(count + 1).padStart(4, '0')}`;

    const imageUrls = req.files ? req.files.map(f => `/uploads/maintenance/${f.filename}`) : [];

    const request = await MaintenanceRequest.create({
      requestCode,
      requestedById: req.user.id,
      ...req.body,
      images: imageUrls,
    });
    res.status(201).json(request);
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/maintenance/:id/images - อัพโหลดรูปเพิ่มเติม
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'ไม่พบรายการ' });

    const newImages = req.files ? req.files.map(f => `/uploads/maintenance/${f.filename}`) : [];
    const existing = request.images || [];
    await request.update({ images: [...existing, ...newImages] });

    res.json(request);
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'อัพโหลดรูปไม่สำเร็จ' });
  }
});

// PUT /api/maintenance/:id - อัปเดตใบแจ้งซ่อม
router.put('/:id', auth, technicianUp, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'ไม่พบรายการ' });

    await request.update(req.body);

    // ถ้าเสร็จสิ้น ให้อัปเดตวันที่ซ่อมล่าสุดของแม่พิมพ์
    if (req.body.status === 'completed' && request.moldId) {
      await Mold.update(
        { lastMaintenanceDate: new Date(), status: 'active' },
        { where: { id: request.moldId } }
      );
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', auth, technicianUp, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'ไม่พบรายการ' });
    await request.update({ status: 'cancelled' });
    res.json({ message: 'ลบ (ยกเลิก) รายการสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
