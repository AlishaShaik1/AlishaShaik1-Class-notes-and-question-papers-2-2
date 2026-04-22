// backend/src/routes/noteRoutes.js
import express from 'express';
import { uploadNote, getNotes, deleteNote, editNote } from '../controllers/noteController.js'; 
import { multerUpload, uploadToCloudinary } from '../middleware/upload.js'; 
import compressPdf from '../middleware/compressPdf.js';
import adminAuth from '../middleware/adminAuth.js';

import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware: Try to authenticate as admin, but DON'T block if not admin
const optionalAdminAuth = (req, res, next) => {
    req.isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') {
                req.isAdmin = true;
                req.admin = decoded;
            }
        } catch {}
    }
    next();
};

// --- GET /api/notes — Fetch all notes (with optional ?department= filter) ---
// --- POST /api/notes — Upload a new note (public) ---
router
    .route('/')
    .get(getNotes)
    .post(
        // Step 1: Multer parses the multipart form and loads file to disk
        (req, res, next) => {
            multerUpload(req, res, function (err) {
                if (err) {
                    console.error("--- MULTER UPLOAD ERROR ---");
                    console.error("Cause:", err.message);
                    return res.status(500).json({ 
                        message: "Upload failed: Error during file processing.", 
                        detail: err.message
                    });
                }
                next();
            });
        },
        // Step 2: Compress PDF if size > 10 MB
        compressPdf,
        // Step 3: Upload the file to Cloudinary Storage
        uploadToCloudinary,
        // Step 4: Save the note metadata to MongoDB
        uploadNote
    );

// --- PUT /api/notes/:id — Edit note (Uploader via token or Admin via JWT) ---
// --- DELETE /api/notes/:id — Delete a note (Uploader via token or Admin via JWT) ---
router.route('/:id')
    .put(optionalAdminAuth, editNote)
    .delete(optionalAdminAuth, deleteNote); 

export default router;