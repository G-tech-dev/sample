// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { signin, signup, logout, isLoggedIn, getCurrentUser } from '../services/api'; // adjust path
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn(); // calls /api/me, updates localStorage
      if (loggedIn) {
        setUser(getCurrentUser()); // reads from localStorage (set by isLoggedIn)
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await signin(username, password);
      // signin already stores user info in localStorage (see api.js)
      setUser({
        user_id: response.user.id,
        userName: response.user.userName,
        role: response.user.role
      });
      toast.success('Login successful');
      return true;
    } catch (error) {
      toast.error(error.error || 'Login failed');
      return false;
    }
  };

  const register = async (username, password, role = 'viewer') => {
    try {
      await signup(username, password, role);
      toast.success('Registration successful');
      return true;
    } catch (error) {
      toast.error(error.error || 'Registration failed');
      return false;
    }
  };

  const logoutUser = async () => {
    await logout(); // calls backend /api/logout and clears localStorage
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout: logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};