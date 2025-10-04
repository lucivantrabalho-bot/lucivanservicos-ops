import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Trophy,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para mudança de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/stats`);
      setUserStats(response.data);
    } catch (err) {
      console.error('Error loading user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Nova senha e confirmação não coincidem');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setError('Nova senha deve ter pelo menos 4 caracteres');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.put(`${API_BASE}/user/change-password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      setSuccess('Senha alterada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao alterar senha');
      setTimeout(() => setError(''), 3000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
                <p className="text-sm text-slate-600">Gerenciar conta e ver estatísticas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="password">Alterar Senha</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Informações do Usuário */}
          <TabsContent value="info" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Informações da Conta
                </CardTitle>
                <CardDescription>
                  Dados básicos da sua conta no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome de usuário</Label>
                    <div className="mt-1 p-3 bg-slate-50 rounded-md border">
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <Label>Função</Label>
                    <div className="mt-1 p-3 bg-slate-50 rounded-md border">
                      {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alterar Senha */}
          <TabsContent value="password" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-red-500" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura alterando sua senha regularmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Digite sua nova senha (min. 4 caracteres)"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Digite novamente a nova senha"
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={passwordLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estatísticas */}
          <TabsContent value="stats" className="space-y-6">
            {loading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Carregando estatísticas...</p>
                </CardContent>
              </Card>
            ) : userStats ? (
              <div className="space-y-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                      Estatísticas de {userStats.month} {userStats.year}
                    </CardTitle>
                    <CardDescription>
                      Resumo das suas atividades no mês atual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Criadas</p>
                            <p className="text-2xl font-bold text-blue-900">{userStats.created_count}</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-700">Finalizadas</p>
                            <p className="text-2xl font-bold text-emerald-900">{userStats.finished_count}</p>
                          </div>
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Criadas Aprovadas</p>
                            <p className="text-2xl font-bold text-yellow-900">{userStats.approved_created_count}</p>
                          </div>
                          <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Finalizadas Aprovadas</p>
                            <p className="text-2xl font-bold text-purple-900">{userStats.approved_finished_count}</p>
                          </div>
                          <Trophy className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Resumo do Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">Taxa de Aprovação (Criadas)</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {userStats.created_count > 0 
                            ? Math.round((userStats.approved_created_count / userStats.created_count) * 100)
                            : 0}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">Taxa de Aprovação (Finalizadas)</span>
                        <span className="text-lg font-bold text-purple-600">
                          {userStats.finished_count > 0 
                            ? Math.round((userStats.approved_finished_count / userStats.finished_count) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma estatística disponível</h3>
                  <p className="text-slate-600">Comece criando ou finalizando pendências para ver suas estatísticas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}