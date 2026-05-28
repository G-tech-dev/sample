// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { signin, signup, getCurrentUser, isLoggedIn } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in via localStorage
    if (isLoggedIn()) {
      setUser(getCurrentUser());
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await signin(username, password);
      // Store user data in localStorage
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('username', response.username);
      setUser({
        user_id: response.user_id,
        username: response.username
      });
      toast.success('Login successful');
      return true;
    } catch (error) {
      toast.error(error.error || 'Login failed');
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const response = await signup(username, password);
      toast.success('Registration successful');
      return true;
    } catch (error) {
      toast.error(error.error || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};