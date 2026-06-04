// Navbar.jsx - HRMS Navigation with Blue/Cyan Theme (Fully Responsive)
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiBriefcase,
  FiAward, 
  FiUsers, 
  FiMenu,
  FiX,
  FiLogOut,
  FiBarChart2,
  FiUser,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiShield,
  FiChevronLeft
} from 'react-icons/fi';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome, color: 'blue' },
        { path: '/departments', label: 'Departments', icon: FiBriefcase, color: 'purple' },
        { path: '/positions', label: 'Positions', icon: FiAward, color: 'green' },
        { path: '/employees', label: 'Employees', icon: FiUsers, color: 'cyan' },
        { path: '/attendance', label: 'Attendance', icon: FiCalendar, color: 'blue' },
        { path: '/leaves', label: 'Leaves', icon: FiFileText, color: 'yellow' },
        { path: '/payroll', label: 'Payroll', icon: FiDollarSign, color: 'green' },
        { path: '/reports', label: 'Reports', icon: FiBarChart2, color: 'purple' }
    ];

    const handleLogout = () => {
        logout();
        if (isMobile) setIsSidebarOpen(false);
    };

    const userName = user?.userName || user?.username || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    // Close sidebar when clicking a link on mobile
    const handleLinkClick = () => {
        if (isMobile) setIsSidebarOpen(false);
    };

    return (
        <>
            {/* Mobile top bar */}
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-800 to-cyan-800 text-white z-50 flex items-center justify-between px-4 py-3 shadow-xl md:hidden">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none"
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>

                <Link to="/dashboard" className="text-lg font-extrabold tracking-wide text-white hover:opacity-90 transition">
                    HRMS PORTAL
                </Link>

                {user && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-sm font-bold shadow-md text-white">
                        {userInitial}
                    </div>
                )}
            </div>

            {/* Sidebar overlay with blur (mobile) */}
            {isSidebarOpen && isMobile && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar – Desktop & Mobile */}
            <aside className={`
                fixed top-0 bottom-0 left-0 w-72 bg-gray-900
                text-white shadow-2xl transition-transform duration-300 ease-in-out z-50
                flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                ${isMobile ? 'top-0' : 'top-0'}
                h-full
                overflow-y-auto
            `}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <Link to="/dashboard" onClick={handleLinkClick} className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition">
                            HRMS
                        </Link>
                        {isMobile && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1 rounded-lg hover:bg-gray-800 transition md:hidden"
                                aria-label="Close sidebar"
                            >
                                <FiChevronLeft size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* User Profile Section */}
                {user && (
                    <div className="p-4 border-b border-gray-800">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg text-white">
                                <FiShield size={28} />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-gray-100">{userName}</p>
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-red-900/50 text-red-300">
                                    ADMINISTRATOR
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            const colorClasses = {
                                blue: 'bg-blue-600 text-white',
                                cyan: 'bg-cyan-600 text-white',
                                purple: 'bg-purple-600 text-white',
                                green: 'bg-green-600 text-white',
                                yellow: 'bg-yellow-600 text-white'
                            };
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={handleLinkClick}
                                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                            active 
                                                ? colorClasses[item.color] + ' shadow-lg' 
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon size={20} className={`transition-colors ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="text-sm">{item.label}</span>
                                        {active && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-sm" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-800">
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-600/40 hover:text-white transition-all duration-200 group"
                    >
                        <FiLogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content offset for desktop */}
            <div className="hidden md:block md:ml-72" />

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 shadow-lg z-40 md:hidden safe-bottom">
                <div className="flex justify-around items-center py-2 px-2">
                    {/* Show first 4 items on bottom nav for better spacing */}
                    {navItems.slice(0, 4).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                                    active 
                                        ? 'text-blue-400 bg-blue-950/50' 
                                        : 'text-gray-500 hover:text-blue-400 hover:bg-gray-800'
                                }`}
                            >
                                <Icon size={20} className={active ? 'drop-shadow-sm' : ''} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {active && (
                                    <div className="absolute -top-0.5 w-6 h-0.5 bg-blue-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                    {/* Menu button to open full sidebar */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-all duration-200"
                    >
                        <FiMenu size={20} />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </div>

            {/* Global styles for responsive adjustments */}
            <style jsx global>{`
                /* Prevent body scroll when sidebar is open on mobile */
                body.sidebar-open {
                    overflow: hidden;
                }
                
                /* Mobile adjustments */
                @media (max-width: 768px) {
                    body {
                        padding-bottom: 65px;
                    }
                    
                    /* Better touch targets on mobile */
                    button, 
                    a {
                        min-height: 44px;
                    }
                }
                
                /* Desktop adjustments */
                @media (min-width: 769px) {
                    body {
                        padding-bottom: 0;
                    }
                }
                
                /* Safe area for notched phones */
                .safe-bottom {
                    padding-bottom: max(env(safe-area-inset-bottom, 0), 8px);
                }
                
                /* Custom scrollbar for sidebar */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #1f2937;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #3b82f6;
                    border-radius: 3px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #60a5fa;
                }
            `}</style>
        </>
    );
};

export default Navbar;