import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await axios.get(`${API_BASE}/me`);
          setUser(response.data);
          setIsAdmin(response.data.role === 'ADMIN');
          setToken(savedToken);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        username,
        password
      });
      
      const { access_token, user_id, username: userName, role } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser({ id: user_id, username: userName, role });
      setIsAdmin(role === 'ADMIN');
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/register`, {
        username,
        password
      });
      
      const { access_token, user_id, username: userName, role, status } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser({ id: user_id, username: userName, role, status });
      setIsAdmin(role === 'ADMIN');
      
      return { success: true, status };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const checkUserStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/me`);
      setUser(response.data);
      setIsAdmin(response.data.role === 'ADMIN');
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    token,
    isAdmin,
    checkUserStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}