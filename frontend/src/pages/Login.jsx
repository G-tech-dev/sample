import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({ username: '', password: '' });
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const validateField = (name, value) => {
        const trimmed = value.trim();
        if (name === 'username') {
            if (!trimmed) return 'Username is required';
            if (trimmed.length < 3) return 'Username must be at least 3 characters';
            return '';
        }
        if (name === 'password') {
            if (!value) return 'Password is required';
            if (value.length < 4) return 'Password must be at least 4 characters';
            return '';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear field error when user types
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
        // Also clear global API error if any
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        const usernameError = validateField('username', formData.username);
        const passwordError = validateField('password', formData.password);
        setErrors({ username: usernameError, password: passwordError });
        return !usernameError && !passwordError;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            const trimmedUsername = formData.username.trim();
            const success = await login(trimmedUsername, formData.password);
            if (success) {
                if (rememberMe) {
                    localStorage.setItem('rememberUsername', trimmedUsername);
                } else {
                    localStorage.removeItem('rememberUsername');
                }
                navigate('/dashboard');
            } else {
                setApiError('Invalid username or password');
            }
        } catch (err) {
            setApiError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load remembered username on mount
    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberUsername');
        if (savedUsername) {
            setFormData(prev => ({ ...prev, username: savedUsername }));
            setRememberMe(true);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md animate-fadeIn">
                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.01] border border-gray-700">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-600"></div>
                    
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-900/30 mb-3">
                                <FiLogIn className="text-amber-400" size={28} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-amber-400">XWISDOM</h1>
                            <p className="text-gray-400 text-sm mt-2">Training Management System</p>
                        </div>

                        {apiError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-500 group-focus-within:text-amber-400 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                                            errors.username ? 'border-red-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Enter your username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-red-400 text-xs mt-1">{errors.username}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-500 group-focus-within:text-amber-400 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-12 py-2.5 bg-gray-900 border ${
                                            errors.password ? 'border-red-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-gray-600 bg-gray-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                                    />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="text-sm text-amber-400 hover:text-amber-300 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <FiLogIn size={18} />
                                        Login
                                    </>
                                )}
                            </button>                   

                            <p className="text-center text-gray-400 text-sm mt-4">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                                    Register here
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Secure access for authorised personnel only
                </p>
            </div>
        </div>
    );
};

export default Login;