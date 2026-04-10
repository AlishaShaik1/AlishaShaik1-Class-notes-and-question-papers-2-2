// backend/src/middleware/upload.js
// Supabase-based file upload middleware (replaces Cloudinary)

import multer from 'multer';
import supabase, { BUCKET_NAME } from '../config/supabase.js';
import fs from 'fs';
import os from 'os';

// 1. Use disk storage — reduces memory usage for large files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
});

// 2. File Filter (Only PDFs allowed)
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        req.fileValidationError = 'Only PDF files are allowed.';
        cb(null, false);
    }
};

// 3. Configure Multer with memory storage
const upload = multer({
    storage: storage,
    fileFilter: pdfFilter,
    limits: {
        fileSize: 1024 * 1024 * 50 // 50 MB total upload limit (compression middleware explicitly handles files > 10 MB)
    }
});

// 4. Multer middleware to accept single file
export const multerUpload = upload.single('pdfFile');

// 5. Supabase upload middleware — runs AFTER multer parses the file
export const uploadToSupabase = async (req, res, next) => {
    // If no file was parsed by multer, skip
    if (!req.file) {
        return next();
    }

    try {
        const fileExtension = req.file.originalname.split('.').pop();
        const baseName = req.file.originalname.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = `uploads/${baseName}-${Date.now()}.${fileExtension}`;

        console.log(`Uploading to Supabase: ${filePath}`);

        const fileData = fs.readFileSync(req.file.path);

        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(filePath, fileData, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error.message);
            return res.status(500).json({
                message: 'Upload failed: Supabase storage error.',
                detail: error.message,
            });
        }

        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        // Attach the URL and path to the request for the controller
        req.file.supabaseUrl = publicUrlData.publicUrl;
        req.file.supabasePath = filePath;

        console.log('Supabase upload successful:', publicUrlData.publicUrl);
        next();

    } catch (err) {
        console.error('Supabase upload exception:', err.message);
        return res.status(500).json({
            message: 'Upload failed: Server error during file processing.',
            detail: err.message,
        });
    } finally {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupErr) {
                console.error('Error cleaning up temp file:', cleanupErr.message);
            }
        }
    }
};