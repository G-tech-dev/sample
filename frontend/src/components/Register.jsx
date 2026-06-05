import { useState } from "react";
import api from "../api";
import { User, Lock, Package } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  // ===================== STATE =====================
  const [form, setForm] = useState({
    user_name: "", // Changed from username to user_name
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===================== HANDLE REGISTER =====================
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", form);

      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.msg || "Something went wrong. Try again."
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
          <Package className="text-green-400 mx-auto mb-2" size={40} />
          <h2 className="text-white text-2xl font-bold">
            Create Account
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Stock Management System
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-500/20 text-red-300 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleRegister} className="space-y-4">

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

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition font-semibold"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* LOGIN LINK */}
        <p className="text-center text-gray-300 mt-4 text-sm">
          Already have an account?{" "}
          <Link className="text-blue-400 hover:underline" to="/">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}