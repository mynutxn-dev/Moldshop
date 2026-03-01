const { sequelize } = require('../config/database');
const User = require('./User');
const Mold = require('./Mold');
const MaintenanceRequest = require('./MaintenanceRequest');
const WorkOrder = require('./WorkOrder');
const MoldHistory = require('./MoldHistory');

// Mold -> MaintenanceRequest
Mold.hasMany(MaintenanceRequest, { foreignKey: 'mold_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Mold, { foreignKey: 'mold_id', as: 'mold' });

// Mold -> WorkOrder
Mold.hasMany(WorkOrder, { foreignKey: 'mold_id', as: 'workOrders' });
WorkOrder.belongsTo(Mold, { foreignKey: 'mold_id', as: 'mold' });

// Mold -> MoldHistory
Mold.hasMany(MoldHistory, { foreignKey: 'mold_id', as: 'history' });
MoldHistory.belongsTo(Mold, { foreignKey: 'mold_id', as: 'mold' });

// User -> MaintenanceRequest (requested by)
User.hasMany(MaintenanceRequest, { foreignKey: 'requested_by_id', as: 'requestedMaintenance' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'requested_by_id', as: 'requestedBy' });

// User -> MaintenanceRequest (assigned to)
User.hasMany(MaintenanceRequest, { foreignKey: 'assigned_to_id', as: 'assignedMaintenance' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });

// User -> WorkOrder (assigned to)
User.hasMany(WorkOrder, { foreignKey: 'assigned_to_id', as: 'assignedWorkOrders' });
WorkOrder.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignedTo' });

// User -> WorkOrder (created by)
User.hasMany(WorkOrder, { foreignKey: 'created_by_id', as: 'createdWorkOrders' });
WorkOrder.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy' });

// User -> MoldHistory (performed by)
User.hasMany(MoldHistory, { foreignKey: 'performed_by_id', as: 'moldActions' });
MoldHistory.belongsTo(User, { foreignKey: 'performed_by_id', as: 'performedBy' });

module.exports = {
  sequelize,
  User,
  Mold,
  MaintenanceRequest,
  WorkOrder,
  MoldHistory,
};
