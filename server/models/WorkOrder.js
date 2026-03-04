const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'order_code',
  },
  moldId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'mold_id',
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('new_mold', 'modify', 'repair', 'trial', 'improvement'),
    allowNull: false,
  },
  customer: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('urgent', 'high', 'normal', 'low'),
    defaultValue: 'normal',
  },
  status: {
    type: DataTypes.ENUM(
      'mold_design',
      'aluminium_casting',
      'machine_mold',
      'finishing_mold',
      'finishing_assembly',
      'trial_mold',
      'completed',
      'cancelled'
    ),
    defaultValue: 'mold_design',
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_to_id',
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by_id',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date',
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
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'estimated_hours',
  },
  actualHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'actual_hours',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'work_orders',
  timestamps: true,
  underscored: true,
});

module.exports = WorkOrder;
