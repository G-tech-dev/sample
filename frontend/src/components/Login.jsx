import { useState } from "react";
import api from "../api";
import { User, Lock, Package } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  // ===================== STATE =====================
  const [form, setForm] = useState({
    user_name: "", // Changed from username to user_name
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===================== HANDLE LOGIN =====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.msg || "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================== UI =====================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">

      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">

        {/* TITLE */}
        <div className="text-center mb-6">
          <Package className="text-blue-400 mx-auto mb-2" size={40} />
          <h2 className="text-white text-2xl font-bold">
            SMS Admin Login
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Stock Management System
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/20 text-red-300 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* USERNAME */}
          <div className="flex items-center bg-white/10 rounded-lg px-3">
            <User className="text-white" size={18} />
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 bg-transparent text-white outline-none"
              value={form.user_name}
              onChange={(e) =>
                setForm({ ...form, user_name: e.target.value })
              }
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center bg-white/10 rounded-lg px-3">
            <Lock className="text-white" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 bg-transparent text-white outline-none"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-gray-300 mt-4 text-sm">
          Don’t have an account?{" "}
          <Link className="text-green-400 hover:underline" to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}