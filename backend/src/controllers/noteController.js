// backend/src/controllers/noteController.js

import Note from '../models/Note.js';
import supabase, { BUCKET_NAME } from '../config/supabase.js';

// -----------------------------------------------------------------------
// @desc    Upload a new PDF note
// @route   POST /api/notes
// @access  Public
export const uploadNote = async (req, res) => {
    console.log('uploadNote called');
    console.log('req.file:', req.file ? req.file.originalname : 'NO FILE');
    console.log('req.body:', req.body);
    
    if (req.fileValidationError) {
        console.log('File validation error:', req.fileValidationError);
        return res.status(400).json({ message: req.fileValidationError });
    }

    if (!req.file) {
        console.log('No req.file found - Upload failed upstream');
        return res.status(500).json({ message: 'File upload failed or file object is missing.' });
    }

    // Extract metadata fields (including department)
    const { 
        title, 
        subject, 
        courseYear, 
        uploaderName, 
        fileType,
        chapter,
        department
    } = req.body; 
    
    const isNotes = fileType === 'Notes';
    const chapterNum = isNotes ? parseInt(chapter, 10) : 0; 
    const yearNum = parseInt(courseYear, 10);
    const finalSubject = subject || 'N/A';

    // Get the Supabase URL from the upload middleware
    const fileUrl = req.file.supabaseUrl;
    const filePath = req.file.supabasePath || '';

    // Validate required fields
    const validDepartments = ['AIML', 'CSE', 'DS', 'AI'];
    if (!title || !subject || isNaN(yearNum) || !fileType || !uploaderName || 
        (isNotes && isNaN(chapterNum)) || !department || !validDepartments.includes(department)) { 
        console.log('Validation Failed: Missing required data.');
        console.log(`Debug: Chapter=${chapterNum}, Year=${yearNum}, Dept=${department}`);
        return res.status(400).json({ message: 'Missing required data or invalid values.' });
    }

    try {
        const note = new Note({
            title,
            subject: finalSubject,
            courseYear: yearNum, 
            fileUrl, 
            filePath,
            fileType, 
            chapter: chapterNum,
            department,
            uploaderName: uploaderName || 'Anonymous', 
        });

        const createdNote = await note.save();
        res.status(201).json(createdNote);

    } catch (error) {
        console.error('Database save error:', error.message);
        res.status(500).json({ message: 'Failed to save note metadata.', error: error.message });
    }
};

// -----------------------------------------------------------------------
// @desc    Fetch notes (optionally filtered by department)
// @route   GET /api/notes?department=AIML
// @access  Public
export const getNotes = async (req, res) => {
    try {
        const filter = {};
        
        // Filter by department if provided
        if (req.query.department) {
            filter.department = req.query.department.toUpperCase();
        }

        const notes = await Note.find(filter).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notes.', error: error.message });
    }
};

// -----------------------------------------------------------------------
// @desc    Download/redirect to a specific note file   
// @route   GET /api/notes/download/:id
// @access  Public
export const downloadNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (note) {
            return res.redirect(note.fileUrl); 
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error processing download request.', error: error.message });
    }
};

// -----------------------------------------------------------------------
// @desc    Delete a note by ID (also removes file from Supabase)
// @route   DELETE /api/notes/:id
// @access  Admin Only
export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found in database.' });
        }

        // Delete from Supabase storage if path exists
        if (note.filePath) {
            try {
                const { error: storageError } = await supabase
                    .storage
                    .from(BUCKET_NAME)
                    .remove([note.filePath]);

                if (storageError) {
                    console.warn('Supabase file deletion warning:', storageError.message);
                } else {
                    console.log('Supabase file deleted:', note.filePath);
                }
            } catch (storageErr) {
                console.warn('Supabase deletion exception (continuing):', storageErr.message);
            }
        }

        // Delete from MongoDB
        await Note.deleteOne({ _id: req.params.id });
        res.json({ message: 'Note removed successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to delete note.', error: error.message });
    }
};