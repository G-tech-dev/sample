import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";

import Dashboard from "./components/Dashboard";
import StockIn from "./components/StockIn";
import StockOut from "./components/StockOut";
import StockSummary from "./components/StockSummary";
import Report from "./components/Report";

// ===================== PROTECTED WRAPPER =====================
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  if (!user) return <Navigate to="/" />;
  return children;
}

// ===================== DASHBOARD LAYOUT =====================
function DashboardLayout() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="flex h-screen bg-slate-900">

      {/* SIDEBAR (ALWAYS VISIBLE) */}
      <Sidebar active={active} setActive={setActive} />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 text-white">

        {active === "dashboard" && <Dashboard />}

        {active === "stockin" && <StockIn />}

        {active === "stockout" && <StockOut />}

        {active === "summary" && <StockSummary />}

        {active === "reports" && <Report />}

      </div>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED DASHBOARD (WITH SIDEBAR ALWAYS ON) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />

        {/* REDIRECT ALL UNKNOWN ROUTES */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}