const express = require('express');
const { Mold, MaintenanceRequest, WorkOrder } = require('../models');
const { auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const totalMolds = await Mold.count();
    const activeMolds = await Mold.count({ where: { status: 'active' } });
    const inUseMolds = await Mold.count({ where: { status: 'in_use' } });
    const maintenanceMolds = await Mold.count({ where: { status: 'maintenance' } });
    const damagedMolds = await Mold.count({ where: { status: 'damaged' } });

    const pendingMaintenance = await MaintenanceRequest.count({ where: { status: 'pending' } });
    const inProgressMaintenance = await MaintenanceRequest.count({ where: { status: 'in_progress' } });

    const pendingWorkOrders = await WorkOrder.count({ where: { status: 'pending' } });
    const inProgressWorkOrders = await WorkOrder.count({ where: { status: 'in_progress' } });

    res.json({
      molds: { total: totalMolds, active: activeMolds, inUse: inUseMolds, maintenance: maintenanceMolds, damaged: damagedMolds },
      maintenance: { pending: pendingMaintenance, inProgress: inProgressMaintenance, total: pendingMaintenance + inProgressMaintenance },
      workOrders: { pending: pendingWorkOrders, inProgress: inProgressWorkOrders, total: pendingWorkOrders + inProgressWorkOrders },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/dashboard/recent-maintenance
router.get('/recent-maintenance', auth, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.findAll({
      include: [{ model: Mold, as: 'mold', attributes: ['moldCode', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 5,
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/dashboard/recent-work-orders
router.get('/recent-work-orders', auth, async (req, res) => {
  try {
    const orders = await WorkOrder.findAll({
      include: [
        { model: Mold, as: 'mold', attributes: ['moldCode', 'name'] },
        { model: require('../models/User'), as: 'assignedTo', attributes: ['firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 5,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
