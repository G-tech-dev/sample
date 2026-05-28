import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiPackage, 
  FiLogIn, 
  FiLogOut, 
  FiUsers,
  FiMenu,
  FiX,
  FiFile,
  FiFilePlus,
  FiDollarSign
  
} from 'react-icons/fi';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome },
        { path: '/spareparts', label: 'Stock', icon: FiPackage },
        { path: '/stockin', label: 'Stock In', icon: FiLogIn },
        { path: '/stockout', label: 'Stock Out', icon: FiLogOut },
        { path: '/payment', label: 'Payment', icon: FiDollarSign },
        { path: '/report', label: 'Report', icon: FiFilePlus },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Responsive Top Bar - Mobile Only */}
            <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white z-[60] flex items-center justify-between px-4 py-3 shadow-lg md:hidden">
                {/* Menu Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-md hover:bg-blue-700 transition-colors"
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                {/* Brand Logo */}
                <Link 
                    to="/dashboard" 
                    className="text-xl font-bold tracking-wider hover:text-blue-200 transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    SPARE PART
                </Link>

                {/* User Greeting (Optional) */}
                {user && (
                    <div className="text-sm font-medium truncate max-w-[120px]">
                        Hi, {user.username}
                    </div>
                )}
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900 
                text-white shadow-xl transition-transform duration-300 ease-in-out z-50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                top-16 md:top-0
                h-[calc(100vh-4rem)] md:h-screen
                overflow-y-auto
            `}>
                {/* Logo/Brand Area - Hidden on mobile (already in top bar) but kept for desktop */}
                <div className="p-6 border-b border-blue-700 hidden md:block">
                    <Link 
                        to="/dashboard" 
                        className="text-2xl font-bold tracking-wider hover:text-blue-200 transition-colors"
                    >
                        SPARE PART
                    </Link>
                    {user && (
                        <p className="text-xs text-blue-200 mt-2">
                            Welcome, {user.username}
                        </p>
                    )}
                </div>

                {/* Mobile Logo Area (visible only on mobile when sidebar open) */}
                <div className="p-6 border-b border-blue-700 md:hidden">
                    <Link 
                        to="/dashboard" 
                        className="text-2xl font-bold tracking-wider hover:text-blue-200 transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        SPARE PART
                    </Link>
                    {user && (
                        <p className="text-xs text-blue-200 mt-2">
                            Welcome, {user.username}
                        </p>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-6 py-3 mx-2 rounded-lg
                                            transition-all duration-200
                                            ${isActive(item.path) 
                                                ? 'bg-blue-700 text-white shadow-md' 
                                                : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                                            }
                                        `}
                                    >
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-blue-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-200 
                                 hover:bg-red-600 hover:text-white transition-all duration-200"
                    >
                        <FiLogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Navbar;