import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  BarChart3, 
  FileText,
  LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "stockin", label: "Stock In", icon: Package },
    { id: "stockout", label: "Stock Out", icon: ArrowRightLeft },
    { id: "summary", label: "Stock Summary", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col">
      
      {/* LOGO */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={28} />
          <div>
            <h1 className="text-xl font-bold">SMS</h1>
            <p className="text-xs text-gray-400">Stock Management</p>
          </div>
        </div>
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                active === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-slate-700"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-700 transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}