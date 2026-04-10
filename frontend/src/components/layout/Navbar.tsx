// frontend/src/components/layout/Navbar.tsx
import React, { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdmin } from "../../contexts/AdminContext";
import AdminLoginModal from "../ui/AdminLoginModal";

const DEPT_NAMES: Record<string, string> = {
    aiml: 'AIML', cse: 'CSE', ds: 'DS',
};

const Navbar: React.FC = () => {
  const { department } = useParams<{ department: string }>();
  const location = useLocation();
  const { isAdmin, logout } = useAdmin();
  const [showLogin, setShowLogin] = useState(false);

  const deptKey = department?.toLowerCase() || '';
  const deptName = DEPT_NAMES[deptKey] || '';
  const displayDept = deptKey === 'aiml' ? 'AIML & AI' : deptName;
  const isHome = location.pathname === '/';
  const titleText = isHome ? 'PEC Notes Hub' : displayDept ? `${displayDept} 2-2 Notes & Papers` : 'PEC Notes Hub';
  const shortTitle = isHome ? 'PEC Notes Hub' : displayDept ? `${displayDept} 2-2 Notes` : 'PEC Notes Hub';
  // Even shorter title for mobile when admin is logged in (extra buttons cause overlap)
  const adminMobileTitle = isHome ? 'PEC Notes' : displayDept || 'PEC Notes';

  return (
    <>
      <nav className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="relative flex items-center justify-between h-16 md:h-20">
            {/* Left: Logo */}
            <Link to={deptKey ? `/${deptKey}/library` : '/'} className="flex-shrink-0 z-10">
              <motion.img src="https://tse1.mm.bing.net/th/id/OIP.v3GbNXGV_rYeOcVEXSL1IQHaCw?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Logo" className="h-8 md:h-12 w-auto object-contain drop-shadow-md rounded-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} whileHover={{ scale: 1.05 }} />
            </Link>

            {/* Center: Title */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isHome ? '' : isAdmin ? 'pr-36 sm:pr-40' : 'pr-20 sm:pr-24'} md:pr-0`}>
              {/* Mobile: short title (even shorter when admin logged in to avoid overlap) */}
              <motion.span className={`md:hidden text-white font-extrabold tracking-wide uppercase drop-shadow-lg whitespace-nowrap pointer-events-auto ${isHome ? 'text-sm sm:text-base tracking-wider' : 'text-[11px] sm:text-xs'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                {isAdmin ? adminMobileTitle : shortTitle}
              </motion.span>
              {/* Desktop: full title */}
              <motion.span className="hidden md:block text-white font-extrabold tracking-wide uppercase drop-shadow-lg text-2xl lg:text-3xl whitespace-nowrap pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                {titleText}
              </motion.span>
            </div>

            {/* Right: Buttons */}
            <div className="flex items-center space-x-2 md:space-x-4 z-10">
              {!isHome && (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                  <Link to="/" className="bg-white/20 text-white px-2 py-1 md:px-4 md:py-2 rounded-md font-semibold text-[11px] md:text-sm uppercase shadow-md hover:bg-white/30 transition-all duration-200 whitespace-nowrap">Home</Link>
                </motion.div>
              )}
              {deptKey && (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                  <Link to={`/${deptKey}/upload`} className="bg-green-500 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-md font-semibold text-xs md:text-base uppercase shadow-md hover:bg-green-600 transition-all duration-200 whitespace-nowrap">Upload</Link>
                </motion.div>
              )}
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                  <Link to="/admin/analytics" className="bg-yellow-400 text-gray-900 px-2 py-1 md:px-4 md:py-2 rounded-md font-semibold text-[11px] md:text-sm uppercase shadow-md hover:bg-yellow-500 transition-all duration-200 whitespace-nowrap">📊</Link>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                {isAdmin ? (
                  <button onClick={logout} className="bg-red-500/80 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-md font-semibold text-xs uppercase shadow-md hover:bg-red-600 transition-all duration-200 whitespace-nowrap">Logout</button>
                ) : (
                  <button onClick={() => setShowLogin(true)} className="bg-white/10 text-white/70 px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium text-xs uppercase shadow-sm hover:bg-white/20 hover:text-white transition-all duration-200 whitespace-nowrap">🔒</button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </nav>
      <AdminLoginModal isVisible={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Navbar;