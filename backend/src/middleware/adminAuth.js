// backend/src/middleware/adminAuth.js
// JWT verification middleware for admin-only routes

import jwt from 'jsonwebtoken';

const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Admin auth error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
};

export default adminAuth;
