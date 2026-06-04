// context/AuthContext.js - Updated for admin-only system
import React, { createContext, useState, useContext, useEffect } from 'react';
import { signin, signup, logout, isLoggedIn, getCurrentUser } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        const currentUser = getCurrentUser();
        setUser({
          user_id: currentUser.user_id,
          userName: currentUser.userName,
          role: 'admin', // Force admin role
          employee_id: currentUser.employee_id
        });
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await signin(username, password);
      setUser({
        user_id: response.user.id,
        userName: response.user.userName,
        role: 'admin',
        employee_id: response.user.employee?._id || null
      });
      toast.success(`Welcome Admin, ${response.user.userName}!`);
      return true;
    } catch (error) {
      toast.error(error.error || 'Login failed');
      return false;
    }
  };

  const register = async (username, password, employee_id = null) => {
    try {
      // Removed role parameter - backend will set as admin
      await signup(username, password, employee_id);
      toast.success('Admin account created successfully! You can now login.');
      return true;
    } catch (error) {
      toast.error(error.error || 'Registration failed');
      return false;
    }
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  // All users are admin, so these always return true
  const hasRole = (allowedRoles) => {
    return true; // Everyone is admin
  };

  const isAdmin = () => {
    return true; // Everyone is admin
  };

  const canManageEmployees = () => {
    return true; // Everyone can manage employees
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout: logoutUser, 
      loading,
      hasRole,
      isAdmin,
      canManageEmployees
    }}>
      {children}
    </AuthContext.Provider>
  );
};