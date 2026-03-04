const { Sequelize } = require('sequelize');
const express = require('express');
const multer = require('multer');
const httpMocks = require('node-mocks-http');

// Use the local DB definition but push the production connection
process.env.DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com";
process.env.DB_NAME = "postgres";
process.env.DB_PASSWORD = "Mynutsmurf11!N";
process.env.DB_PORT = "6543";
process.env.DB_SSL = "true";
process.env.DB_USER = "postgres.vrttehtkletviugcsxfv";

const { sequelize } = require('./server/config/database');
const MaintenanceRequest = require('./server/models/MaintenanceRequest');

async function testController() {
    try {
        await sequelize.authenticate();

        // Simulate req/res for the controller logic
        const req = httpMocks.createRequest({
            method: 'POST',
            url: '/api/maintenance',
            user: { id: 1 }, // auth middleware mock
            body: {
                moldId: 9, // we know 9 works from previous test
                type: 'repair',
                description: 'Test API Controller Mock',
                reportDate: '2026-03-02',
                productionDate: '2026-03-05'
            },
            files: [] // upload.array mock
        });
        const res = httpMocks.createResponse();

        // Replicate controller exactly
        const count = await MaintenanceRequest.count();
        const requestCode = `MT-${String(count + 1).padStart(4, '0')}`;
        const imageUrls = req.files ? req.files.map(f => `/uploads/maintenance/${f.filename}`) : [];

        console.log("Creating with payload:", {
            requestCode,
            requestedById: req.user.id,
            ...req.body,
            images: imageUrls,
        });

        const request = await MaintenanceRequest.create({
            requestCode,
            requestedById: req.user.id,
            ...req.body,
            images: imageUrls,
        });

        console.log("Success! ID:", request.id);
        await request.destroy();
    } catch (err) {
        console.error("Controller Error:", err.name, err.message);
        if (err.errors) console.log(err.errors);
    } finally {
        process.exit(0);
    }
}

testController();
