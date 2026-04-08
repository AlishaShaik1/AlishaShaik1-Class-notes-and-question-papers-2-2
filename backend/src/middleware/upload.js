// backend/src/middleware/upload.js
// Supabase-based file upload middleware (replaces Cloudinary)

import multer from 'multer';
import supabase, { BUCKET_NAME } from '../config/supabase.js';

// 1. Use memory storage — file buffer stays in RAM, then we push to Supabase
const storage = multer.memoryStorage();

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
        fileSize: 1024 * 1024 * 11 // 11 MB limit
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

        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(filePath, req.file.buffer, {
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
    }
};