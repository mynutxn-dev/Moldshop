const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MoldHistory = sequelize.define('MoldHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  moldId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'mold_id',
  },
  action: {
    type: DataTypes.ENUM('checkout', 'return', 'maintenance', 'repair', 'inspection', 'production', 'status_change'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  performedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'performed_by_id',
  },
  machineNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'machine_no',
  },
  lotNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'lot_number',
  },
  shotsBefore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'shots_before',
  },
  shotsAfter: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'shots_after',
  },
}, {
  tableName: 'mold_history',
  timestamps: true,
  underscored: true,
});

module.exports = MoldHistory;
