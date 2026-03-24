const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
require('./models');

const authRoutes = require('./routes/auth');
const moldRoutes = require('./routes/molds');
const maintenanceRoutes = require('./routes/maintenance');
const workOrderRoutes = require('./routes/workOrders');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:3001', 'http://localhost:3000'], credentials: true }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "http://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/molds', moldRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Moldshop API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'เกิดข้อผิดพลาดเซิร์ฟเวอร์: ' + err.message });
});

// Start server
const start = async () => {
  await testConnection();
  try {
    await sequelize.sync();
    console.log('✅ Database synced');
  } catch (err) {
    console.warn('⚠️ Database sync warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start().catch(err => {
  console.error('❌ Server start failed:', err.message);
});
