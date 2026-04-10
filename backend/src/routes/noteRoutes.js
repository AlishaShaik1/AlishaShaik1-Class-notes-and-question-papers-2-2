// backend/src/routes/noteRoutes.js
import express from 'express';
import { uploadNote, getNotes, deleteNote } from '../controllers/noteController.js'; 
import { multerUpload, uploadToSupabase } from '../middleware/upload.js'; 
import compressPdf from '../middleware/compressPdf.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// --- GET /api/notes — Fetch all notes (with optional ?department= filter) ---
// --- POST /api/notes — Upload a new note (public) ---
router
    .route('/')
    .get(getNotes)
    .post(
        // Step 1: Multer parses the multipart form and loads file into memory
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
        // Step 3: Upload the file buffer to Supabase Storage
        uploadToSupabase,
        // Step 4: Save the note metadata to MongoDB
        uploadNote
    );

// --- DELETE /api/notes/:id — Delete a note (Admin only) ---
router.route('/:id')
    .delete(adminAuth, deleteNote); 

export default router;