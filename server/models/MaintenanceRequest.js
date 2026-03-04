const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  requestCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'request_code',
  },
  moldId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'mold_id',
  },
  type: {
    type: DataTypes.ENUM('repair', 'pm', 'inspection', 'cleaning'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('urgent', 'high', 'normal', 'low'),
    defaultValue: 'normal',
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  requestedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'requested_by_id',
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_to_id',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'due_date',
  },
  completedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'completed_date',
  },
  productionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'production_date',
  },
  reportDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'report_date',
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  spareParts: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'spare_parts',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('images');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('images', val ? JSON.stringify(val) : null);
    },
  },
}, {
  tableName: 'maintenance_requests',
  timestamps: true,
  underscored: true,
});

module.exports = MaintenanceRequest;
