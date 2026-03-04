const { Sequelize } = require('sequelize');
require('dotenv').config();

const isSSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'moldshop_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: isSSL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    // Disable prepared statements for PgBouncer (Supabase pooler)
    dialectModule: require('pg'),
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = { sequelize, testConnection };
