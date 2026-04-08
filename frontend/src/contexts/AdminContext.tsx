// frontend/src/contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AdminContextType {
    isAdmin: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
    isAdmin: false,
    loading: true,
    login: async () => ({ success: false, message: '' }),
    logout: () => { },
});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check if a valid token exists on mount
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                await axios.get(`${API_BASE_URL}/api/admin/verify`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsAdmin(true);
            } catch {
                localStorage.removeItem('adminToken');
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
                email,
                password,
            });
            localStorage.setItem('adminToken', response.data.token);
            setIsAdmin(true);
            return { success: true, message: 'Login successful!' };
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Login failed.';
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setIsAdmin(false);
    };

    return (
        <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
            {children}
        </AdminContext.Provider>
    );
};

export default AdminContext;
