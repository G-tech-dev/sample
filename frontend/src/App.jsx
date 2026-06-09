import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";

import Dashboard from "./components/Dashboard";
import Items from "./components/Items";
import Sales from "./components/Sales";
import StockSummary from "./components/StockSummary";
import DailyReport from "./components/DailyReport";

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
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 overflow-y-auto p-6 text-white">
        {active === "dashboard" && <Dashboard />}
        {active === "items" && <Items />}
        {active === "sales" && <Sales />}
        {active === "summary" && <StockSummary />}
        {active === "reports" && <DailyReport />}
      </div>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}