// App.js - HRMS with Professional Blue/Cyan Theme + Toaster
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";      // Changed from Trainees
import Positions from "./pages/Positions";      // Changed from Modules
import Reports from "./pages/Reports";          // Changed from Report
import Departments from "./pages/Departments";  // Changed from Trades

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from "./components/Navbar";

// Layout component that wraps all protected pages
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-blue-400 font-medium">Loading HRMS...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      <main className="md:ml-72 min-h-screen bg-black">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  );
};

// Optional: Role-based route protection
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

function App() {
  return (
    <AuthProvider>
      {/* Global Toaster – dark theme matching the HRMS app */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1f2937' },
            style: {
              color: '#10b981',
              border: '1px solid #10b981',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
            style: {
              color: '#ef4444',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate replace to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with sidebar layout */}
        <Route path="/dashboard" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        
        {/* Employee Management - Accessible to HR staff and above */}
        <Route path="/employees" element={
          <RoleBasedRoute allowedRoles={['admin', 'hr_manager', 'hr_staff']}>
            <Employees />
          </RoleBasedRoute>
        } />
        
        {/* Department Management - Accessible to HR managers and admin */}
        <Route path="/departments" element={
          <RoleBasedRoute allowedRoles={['admin', 'hr_manager']}>
            <Departments />
          </RoleBasedRoute>
        } />
        
        {/* Position Management - Accessible to HR managers and admin */}
        <Route path="/positions" element={
          <RoleBasedRoute allowedRoles={['admin', 'hr_manager']}>
            <Positions />
          </RoleBasedRoute>
        } />
        
               
        {/* Reports - Accessible to all authenticated users (view-only) */}
        <Route path="/reports" element={
          <ProtectedLayout><Reports /></ProtectedLayout>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;