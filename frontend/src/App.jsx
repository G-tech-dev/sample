// App.js - Final version with Black & Amber Theme + Toaster
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Module";      // if your file is Module.jsx and exports default Modules
import Trainees from "./pages/Trainees";
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from "./components/Navbar";
import Report from "./pages/Report";
import Trades from "./pages/Trade";

// Layout component that wraps all protected pages
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="text-amber-400 font-medium">Loading...</p>
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

function App() {
  return (
    <AuthProvider>
      {/* Global Toaster – dark theme matching the app */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1f2937' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate replace to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with sidebar layout */}
        <Route path="/dashboard" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/trainees" element={
          <ProtectedLayout><Trainees /></ProtectedLayout>
        } />
        <Route path="/modules" element={
          <ProtectedLayout><Modules /></ProtectedLayout>
        } />
        <Route path="/report" element={
          <ProtectedLayout><Report /></ProtectedLayout>
        } />
        <Route path="/trades" element={
          <ProtectedLayout><Trades /></ProtectedLayout>
        } />
        
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;