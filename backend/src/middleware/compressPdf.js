// backend/src/middleware/compressPdf.js
// Middleware to compress PDFs > 10 MB using iLovePDF API

import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIZE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

// Temp directory for iLovePDF (needs file on disk)
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

/**
 * Middleware: Compress PDF using iLovePDF API if file > 10 MB.
 * Runs AFTER multer, BEFORE uploadToSupabase.
 */
const compressPdf = async (req, res, next) => {
    if (!req.file || (!req.file.buffer && !req.file.path)) return next();

    const isDiskStorage = !!req.file.path;
    const originalSize = isDiskStorage ? fs.statSync(req.file.path).size : req.file.buffer.length;

    if (originalSize <= SIZE_THRESHOLD) {
        console.log(`PDF size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB — under 10 MB, skipping compression.`);
        return next();
    }

    console.log(`PDF size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB — compressing via iLovePDF...`);
    const startTime = Date.now();

    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const tempInputPath = isDiskStorage ? req.file.path : path.join(TEMP_DIR, `input-${Date.now()}.pdf`);

    try {
        // 1. If using memory storage, write buffer to temp file
        if (!isDiskStorage) {
            fs.writeFileSync(tempInputPath, req.file.buffer);
        }

        // 2. Initialize iLovePDF API
        const instance = new ILovePDFApi(
            process.env.ILOVEPDF_PUBLIC_KEY,
            process.env.ILOVEPDF_SECRET_KEY
        );

        // 3. Create compress task
        const task = instance.newTask('compress');
        await task.start();

        // 4. Add file to task
        const file = new ILovePDFFile(tempInputPath);
        await task.addFile(file);

        // 5. Process with recommended compression level
        await task.process({ compression_level: 'recommended' });

        // 6. Download compressed file
        const compressedData = await task.download();

        // compressedData is a Buffer
        const compressedSize = compressedData.length;
        const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`✓ iLovePDF compression done in ${elapsed}s`);
        console.log(`✓ ${(originalSize / (1024 * 1024)).toFixed(2)} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB (${reductionPercent}% smaller)`);

        // Only use compressed version if it's actually smaller
        if (compressedSize < originalSize) {
            if (isDiskStorage) {
                fs.writeFileSync(req.file.path, Buffer.from(compressedData));
                req.file.size = compressedSize;
            } else {
                req.file.buffer = Buffer.from(compressedData);
                req.file.size = compressedSize;
            }
        } else {
            console.log('Compressed file is not smaller. Using original.');
        }

        next();

    } catch (err) {
        console.error('iLovePDF compression failed:', err.message);
        console.log('Proceeding with original file...');
        next();
    } finally {
        // Clean up temp file only if it was created specifically for memory storage fallback
        try { if (!isDiskStorage && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath); } catch (_) {}
    }
};

export default compressPdf;
