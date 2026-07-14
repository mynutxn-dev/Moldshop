const express = require('express');
const multer = require('multer');
const path = require('path');
const { WorkOrder, Mold, User } = require('../models');
const { auth, technicianUp } = require('../middleware/auth');
const { Op } = require('sequelize');
const { uploadImage, deleteImage } = require('../config/supabaseStorage');
const router = express.Router();
const MAX_WORK_ORDER_IMAGES = 10;
const getBangkokDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

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
        { workLocation: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
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
router.post('/', auth, technicianUp, upload.array('images', MAX_WORK_ORDER_IMAGES), async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await WorkOrder.count();
    const orderCode = `WO-${year}-${String(count + 1).padStart(3, '0')}`;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadFilesToSupabase(req.files);
    }

    const currentStageDate = req.body.currentStageDate || getBangkokDate();
    const workLocation = req.body.workLocation?.trim() || null;
    const initialComment = req.body.notes?.trim() || '';
    const assignedToId = req.body.assignedToId || null;

    const wo = await WorkOrder.create({
      orderCode,
      createdById: req.user.id,
      images,
      ...req.body,
      currentStageDate,
      workLocation,
      notes: initialComment || null,
      assignedToId,
      progressLogs: [{
        date: currentStageDate,
        status: req.body.status || 'mold_design',
        comment: initialComment,
        workLocation: workLocation || '',
        assignedToId,
        createdById: req.user.id,
        createdAt: new Date().toISOString(),
      }],
    });
    res.status(201).json(wo);
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างงาน: ' + error.message });
  }
});

// POST /api/work-orders/:id/images - อัพโหลดรูปเพิ่ม
router.post('/:id/images', auth, upload.array('images', MAX_WORK_ORDER_IMAGES), async (req, res) => {
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

    const { progressComment, recordProgress, currentStageEndDate, ...requestData } = req.body;
    const payload = { ...requestData };
    if (Object.prototype.hasOwnProperty.call(req.body, 'assignedToId')) {
      payload.assignedToId = req.body.assignedToId === '' ? null : req.body.assignedToId;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'workLocation')) {
      payload.workLocation = req.body.workLocation?.trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'notes')) {
      payload.notes = req.body.notes?.trim() || null;
    }

    if (req.body.status && req.body.status !== wo.status && !req.body.currentStageDate) {
      payload.currentStageDate = getBangkokDate();
    }

    const stageStartDate = payload.currentStageDate || wo.currentStageDate;
    if (currentStageEndDate && stageStartDate && new Date(currentStageEndDate) < new Date(stageStartDate)) {
      return res.status(400).json({ message: 'วันที่จบขั้นตอนต้องไม่ก่อนวันที่เริ่มขั้นตอน' });
    }

    if (payload.status === 'completed') {
      payload.completedDate = currentStageEndDate
        || payload.completedDate
        || (req.body.status !== wo.status ? payload.currentStageDate : wo.completedDate)
        || wo.currentStageDate
        || getBangkokDate();
      payload.progress = 100;
    } else if (payload.status === 'trial_mold' && !wo.progress) {
      payload.progress = 83;
    }

    if (recordProgress === true || recordProgress === 'true') {
      const comment = progressComment?.trim() || '';
      const assignedToId = payload.assignedToId ?? wo.assignedToId ?? null;
      const workLocation = payload.workLocation ?? wo.workLocation ?? '';
      payload.progressLogs = [
        ...(wo.progressLogs || []),
        {
          date: payload.currentStageDate || wo.currentStageDate || getBangkokDate(),
          endDate: currentStageEndDate || '',
          status: payload.status || wo.status,
          comment,
          workLocation: workLocation || '',
          assignedToId,
          createdById: req.user.id,
          createdAt: new Date().toISOString(),
        },
      ];
      if (comment) payload.notes = comment;
    }

    await wo.update(payload);
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
