// Navbar.jsx - HRMS Navigation with Blue/Cyan Theme
import React, { useState } from 'react';
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
  FiShield
} from 'react-icons/fi';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome, color: 'blue' },
        { path: '/departments', label: 'Departments', icon: FiBriefcase, color: 'purple' },
        { path: '/positions', label: 'Positions', icon: FiAward, color: 'green' },
        { path: '/employees', label: 'Employees', icon: FiUsers, color: 'cyan' },
        { path: '/reports', label: 'Reports', icon: FiBarChart2, color: 'purple' }
    ];

    const handleLogout = () => {
        logout();
    };

    const userName = user?.userName || user?.username || 'User';
    const userRole = user?.role || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    // Role badge color mapping
    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'admin': return 'bg-red-900/50 text-red-300';
            case 'hr_manager': return 'bg-purple-900/50 text-purple-300';
            case 'hr_staff': return 'bg-blue-900/50 text-blue-300';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    return (
        <>
            {/* Mobile top bar */}
            <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-blue-800 to-cyan-800 text-white z-50 flex items-center justify-between px-4 py-3 shadow-xl md:hidden">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    {isSidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>

                <Link to="/dashboard" className="text-xl font-extrabold tracking-wide text-white hover:opacity-90 transition">
                    HRMS PORTAL
                </Link>

              // In Navbar.jsx, update the role display
{user && (
    <div className="mt-4 flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg text-white">
            <FiShield size={24} />
        </div>
        <div className="text-center">
            <p className="font-semibold text-sm text-gray-100">{userName}</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-red-900/50 text-red-300">
                ADMINISTRATOR
            </span>
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

            {/* Sidebar – desktop */}
            <aside className={`
                fixed top-0 left-0 w-72 bg-gray-900
                text-white shadow-2xl transition-transform duration-300 ease-in-out z-50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                top-0
                h-screen
                overflow-y-auto
                hidden md:block
            `}>
                {/* Logo & Avatar area */}
                <div className="p-6 border-b border-gray-800 flex flex-col items-center">
                    <Link to="/dashboard" className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition">
                        HRMS PORTAL
                    </Link>
                    {user && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg text-white">
                                <FiUser size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-gray-100">{userName}</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(userRole)}`}>
                                    {userRole.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3">
                    <ul className="space-y-1.5">
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
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                            active 
                                                ? colorClasses[item.color] + ' shadow-lg' 
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                                        <span>{item.label}</span>
                                        {active && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full shadow-sm" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-800 mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-600/40 hover:text-white transition-all duration-200 group">
                        <FiLogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile bottom navigation bar */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 shadow-lg z-50 md:hidden safe-bottom">
                <div className="flex justify-around items-center py-2 px-2">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 ${
                                    active 
                                        ? 'text-blue-400' 
                                        : 'text-gray-500 hover:text-blue-400'
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