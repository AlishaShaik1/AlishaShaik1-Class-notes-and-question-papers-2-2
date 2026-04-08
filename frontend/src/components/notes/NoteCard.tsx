// frontend/src/components/notes/NoteCard.tsx
import React from "react";
import { motion } from "framer-motion";
import { Download, Eye, Trash2 } from "lucide-react";
import { useAdmin } from "../../contexts/AdminContext";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Note {
  _id: string;
  title: string;
  subject: string;
  courseYear: number;
  fileUrl: string;
  uploaderName: string;
  createdAt: string;
}

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  const { isAdmin } = useAdmin();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });

  const handleDownload = async () => {
    try {
      window.open(note.fileUrl, "_blank");
      const response = await fetch(note.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = note.title?.replace(/\s+/g, "_") + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const handleView = () => {
    window.open(note.fileUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/api/notes/${note._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onDelete) onDelete(note._id);
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Failed to delete note. Check console.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
      className="relative overflow-hidden rounded-2xl p-6 bg-white/50 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-2xl transition-all"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-blue-50/30 opacity-60 rounded-2xl -z-10" />

      {/* Admin Delete Button */}
      {isAdmin && (
        <motion.button
          onClick={handleDelete}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all z-10"
          title="Delete this note"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      )}

      <div className="flex flex-col h-full justify-between space-y-4">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2 line-clamp-2">
            {note.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 shadow-sm">
              {note.subject}
            </span>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-300 to-blue-500 text-white shadow-sm">
              Year: {note.courseYear}
            </span>
          </div>
          <div className="text-gray-700 text-sm border-t border-gray-300/40 pt-3 space-y-1">
            <p><span className="font-semibold text-gray-900">Uploaded By:</span> {note.uploaderName}</p>
            <p><span className="font-semibold text-gray-900">Uploaded On:</span> {formatDate(note.createdAt)}</p>
          </div>
        </div>
        <div className="flex justify-between gap-3 mt-4">
          <motion.button onClick={handleView} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-1/2 flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-md hover:bg-indigo-600 transition-all duration-300">
            <Eye className="w-5 h-5" /> View PDF
          </motion.button>
          <motion.button onClick={handleDownload} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-1/2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-md hover:from-green-600 hover:to-blue-600 transition-all duration-300">
            <Download className="w-5 h-5" /> Download
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;