const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Hub SSO Configuration
const HUB_VALIDATE_URL = process.env.HUB_VALIDATE_URL || 'https://polyfoampfs-hub.vercel.app/api/sso/validate';
const SYSTEM_ID = 'moldshop';

// POST /api/auth/sso - SSO login from Hub
router.post('/sso', async (req, res) => {
  try {
    const { sso_token } = req.body;
    console.log('[SSO] Token received:', sso_token ? `${sso_token.substring(0, 30)}...` : 'MISSING');
    
    if (!sso_token) {
      return res.status(400).json({ message: 'Missing SSO token' });
    }

    // Validate token with Hub
    console.log('[SSO] Validating with Hub:', HUB_VALIDATE_URL);
    const validateRes = await fetch(HUB_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sso_token, systemId: SYSTEM_ID }),
    });

    const validateData = await validateRes.json();
    console.log('[SSO] Hub response status:', validateRes.status);
    console.log('[SSO] Hub response data:', JSON.stringify(validateData));
    
    if (!validateRes.ok || !validateData.success) {
      return res.status(401).json({ message: 'Invalid SSO token', detail: validateData });
    }

    const { hubUserId, hubEmail, hubUserMetadata } = validateData.user;
    const username = hubUserMetadata?.username || hubEmail.split('@')[0];

    // 1) Find by hub_user_id (already linked)
    let user = await User.findOne({ where: { hubUserId } });

    // 2) If not linked yet, find by username or email and link
    if (!user) {
      user = await User.findOne({ where: { username } });
      if (!user && hubEmail) {
        user = await User.findOne({ where: { email: hubEmail } });
      }
      if (user) {
        // Link existing user to Hub
        await user.update({ hubUserId });
        console.log('[SSO] Linked existing user:', user.username, '→ Hub:', hubUserId);
      }
    }

    // 3) Create new user only if truly not found
    if (!user) {
      const fullName = hubUserMetadata?.full_name || username;
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || username;
      const lastName = nameParts.slice(1).join(' ') || '-';

      const empCount = await User.count();
      const employeeId = `HUB-${String(empCount + 1).padStart(4, '0')}`;

      user = await User.create({
        employeeId,
        username: `${username}_sso`,
        password: `sso_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        firstName,
        lastName,
        email: hubEmail,
        role: 'viewer',
        department: 'Moldshop',
        isActive: true,
        hubUserId,
      });
      console.log('[SSO] Created new user:', user.username);
    }

    // Generate Moldshop JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('SSO login error:', error);
    res.status(500).json({ message: 'SSO login failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอก username และ password' });
    }

    const user = await User.findOne({
      where: { username, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
