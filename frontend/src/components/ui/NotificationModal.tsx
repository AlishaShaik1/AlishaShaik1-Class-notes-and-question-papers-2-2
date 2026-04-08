// frontend/src/components/ui/NotificationModal.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode; // Allows passing a string or JSX content
}

const Modal: React.FC<NotificationModalProps> = ({ isVisible, onClose, title, message }) => {
  if (!isVisible) return null;

  return (
    // Backdrop for semi-transparent background
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
    >
      {/* Modal Content */}
      <motion.div
        initial={{ y: -50, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full transform"
      >
        <h3 className="text-2xl font-extrabold text-pec-blue mb-4 border-b pb-2">
          {title}
        </h3>
        
        <div className="text-gray-700 text-base leading-relaxed">
          {message}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-pec-green text-white font-bold rounded-lg hover:bg-pec-blue transition duration-200"
        >
          I Understand & Proceed to Upload
        </button>
      </motion.div>
    </motion.div>
  );
};

// VITAL FIX: Export the component as the default module export.
// This resolves the "does not provide an export named 'default'" error.
export default Modal;