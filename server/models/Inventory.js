const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  itemCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'item_code',
  },
  itemName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'item_name',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'min_stock',
  },
  unit: {
    type: DataTypes.STRING(50),
    defaultValue: 'ชิ้น',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'inventory',
  timestamps: true,
  underscored: true,
});

module.exports = Inventory;
