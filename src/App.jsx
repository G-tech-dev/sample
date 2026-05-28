// App.js - Final version
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SpareParts from "./pages/SpareParts";
import Users from "./pages/Users";
import StockIn from "./pages/StockIn";
import StockOut from "./pages/StockOut";
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from "./components/Navbar";
import Report from "./pages/Report";
import Payment from "./pages/Payment";

// Layout component that wraps all protected pages
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      <main className="md:ml-64 min-h-screen bg-gray-100">
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
      <Routes>
        <Route path="/" element={<Navigate replace to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with sidebar layout */}
        <Route path="/dashboard" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/spareparts" element={
          <ProtectedLayout><SpareParts /></ProtectedLayout>
        } />
        <Route path="/users" element={
          <ProtectedLayout><Users /></ProtectedLayout>
        } />
        <Route path="/stockin" element={
          <ProtectedLayout><StockIn /></ProtectedLayout>
        } />
        <Route path="/stockout" element={
          <ProtectedLayout><StockOut /></ProtectedLayout>
        } />
        <Route path="/report" element={
        <ProtectedLayout><Report /></ProtectedLayout>
        }/>
        <Route path="payment" element={
          <ProtectedLayout><Payment /></ProtectedLayout>
        }/>
        
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;