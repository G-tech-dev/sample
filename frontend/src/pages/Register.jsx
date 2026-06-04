// Register.jsx - Improved error handling and username availability check
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiCheckCircle, FiAlertCircle, FiBriefcase, FiShield, FiCheck } from 'react-icons/fi';
import { api } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' });
    const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const navigate = useNavigate();
    const { register } = useAuth();

    const validateField = (name, value) => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
        if (name === 'username') {
            if (!trimmed) return 'Username is required';
            if (trimmed.length < 3) return 'Username must be at least 3 characters';
            if (trimmed.length > 20) return 'Username cannot exceed 20 characters';
            if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Username can only contain letters, numbers, and underscores';
            return '';
        }
        if (name === 'password') {
            if (!value) return 'Password is required';
            if (value.length < 6) return 'Password must be at least 6 characters';
            if (value.length > 50) return 'Password cannot exceed 50 characters';
            if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
                return 'Password must contain at least one letter and one number';
            }
            return '';
        }
        if (name === 'confirmPassword') {
            if (!value) return 'Please confirm your password';
            if (value !== formData.password) return 'Passwords do not match';
            return '';
        }
        return '';
    };

    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }
        
        setCheckingUsername(true);
        try {
            const response = await api.get(`/check-username/${username}`);
            setUsernameAvailable(response.data.available);
            if (!response.data.available) {
                setErrors(prev => ({ ...prev, username: 'Username already taken. Please choose another.' }));
            } else {
                setErrors(prev => ({ ...prev, username: '' }));
            }
        } catch (err) {
            console.error('Username check failed:', err);
            setUsernameAvailable(null);
        } finally {
            setCheckingUsername(false);
        }
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        const fieldError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
        
        if (apiMessage.text) setApiMessage({ type: '', text: '' });
        
        // Check username availability in real-time
        if (name === 'username' && value && !fieldError) {
            // Debounce username check
            const timeoutId = setTimeout(() => {
                checkUsernameAvailability(value.trim());
            }, 500);
            return () => clearTimeout(timeoutId);
        } else if (name === 'username') {
            setUsernameAvailable(null);
        }
    };

    const validateForm = () => {
        const usernameError = validateField('username', formData.username);
        const passwordError = validateField('password', formData.password);
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        
        setErrors({ 
            username: usernameError, 
            password: passwordError, 
            confirmPassword: confirmError 
        });
        
        return !usernameError && !passwordError && !confirmError && usernameAvailable === true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiMessage({ type: '', text: '' });
        
        if (!validateForm()) {
            if (usernameAvailable === false) {
                setApiMessage({ 
                    type: 'error', 
                    text: 'Username is already taken. Please choose a different username.' 
                });
            } else {
                setApiMessage({ 
                    type: 'error', 
                    text: 'Please fix the errors before submitting.' 
                });
            }
            return;
        }

        const trimmedUsername = formData.username.trim();
        const trimmedPassword = formData.password.trim();

        setLoading(true);
        try {
            const success = await register(trimmedUsername, trimmedPassword);
            if (success) {
                setApiMessage({ 
                    type: 'success', 
                    text: 'Admin account created successfully! Redirecting to login...' 
                });
                setFormData({ username: '', password: '', confirmPassword: '' });
                setErrors({ username: '', password: '', confirmPassword: '' });
                setUsernameAvailable(null);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setApiMessage({ 
                    type: 'error', 
                    text: 'Registration failed. The username may already exist or there was a server error.' 
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
                if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
                    errorMessage = 'Username already exists. Please choose a different username.';
                }
            }
            
            setApiMessage({ 
                type: 'error', 
                text: errorMessage 
            });
        } finally {
            setLoading(false);
        }
    };

    // Clear username availability status when username field is empty
    const handleUsernameBlur = () => {
        if (!formData.username) {
            setUsernameAvailable(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 mb-3">
                                <FiShield className="text-blue-400" size={28} />
                            </div>
                            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                HRMS PORTAL
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">Create Administrator Account</p>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">
                            Register as Administrator
                        </h2>
                        
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

                        <div className="mb-5 p-3 rounded-xl bg-blue-900/30 border border-blue-800 text-blue-300 text-sm flex items-center gap-2">
                            <FiShield size={16} />
                            All registered users automatically receive Administrator privileges
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Username *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-500" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onBlur={handleUsernameBlur}
                                        className={`w-full pl-10 pr-12 py-2.5 bg-gray-900 border ${
                                            errors.username ? 'border-red-600' : 
                                            usernameAvailable === true ? 'border-green-600' : 'border-gray-700'
                                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Choose a username (letters, numbers, underscores)"
                                        disabled={loading}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {checkingUsername && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        )}
                                        {usernameAvailable === true && !checkingUsername && (
                                            <FiCheck className="text-green-500" size={18} />
                                        )}
                                        {usernameAvailable === false && !checkingUsername && (
                                            <FiAlertCircle className="text-red-500" size={18} />
                                        )}
                                    </div>
                                </div>
                                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                                {usernameAvailable === true && !errors.username && (
                                    <p className="text-green-400 text-xs mt-1">Username is available</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Password *</label>
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
                                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Create a password (min 6 chars, 1 letter & 1 number)"
                                        disabled={loading}
                                    />
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                                {formData.password && !errors.password && (
                                    <p className="text-green-400 text-xs mt-1">Password strength: Strong ✓</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Confirm Password *</label>
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
                                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-200 placeholder-gray-500`}
                                        placeholder="Confirm your password"
                                        disabled={loading}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                                {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                                    <p className="text-green-400 text-xs mt-1">Passwords match ✓</p>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || usernameAvailable === false || checkingUsername} 
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Creating Admin Account...
                                    </>
                                ) : (
                                    'Create Admin Account'
                                )}
                            </button>

                            <p className="text-center text-gray-400 text-sm mt-4">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                                    Login to HRMS
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-500 text-xs">
                        First time user? Create your administrator account to access all HRMS features.
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                        Password requirements: Minimum 6 characters, at least one letter and one number
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;