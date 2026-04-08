// backend/src/controllers/adminController.js
// Static admin login — hardcoded credentials from .env

import jwt from 'jsonwebtoken';

// @desc    Admin login with static credentials
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        return res.status(500).json({ message: 'Admin credentials not configured on server.' });
    }

    if (email === adminEmail && password === adminPassword) {
        const token = jwt.sign(
            { role: 'admin', email: adminEmail },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            message: 'Admin login successful',
            token,
        });
    } else {
        return res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

// @desc    Verify admin token is still valid
// @route   GET /api/admin/verify
// @access  Admin only
export const verifyAdmin = async (req, res) => {
    // If this endpoint is reached, the adminAuth middleware has already verified the token
    res.json({ message: 'Token is valid', admin: true });
};
