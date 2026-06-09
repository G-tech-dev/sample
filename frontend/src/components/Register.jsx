import { useState } from "react";
import api from "../api";
import { User, Lock, ShoppingCart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  // ===================== STATE =====================
  const [form, setForm] = useState({
    UserName: "", // Updated to match backend schema (UpperCase)
    Password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===================== HANDLE REGISTER =====================
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (form.UserName.length < 3) {
      setError("Username must be at least 3 characters long");
      setLoading(false);
      return;
    }

    if (form.Password.length < 4) {
      setError("Password must be at least 4 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        UserName: form.UserName,
        Password: form.Password
      });

      alert("Account created successfully! Please login.");
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
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
          <ShoppingCart className="text-blue-400 mx-auto mb-2" size={40} />
          <h2 className="text-white text-2xl font-bold">
            Create Account
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Sales Records Management System
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm text-center border border-red-500/30">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* USERNAME */}
          <div className="flex items-center bg-white/10 rounded-lg px-3 focus-within:bg-white/20 transition">
            <User className="text-white" size={18} />
            <input
              type="text"
              placeholder="Username (min. 3 characters)"
              className="w-full p-3 bg-transparent text-white outline-none"
              value={form.UserName}
              onChange={(e) =>
                setForm({ ...form, UserName: e.target.value })
              }
              required
              minLength="3"
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center bg-white/10 rounded-lg px-3 focus-within:bg-white/20 transition">
            <Lock className="text-white" size={18} />
            <input
              type="password"
              placeholder="Password (min. 4 characters)"
              className="w-full p-3 bg-transparent text-white outline-none"
              value={form.Password}
              onChange={(e) =>
                setForm({ ...form, Password: e.target.value })
              }
              required
              minLength="4"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* LOGIN LINK */}
        <p className="text-center text-gray-300 mt-4 text-sm">
          Already have an account?{" "}
          <Link className="text-blue-400 hover:text-blue-300 hover:underline transition" to="/">
            Login here
          </Link>
        </p>

        {/* INFO NOTE */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-xs text-center">
            Demo credentials: Username: admin, Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
}