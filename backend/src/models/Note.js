// backend/src/models/Note.js
import mongoose from 'mongoose';

const noteSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        chapter: { 
            type: Number,
            required: true,
            max: 10,
        },
        courseYear: {
            type: Number,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        // Path in Supabase storage (used for deletion)
        filePath: {
            type: String,
            default: '',
        },
        fileType: {
            type: String,
            required: true,
            enum: ['Notes', 'Papers', 'Assignments'], 
        },
        // NEW: Department field for multi-department support
        department: {
            type: String,
            required: true,
            enum: ['AIML', 'CSE', 'DS'],
        },
        uploaderName: {
            type: String,
            required: true,
            default: 'Anonymous',
            maxlength: 50,
        },
    },
    {
        timestamps: true,
    }
);

const Note = mongoose.model('Note', noteSchema);

export default Note;