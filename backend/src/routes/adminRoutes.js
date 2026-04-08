// backend/src/routes/adminRoutes.js
import express from 'express';
import { adminLogin, verifyAdmin } from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';
import Note from '../models/Note.js';

const router = express.Router();

// POST /api/admin/login — Static admin login
router.post('/login', adminLogin);

// GET /api/admin/verify — Check if token is still valid
router.get('/verify', adminAuth, verifyAdmin);

// GET /api/admin/analytics — Get all notes + stats (admin only)
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });

        // Build stats
        const stats = {
            totalFiles: notes.length,
            byDepartment: {},
            byType: { Notes: 0, Assignments: 0, Papers: 0 },
            bySubject: {},
            recentUploaders: [],
        };

        const uploaderSet = new Set();

        notes.forEach(note => {
            // By department
            stats.byDepartment[note.department] = (stats.byDepartment[note.department] || 0) + 1;
            // By type
            if (stats.byType[note.fileType] !== undefined) {
                stats.byType[note.fileType]++;
            }
            // By subject
            stats.bySubject[note.subject] = (stats.bySubject[note.subject] || 0) + 1;
            // Unique uploaders
            uploaderSet.add(note.uploaderName);
        });

        stats.totalUploaders = uploaderSet.size;

        res.json({ notes, stats });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

// PUT /api/admin/notes/:id — Update note details (admin only)
router.put('/notes/:id', adminAuth, async (req, res) => {
    try {
        const { title, uploaderName, createdAt } = req.body;
        const updateData = {};
        
        if (title) updateData.title = title;
        if (uploaderName) updateData.uploaderName = uploaderName;
        if (createdAt) {
            const parsedDate = new Date(createdAt);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid createdAt date format' });
            }
            updateData.createdAt = parsedDate;
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({ message: 'Note updated successfully', note: updatedNote });
    } catch (error) {
        console.error('Edit note error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid note ID format' });
        }
        res.status(500).json({ message: 'Failed to update note details' });
    }
});

export default router;

