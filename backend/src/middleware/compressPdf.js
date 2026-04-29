// backend/src/middleware/compressPdf.js
// Middleware to compress PDFs > 10 MB using iLovePDF API
// Files ≤ 10 MB go directly to Cloudinary, files > 10 MB get compressed first.

import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLOUDINARY_MAX = 10 * 1024 * 1024; // 10 MB — Cloudinary free plan limit for raw files

// Use OS temp dir — guaranteed writable on all hosting platforms (Render, Railway, etc.)
const TEMP_DIR = os.tmpdir();

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
 *                 if iLovePDF fails (quota, network, etc.) → WARN and fall through
 *                   (Cloudinary will reject if still > 10 MB, but small files pass)
 *                 if still > 10 MB after compression → reject with clear message
 */
const compressPdf = async (req, res, next) => {
    if (!req.file || (!req.file.buffer && !req.file.path)) return next();

    const isDiskStorage = !!req.file.path;
    const originalSize = isDiskStorage ? fs.statSync(req.file.path).size : req.file.buffer.length;
    const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);

    // Under 10 MB — no compression needed, go straight to Cloudinary
    if (originalSize <= CLOUDINARY_MAX) {
        console.log(`PDF size: ${originalSizeMB} MB — under 10 MB, uploading directly.`);
        return next();
    }

    console.log(`PDF size: ${originalSizeMB} MB — exceeds 10 MB, attempting iLovePDF compression...`);
    const startTime = Date.now();

    // os.tmpdir() is always writable — no need to create it
    const tempInputPath = isDiskStorage
        ? req.file.path
        : path.join(TEMP_DIR, `input-${crypto.randomUUID()}.pdf`);

    try {
        // If using memory storage, write buffer to temp file
        if (!isDiskStorage) {
            fs.writeFileSync(tempInputPath, req.file.buffer);
        }

        let compressedBuffer = null;
        let compressedSize = originalSize;
        let elapsed = '0';

        try {
            // --- ATTEMPT 1: 'recommended' compression ---
            console.log('→ Attempt 1: Compressing with "recommended" level...');
            compressedBuffer = await compressWithILovePDF(tempInputPath, 'recommended');
            compressedSize = compressedBuffer.length;
            elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`  Result: ${originalSizeMB} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB in ${elapsed}s`);

            // --- ATTEMPT 2: If still > 10 MB, try 'extreme' compression ---
            if (compressedSize > CLOUDINARY_MAX) {
                console.log('→ Attempt 2: Still over 10 MB, retrying with "extreme" compression...');
                compressedBuffer = await compressWithILovePDF(tempInputPath, 'extreme');
                compressedSize = compressedBuffer.length;
                elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`  Result: ${originalSizeMB} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB in ${elapsed}s`);
            }

        } catch (ilovepdfErr) {
            // ⚠️ iLovePDF failed (quota exhausted, API down, network error, etc.)
            // Log the reason clearly and fall back to original file.
            const reason = ilovepdfErr?.message || String(ilovepdfErr);
            console.warn(`⚠️  iLovePDF compression unavailable: ${reason}`);
            console.warn(`⚠️  Falling back to original file (${originalSizeMB} MB). Upload will fail only if > 10 MB.`);
            compressedBuffer = null; // signal: use original
            compressedSize = originalSize;
        }

        // --- FINAL SIZE CHECK ---
        if (compressedSize > CLOUDINARY_MAX) {
            const sizeMB = (compressedSize / (1024 * 1024)).toFixed(1);
            const wasCompressed = compressedBuffer !== null;
            const msg = wasCompressed
                ? `File is too large even after compression (${sizeMB} MB). Max allowed is 10 MB. Please split or reduce the PDF.`
                : `File is ${sizeMB} MB which exceeds the 10 MB limit, and compression is currently unavailable (API quota may be exhausted). Please upload a smaller PDF.`;

            console.error(`✗ ${msg}`);
            return res.status(400).json({ message: msg });
        }

        // --- SUCCESS: apply compressed data if we got it ---
        if (compressedBuffer) {
            const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
            console.log(`✓ Compression successful! ${originalSizeMB} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB (${reductionPercent}% smaller) in ${elapsed}s`);

            if (isDiskStorage) {
                fs.writeFileSync(req.file.path, compressedBuffer);
                req.file.size = compressedSize;
            } else {
                req.file.buffer = compressedBuffer;
                req.file.size = compressedSize;
            }
        }
        // else: original file is already on disk / in buffer — nothing to do

        next();

    } finally {
        // Clean up temp file only if it was created for memory storage
        try {
            if (!isDiskStorage && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        } catch (_) {}
    }
};

export default compressPdf;
