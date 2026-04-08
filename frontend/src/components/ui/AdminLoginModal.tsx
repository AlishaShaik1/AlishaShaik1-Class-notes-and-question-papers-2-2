// frontend/src/components/ui/AdminLoginModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminLoginModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isVisible, onClose }) => {
    const { login } = useAdmin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        const result = await login(email, password);
        
        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            setTimeout(() => {
                onClose();
                setEmail('');
                setPassword('');
                setMessage({ text: '', type: '' });
            }, 1000);
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: -50, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-extrabold text-pec-blue mb-4 border-b pb-2 text-center">
                            🔐 Admin Login
                        </h3>

                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-3 mb-4 border-l-4 rounded-md font-medium ${
                                    message.type === 'success'
                                        ? 'bg-green-50 border-green-500 text-green-700'
                                        : 'bg-red-50 border-red-500 text-red-700'
                                }`}
                            >
                                {message.text}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pec-blue focus:border-pec-blue transition"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-pec-blue focus:border-pec-blue transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg text-white font-bold transition duration-300 ${
                                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pec-blue hover:bg-indigo-700'
                                }`}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <button
                            onClick={onClose}
                            className="mt-3 w-full py-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdminLoginModal;
