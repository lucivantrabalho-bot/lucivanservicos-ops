import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export default function Login() {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(loginData.username, loginData.password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (registerData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register(registerData.username, registerData.password);
      if (!result.success) {
        setError(result.error);
      } else {
        // Redirect based on status
        if (result.status === 'PENDING') {
          navigate('/pending-approval');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2M12 4.5L19.5 8.5V10C19.5 15 16.5 18.5 12 20C7.5 18.5 4.5 15 4.5 10V8.5L12 4.5M7 14L9 16L17 8L15.59 6.59L9 13.17L8.41 12.59L7 14Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciador CN19</h1>
          <p className="text-slate-600">Sistema de Gerenciamento de informações do CN19</p>
        </div>

        <Card className="glass shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-slate-800">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-slate-600">
              Faça login ou crie sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm font-medium">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-sm font-medium text-slate-700">
                      Usuário
                    </Label>
                    <Input
                      id="login-username"
                      data-testid="login-username-input"
                      type="text"
                      placeholder="Digite seu usuário"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                      Senha
                    </Label>
                    <Input
                      id="login-password"
                      data-testid="login-password-input"
                      type="password"
                      placeholder="Digite sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="login-submit-btn"
                    className="w-full btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm font-medium text-slate-700">
                      Usuário
                    </Label>
                    <Input
                      id="register-username"
                      data-testid="register-username-input"
                      type="text"
                      placeholder="Escolha um nome de usuário"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">
                      Senha
                    </Label>
                    <Input
                      id="register-password"
                      data-testid="register-password-input"
                      type="password"
                      placeholder="Crie uma senha"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-sm font-medium text-slate-700">
                      Confirmar Senha
                    </Label>
                    <Input
                      id="register-confirm"
                      data-testid="register-confirm-password-input"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="register-submit-btn"
                    className="w-full btn-hover bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}