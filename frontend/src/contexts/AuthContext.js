import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { testConnection } from '../utils/connectionTest';

const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Debug logging
console.log('[AuthContext] Environment variables:');
console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
console.log('API_BASE:', API_BASE);

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
    // Configure axios instance with better settings
    axios.defaults.baseURL = API_BASE.replace('/api', '');
    axios.defaults.timeout = 10000; // 10 seconds timeout
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    // Add response interceptor for better error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[AuthContext] Axios error interceptor:', error);
        if (error.code === 'NETWORK_ERROR') {
          console.error('[AuthContext] Network error detected - connection failed');
        }
        return Promise.reject(error);
      }
    );
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
    console.log('[AuthContext] Starting login process...');
    console.log('[AuthContext] Username:', username);
    console.log('[AuthContext] Full API URL:', `${API_BASE}/login`);
    console.log('[AuthContext] Backend URL from env:', process.env.REACT_APP_BACKEND_URL);
    
    try {
      // First attempt with axios
      console.log('[AuthContext] Attempting login with axios...');
      const response = await axios.post(`${API_BASE}/login`, {
        username,
        password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('[AuthContext] Axios login response:', response.data);
      
      const { access_token, user_id, username: userName, role } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser({ id: user_id, username: userName, role });
      setIsAdmin(role === 'ADMIN');
      
      console.log('[AuthContext] Login successful, user set:', { id: user_id, username: userName, role });
      
      return { success: true };
    } catch (axiosError) {
      console.error('[AuthContext] Axios login failed:', axiosError);
      console.error('[AuthContext] Axios error code:', axiosError.code);
      console.error('[AuthContext] Axios error message:', axiosError.message);
      
      // If axios fails with network error, try with fetch as fallback
      if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
        console.log('[AuthContext] Axios failed, trying with fetch as fallback...');
        
        try {
          const fetchResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
          
          console.log('[AuthContext] Fetch response status:', fetchResponse.status);
          
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            console.log('[AuthContext] Fetch login response:', data);
            
            const { access_token, user_id, username: userName, role } = data;
            
            localStorage.setItem('token', access_token);
            setToken(access_token);
            setUser({ id: user_id, username: userName, role });
            setIsAdmin(role === 'ADMIN');
            
            console.log('[AuthContext] Fetch login successful, user set:', { id: user_id, username: userName, role });
            
            return { success: true };
          } else {
            const errorData = await fetchResponse.json();
            console.error('[AuthContext] Fetch login failed with status:', fetchResponse.status, errorData);
            return { 
              success: false, 
              error: errorData.detail || 'Usuário ou senha incorretos.' 
            };
          }
        } catch (fetchError) {
          console.error('[AuthContext] Both axios and fetch failed:', fetchError);
          return { 
            success: false, 
            error: 'Erro de conexão. Não foi possível conectar ao servidor.' 
          };
        }
      }
      
      // Handle other axios errors
      let errorMessage = 'Falha no login. Verifique suas credenciais.';
      
      if (axiosError.response?.status === 401) {
        errorMessage = 'Usuário ou senha incorretos.';
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'Conta não aprovada pelo administrador.';
      }
      
      return { 
        success: false, 
        error: axiosError.response?.data?.detail || errorMessage
      };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/register`, {
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
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
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
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}