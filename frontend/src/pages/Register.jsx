import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' });
    const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const validateField = (name, value) => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
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
        if (name === 'confirmPassword') {
            if (!value) return 'Please confirm your password';
            if (value !== formData.password) return 'Passwords do not match';
            return '';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear field error on typing
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
        // Also clear API message if any
        if (apiMessage.text) setApiMessage({ type: '', text: '' });
    };

    const validateForm = () => {
        const usernameError = validateField('username', formData.username);
        const passwordError = validateField('password', formData.password);
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        setErrors({ username: usernameError, password: passwordError, confirmPassword: confirmError });
        return !usernameError && !passwordError && !confirmError;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiMessage({ type: '', text: '' });
        
        if (!validateForm()) return;

        const trimmedUsername = formData.username.trim();
        const trimmedPassword = formData.password.trim();

        setLoading(true);
        try {
            const success = await register(trimmedUsername, trimmedPassword);
            if (success) {
                setApiMessage({ type: 'success', text: 'Registration successful! Redirecting to login...' });
                setFormData({ username: '', password: '', confirmPassword: '' });
                setErrors({ username: '', password: '', confirmPassword: '' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setApiMessage({ type: 'error', text: 'Registration failed. Username may already exist.' });
            }
        } catch (err) {
            setApiMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Registration failed' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-600"></div>
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold text-amber-400">XWISDOM</h1>
                            <p className="text-gray-400 text-sm mt-2">Create your account</p>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">Register</h2>
                        
                        {apiMessage.text && (
                            <div className={`mb-5 p-3 rounded-xl text-sm flex items-center gap-2 ${
                                apiMessage.type === 'success' 
                                    ? 'bg-green-900/30 border border-green-800 text-green-300' 
                                    : 'bg-red-900/30 border border-red-800 text-red-300'
                            }`}>
                                {apiMessage.type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                                {apiMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-500" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                                            errors.username ? 'border-red-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Choose a username"
                                    />
                                </div>
                                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-500" size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                                            errors.password ? 'border-red-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Create a password"
                                    />
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-500" size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 border ${
                                            errors.confirmPassword ? 'border-red-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Confirm your password"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                        Registering...
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </button>

                            <p className="text-center text-gray-400 text-sm mt-4">
                                Already have an account?{' '}
                                <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                                    Login here
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Join XWISDOM – start your training journey
                </p>
            </div>
        </div>
    );
};

export default Register;