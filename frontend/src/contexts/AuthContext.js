import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // Simples verificação se o token é válido
          const response = await fetch(`${API_BASE}/user/profile`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(savedToken);
            setIsAdmin(userData.role === 'ADMIN');
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    console.log('=== INÍCIO DO LOGIN ===');
    console.log('Usuário:', username);
    console.log('URL do backend:', API_BASE);
    
    try {
      console.log('Fazendo requisição para:', `${API_BASE}/login`);
      
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login bem-sucedido:', data);
        
        const { access_token, user_id, username: userName, role } = data;
        
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser({ id: user_id, username: userName, role });
        setIsAdmin(role === 'ADMIN');
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', response.status, errorData);
        return { 
          success: false, 
          error: errorData.detail || 'Usuário ou senha incorretos' 
        };
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      
      // Teste direto de conectividade
      try {
        console.log('Testando conectividade com:', `${API_BASE}/health`);
        const healthResponse = await fetch(`${API_BASE}/health`);
        if (healthResponse.ok) {
          console.log('Backend está acessível, mas login falhou');
          return { 
            success: false, 
            error: 'Erro no login. Tente novamente.' 
          };
        } else {
          console.log('Health check falhou:', healthResponse.status);
        }
      } catch (healthError) {
        console.error('Health check error:', healthError);
      }
      
      return { 
        success: false, 
        error: 'Não foi possível conectar ao servidor. Verifique sua conexão.' 
      };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.detail || 'Erro ao criar conta' 
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: 'Erro de conexão ao criar conta' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}