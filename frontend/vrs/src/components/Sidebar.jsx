import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ active, setActive }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // ===================== LOGOUT =====================
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }

    localStorage.removeItem("user");
    navigate("/");
  };

  // ===================== MENU =====================
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { name: "Customers", icon: Users, key: "customers" },
    { name: "Vehicles", icon: Car, key: "vehicles" },
    { name: "Reservations", icon: ClipboardList, key: "reservations" },
    { name: "Reports", icon: FileText, key: "reports" },
  ];

  // ===================== UI =====================
  return (
    <>
      {/* Mobile menu button (visible on small screens) */}
      {!open && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </button>
      )}

      {/* Sidebar: overlay on small screens when open, persistent on md+ */}
      <div
        className={`h-screen bg-slate-800 text-white flex flex-col transition-all duration-300 ${
          open ? "fixed inset-y-0 left-0 w-64 z-40" : "hidden"
        } md:static md:block md:w-64`}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className={`font-bold text-lg tracking-wide ${open ? "block" : "hidden"} md:block`}>
            VRS ADMIN
          </h1>

          <button className="p-1 md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X />
          </button>

          <button className="hidden md:block" onClick={() => setOpen((s) => !s)} aria-label="Toggle sidebar">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {/* MENU ITEMS */}
        <div className="flex-1 mt-4 overflow-auto">
          {menu.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                setActive(item.key);
                if (window.innerWidth < 768) setOpen(false);
              }}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700 transition ${
                active === item.key ? "bg-slate-700" : ""
              }`}
            >
              <item.icon size={20} />
              <span className={`${open ? "block" : "hidden"} md:block`}>{item.name}</span>
            </div>
          ))}
        </div>

        {/* LOGOUT */}
        <div
          onClick={() => {
            handleLogout();
            if (window.innerWidth < 768) setOpen(false);
          }}
          className="flex items-center gap-3 p-3 m-3 bg-red-600 hover:bg-red-700 rounded cursor-pointer"
        >
          <LogOut size={20} />
          <span className={`${open ? "block" : "hidden"} md:block`}>Logout</span>
        </div>
      </div>
    </>
  );
}