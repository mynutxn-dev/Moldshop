const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryHistory = sequelize.define('InventoryHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  inventoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'inventory_id',
  },
  type: {
    type: DataTypes.ENUM('in', 'out'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  performedBy: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'performed_by',
  },
  source: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'inventory_history',
  timestamps: true,
  underscored: true,
});

module.exports = InventoryHistory;
