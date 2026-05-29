import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiBriefcase,
  FiBook, 
  FiUsers, 
  FiMenu,
  FiX,
  FiLogOut,
  FiBarChart2,
  FiUser
} from 'react-icons/fi';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome },
        { path: '/trades', label: 'Trades', icon: FiBriefcase },
        { path: '/modules', label: 'Modules', icon: FiBook },
        { path: '/trainees', label: 'Trainees', icon: FiUsers },
        { path: '/report', label: 'Report', icon: FiBarChart2 }
    ];

    const handleLogout = () => {
        logout();
    };

    const userName = user?.userName || user?.username || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <>
            {/* Mobile top bar – solid amber color (reduced gradient) */}
            <div className="fixed top-0 left-0 w-full bg-amber-800 text-white z-50 flex items-center justify-between px-4 py-3 shadow-xl md:hidden">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    {isSidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>

                <Link to="/dashboard" className="text-xl font-extrabold tracking-wide text-amber-200 hover:opacity-90 transition">
                    XWISDOM
                </Link>

                {user && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold shadow-md text-black">
                            {userInitial}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar overlay with blur (mobile) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar – desktop with solid dark colors (reduced gradient) */}
            <aside className={`
                fixed top-0 left-0 w-72 bg-gray-900
                text-amber-50 shadow-2xl transition-transform duration-300 ease-in-out z-50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                top-0
                h-screen
                overflow-y-auto
                hidden md:block
            `}>
                {/* Logo & Avatar area */}
                <div className="p-6 border-b border-amber-800/30 flex flex-col items-center">
                    <Link to="/dashboard" className="text-2xl font-black tracking-wider text-amber-400 hover:opacity-90 transition">
                        XWISDOM
                    </Link>
                    {user && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg text-black">
                                <FiUser size={20} />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-sm text-amber-100">{userName}</p>
                                <p className="text-xs text-orange-400/80">Trainee Manager</p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3">
                    <ul className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                            active 
                                                ? 'bg-amber-600 text-black shadow-lg' 
                                                : 'text-amber-100 hover:bg-amber-800/40 hover:text-amber-200'
                                        }`}
                                    >
                                        <Icon size={20} className={active ? 'text-black' : 'text-amber-400 group-hover:text-amber-200'} />
                                        <span>{item.label}</span>
                                        {active && <div className="absolute left-0 w-1 h-8 bg-amber-400 rounded-r-full shadow-sm" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-amber-800/30 mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-600/40 hover:text-white transition-all duration-200 group">
                        <FiLogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ========== MOBILE BOTTOM NAVIGATION BAR ========== */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-amber-800/30 shadow-lg z-50 md:hidden safe-bottom">
                <div className="flex justify-around items-center py-2 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                                    active 
                                        ? 'text-amber-400' 
                                        : 'text-gray-400 hover:text-amber-400'
                                }`}
                            >
                                <Icon size={22} className={active ? 'drop-shadow-sm' : ''} />
                                <span className="text-[11px] font-medium">{item.label}</span>
                                {active && (
                                    <div className="absolute -top-0.5 w-8 h-0.5 bg-amber-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Add bottom padding to body when bottom nav is visible (mobile only) */}
            <style jsx global>{`
                @media (max-width: 768px) {
                    body {
                        padding-bottom: 70px;
                    }
                }
                .safe-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 0);
                }
            `}</style>
        </>
    );
};

export default Navbar;