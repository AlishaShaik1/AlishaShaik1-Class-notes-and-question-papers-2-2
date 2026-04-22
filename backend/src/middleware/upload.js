// backend/src/middleware/upload.js
// Cloudinary-based file upload middleware

import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
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

// 3. Configure Multer with disk storage
const upload = multer({
    storage: storage,
    fileFilter: pdfFilter,
    limits: {
        fileSize: 1024 * 1024 * 100 // 100 MB upload limit (iLovePDF will compress files > 10 MB before Cloudinary upload)
    }
});

// 4. Multer middleware to accept single file
export const multerUpload = upload.single('pdfFile');

// 5. Cloudinary upload middleware — runs AFTER multer parses the file
export const uploadToCloudinary = async (req, res, next) => {
    // If no file was parsed by multer, skip
    if (!req.file) {
        return next();
    }

    try {
        const filePath = req.file.path;
        console.log(`Uploading to Cloudinary: ${req.file.originalname}`);

        // Upload as 'raw' resource type for PDFs (not image/video)
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'raw',
            folder: 'pec-notes',
            public_id: `${req.file.originalname.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}`,
            overwrite: false,
        });

        // Attach the URL and public_id to the request for the controller
        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryPublicId = result.public_id;

        console.log('Cloudinary upload successful:', result.secure_url);
        next();

    } catch (err) {
        console.error('Cloudinary upload exception:', err.message);
        return res.status(500).json({
            message: 'Upload failed: Server error during file processing.',
            detail: err.message,
        });
    } finally {
        // Clean up temp file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupErr) {
                console.error('Error cleaning up temp file:', cleanupErr.message);
            }
        }
    }
};