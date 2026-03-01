const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mold = sequelize.define('Mold', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  moldCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'mold_code',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  customer: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  partNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'part_number',
  },
  partName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'part_name',
  },
  cavity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  material: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  sizeWidth: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'size_width',
  },
  sizeLength: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'size_length',
  },
  sizeHeight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'size_height',
  },
  machineType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'machine_type',
  },
  cycleTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'cycle_time',
  },
  shotCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'shot_count',
  },
  maxShot: {
    type: DataTypes.INTEGER,
    defaultValue: 500000,
    field: 'max_shot',
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'in_use', 'maintenance', 'damaged', 'retired'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
  },
  lastMaintenanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_maintenance_date',
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'next_maintenance_date',
  },
}, {
  tableName: 'molds',
  timestamps: true,
  underscored: true,
});

module.exports = Mold;
