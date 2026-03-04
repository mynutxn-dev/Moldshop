// Force Vercel's bundler to include pg (Sequelize loads it dynamically)
require('pg');

let app;

try {
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');

    const { sequelize, testConnection } = require('../server/config/database');
    require('../server/models');

    const authRoutes = require('../server/routes/auth');
    const moldRoutes = require('../server/routes/molds');
    const maintenanceRoutes = require('../server/routes/maintenance');
    const workOrderRoutes = require('../server/routes/workOrders');
    const userRoutes = require('../server/routes/users');
    const dashboardRoutes = require('../server/routes/dashboard');
    const inventoryRoutes = require('../server/routes/inventory');

    app = express();

    // Middleware
    app.use(cors({
        origin: true,
        credentials: true,
    }));
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
        res.json({ status: 'ok', message: 'Moldshop API is running on Vercel' });
    });

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Express error:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    });

    // Global connection state for serverless reuse
    let isConnected = false;
    const ensureDB = async () => {
        if (!isConnected) {
            await testConnection();
            try {
                await sequelize.sync({ alter: true });
            } catch (syncErr) {
                console.warn('DB sync warning (non-fatal):', syncErr.message);
            }
            isConnected = true;
        }
    };

    // Wrap for serverless
    const originalHandler = app;
    app = async (req, res) => {
        try {
            await ensureDB();
            return originalHandler(req, res);
        } catch (error) {
            console.error('DB connection error:', error);
            res.status(500).json({ message: 'Database connection failed', error: error.message });
        }
    };

} catch (error) {
    console.error('Module loading error:', error);
    const express = require('express');
    app = express();
    app.use((req, res) => {
        res.status(500).json({
            message: 'Server initialization failed',
            error: error.message,
            stack: error.stack
        });
    });
}

module.exports = app;
