// backend/src/middleware/compressPdf.js
// Middleware to compress PDFs > 10 MB using iLovePDF API
// Files ≤ 10 MB go directly to Cloudinary, files > 10 MB get compressed first.

import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLOUDINARY_MAX = 10 * 1024 * 1024; // 10 MB — Cloudinary free plan limit for raw files

// Temp directory for iLovePDF (needs file on disk)
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

/**
 * Compress a PDF using iLovePDF at the given compression level.
 * Returns a Buffer of the compressed file.
 */
async function compressWithILovePDF(inputPath, level) {
    const instance = new ILovePDFApi(
        process.env.ILOVEPDF_PUBLIC_KEY,
        process.env.ILOVEPDF_SECRET_KEY
    );

    const task = instance.newTask('compress');
    await task.start();

    const file = new ILovePDFFile(inputPath);
    await task.addFile(file);

    await task.process({ compression_level: level });

    const compressedData = await task.download();
    return Buffer.from(compressedData);
}

/**
 * Middleware: Compress PDF using iLovePDF API if file > 10 MB.
 * Runs AFTER multer, BEFORE uploadToCloudinary.
 * 
 * Logic:
 *   - ≤ 10 MB  → skip, upload directly to Cloudinary
 *   - > 10 MB  → try 'recommended' compression first
 *                 if still > 10 MB → try 'extreme' compression
 *                 if still > 10 MB → reject the upload
 */
const compressPdf = async (req, res, next) => {
    if (!req.file || (!req.file.buffer && !req.file.path)) return next();

    const isDiskStorage = !!req.file.path;
    const originalSize = isDiskStorage ? fs.statSync(req.file.path).size : req.file.buffer.length;

    // Under 10 MB — no compression needed, go straight to Cloudinary
    if (originalSize <= CLOUDINARY_MAX) {
        console.log(`PDF size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB — under 10 MB, uploading directly.`);
        return next();
    }

    console.log(`PDF size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB — exceeds 10 MB Cloudinary limit, compressing...`);
    const startTime = Date.now();

    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const tempInputPath = isDiskStorage ? req.file.path : path.join(TEMP_DIR, `input-${crypto.randomUUID()}.pdf`);

    try {
        // If using memory storage, write buffer to temp file
        if (!isDiskStorage) {
            fs.writeFileSync(tempInputPath, req.file.buffer);
        }

        // --- ATTEMPT 1: 'recommended' compression ---
        console.log('→ Attempt 1: Compressing with "recommended" level...');
        let compressedBuffer = await compressWithILovePDF(tempInputPath, 'recommended');
        let compressedSize = compressedBuffer.length;
        let elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`  Result: ${(originalSize / (1024 * 1024)).toFixed(2)} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB in ${elapsed}s`);

        // --- ATTEMPT 2: If still > 10 MB, try 'extreme' compression ---
        if (compressedSize > CLOUDINARY_MAX) {
            console.log('→ Attempt 2: Still over 10 MB, retrying with "extreme" compression...');
            compressedBuffer = await compressWithILovePDF(tempInputPath, 'extreme');
            compressedSize = compressedBuffer.length;
            elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            console.log(`  Result: ${(originalSize / (1024 * 1024)).toFixed(2)} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB in ${elapsed}s`);
        }

        // --- FINAL CHECK: If still > 10 MB after extreme, reject ---
        if (compressedSize > CLOUDINARY_MAX) {
            console.error(`✗ File still ${(compressedSize / (1024 * 1024)).toFixed(2)} MB after extreme compression. Cannot upload.`);
            return res.status(400).json({
                message: `File is too large even after compression (${(compressedSize / (1024 * 1024)).toFixed(1)} MB). Cloudinary free plan allows max 10 MB per file. Please try a smaller PDF.`,
            });
        }

        // Success — write compressed file back
        const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        console.log(`✓ Compression successful! ${(originalSize / (1024 * 1024)).toFixed(2)} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB (${reductionPercent}% smaller) in ${elapsed}s`);

        if (isDiskStorage) {
            fs.writeFileSync(req.file.path, compressedBuffer);
            req.file.size = compressedSize;
        } else {
            req.file.buffer = compressedBuffer;
            req.file.size = compressedSize;
        }

        next();

    } catch (err) {
        console.error('iLovePDF compression failed:', err);
        return res.status(500).json({
            message: 'PDF compression failed. Please try uploading a smaller file (under 10 MB).',
        });
    } finally {
        // Clean up temp file only if it was created for memory storage
        try { if (!isDiskStorage && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath); } catch (_) {}
    }
};

export default compressPdf;
