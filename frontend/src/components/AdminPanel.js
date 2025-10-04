import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  AlertTriangle,
  Clock,
  Eye,
  UserCheck,
  UserX,
  Trophy,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Save,
  Upload,
  MapPin,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AdminPanel() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPendencias, setAllPendencias] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [resetPasswordModal, setResetPasswordModal] = useState({
    isOpen: false,
    user: null
  });
  const [deleteUserModal, setDeleteUserModal] = useState({
    isOpen: false,
    user: null
  });
  
  // Estados para configuração do formulário
  const [formConfig, setFormConfig] = useState({
    energia_options: [],
    arcon_options: []
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [newEnergiaItem, setNewEnergiaItem] = useState('');
  const [newArconItem, setNewArconItem] = useState('');

  // Estados para KML
  const [kmlLocations, setKmlLocations] = useState([]);
  const [kmlUploading, setKmlUploading] = useState(false);
  const [kmlFile, setKmlFile] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadPendingUsers();
      loadAllUsers();
      loadAllPendencias();
      loadMonthlyStats();
      loadFormConfig();
      loadKmlLocations();
    }
  }, [isAdmin]);

  const loadPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/pending-users`);
      setPendingUsers(response.data);
    } catch (err) {
      console.error('Error loading pending users:', err);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/all-users`);
      setAllUsers(response.data);
    } catch (err) {
      console.error('Error loading all users:', err);
    }
  };

  const loadAllPendencias = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/pendencias`);
      setAllPendencias(response.data);
    } catch (err) {
      console.error('Error loading pendencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats/monthly`);
      setMonthlyStats(response.data);
    } catch (err) {
      console.error('Error loading monthly stats:', err);
    }
  };

  const handleUserApproval = async (userId, status) => {
    try {
      await axios.put(`${API_BASE}/admin/approve-user/${userId}`, { status });
      setSuccess(`Usuário ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      loadPendingUsers();
    } catch (err) {
      setError('Erro ao processar aprovação');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePendenciaValidation = async (pendenciaId, status, notes = '') => {
    try {
      await axios.put(`${API_BASE}/admin/validate-pendencia/${pendenciaId}`, {
        status,
        validation_notes: notes
      });
      setSuccess(`Pendência ${status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      loadAllPendencias();
    } catch (err) {
      setError('Erro ao validar pendência');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE}/admin/delete-user/${userId}`);
      setSuccess('Usuário excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setDeleteUserModal({ isOpen: false, user: null });
      loadAllUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao excluir usuário');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      await axios.put(`${API_BASE}/admin/reset-password/${userId}`, {
        new_password: newPassword
      });
      setSuccess('Senha resetada com sucesso! O usuário deve usar a nova senha no próximo login.');
      setTimeout(() => setSuccess(''), 5000);
      setResetPasswordModal({ isOpen: false, user: null });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao resetar senha');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Funções para configuração do formulário
  const loadFormConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/form-config`);
      setFormConfig(response.data);
    } catch (err) {
      console.error('Error loading form config:', err);
      setError('Erro ao carregar configuração do formulário');
    }
  };

  const handleAddEnergiaItem = () => {
    if (newEnergiaItem.trim() && !formConfig.energia_options.includes(newEnergiaItem.trim())) {
      setFormConfig(prev => ({
        ...prev,
        energia_options: [...prev.energia_options, newEnergiaItem.trim()]
      }));
      setNewEnergiaItem('');
    }
  };

  const handleRemoveEnergiaItem = (item) => {
    setFormConfig(prev => ({
      ...prev,
      energia_options: prev.energia_options.filter(opt => opt !== item)
    }));
  };

  const handleAddArconItem = () => {
    if (newArconItem.trim() && !formConfig.arcon_options.includes(newArconItem.trim())) {
      setFormConfig(prev => ({
        ...prev,
        arcon_options: [...prev.arcon_options, newArconItem.trim()]
      }));
      setNewArconItem('');
    }
  };

  const handleRemoveArconItem = (item) => {
    setFormConfig(prev => ({
      ...prev,
      arcon_options: prev.arcon_options.filter(opt => opt !== item)
    }));
  };

  const handleSaveFormConfig = async () => {
    setConfigLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/form-config`, formConfig);
      setSuccess('Configuração do formulário salva com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao salvar configuração do formulário');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfigLoading(false);
    }
  };

  // Funções para gerenciar KML
  const loadKmlLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kml/locations`);
      setKmlLocations(response.data);
    } catch (err) {
      console.error('Error loading KML locations:', err);
    }
  };

  const handleKmlFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.kml')) {
      setKmlFile(file);
    } else {
      setError('Por favor, selecione um arquivo KML válido');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleKmlUpload = async () => {
    if (!kmlFile) {
      setError('Selecione um arquivo KML para enviar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setKmlUploading(true);
    const formData = new FormData();
    formData.append('file', kmlFile);

    try {
      const response = await axios.post(`${API_BASE}/admin/upload-kml`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${response.data.message}`);
      setTimeout(() => setSuccess(''), 5000);
      setKmlFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('kml-file-input');
      if (fileInput) fileInput.value = '';
      
      // Reload locations
      loadKmlLocations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao processar arquivo KML');
      setTimeout(() => setError(''), 5000);
    } finally {
      setKmlUploading(false);
    }
  };

  const openInMaps = (latitude, longitude, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              data-testid="back-to-dashboard"
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
                <p className="text-sm text-slate-600">Gerenciar usuários e validações</p>
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Usuários Pendentes ({pendingUsers.length})</TabsTrigger>
            <TabsTrigger value="all-users">Usuários Cadastrados ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="pendencias">Validar Pendências</TabsTrigger>
            <TabsTrigger value="form-config">Configurar Formulário</TabsTrigger>
            <TabsTrigger value="kml-manager">Gerenciar KML</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas Mensais</TabsTrigger>
          </TabsList>

          {/* Usuários Pendentes */}
          <TabsContent value="users" className="space-y-4">
            {pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum usuário pendente</h3>
                  <p className="text-slate-600">Todos os usuários foram aprovados ou rejeitados</p>
                </CardContent>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <Card key={user.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{user.username}</h3>
                          <p className="text-sm text-slate-600">
                            Solicitado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleUserApproval(user.id, 'APPROVED')}
                          className="btn-hover bg-emerald-500 hover:bg-emerald-600 text-white"
                          size="sm"
                          data-testid="approve-user-btn"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleUserApproval(user.id, 'REJECTED')}
                          variant="outline"
                          size="sm"
                          className="btn-hover border-red-200 text-red-700 hover:bg-red-50"
                          data-testid="reject-user-btn"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Usuários Cadastrados */}
          <TabsContent value="all-users" className="space-y-4">
            {allUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum usuário cadastrado</h3>
                  <p className="text-slate-600">O sistema não possui usuários cadastrados</p>
                </CardContent>
              </Card>
            ) : (
              allUsers.map((userItem) => (
                <Card key={userItem.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          userItem.role === 'ADMIN' ? 'bg-purple-100' : 'bg-slate-200'
                        }`}>
                          <Users className={`w-5 h-5 ${
                            userItem.role === 'ADMIN' ? 'text-purple-600' : 'text-slate-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900">{userItem.username}</h3>
                            {userItem.role === 'ADMIN' && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                Admin
                              </Badge>
                            )}
                            <Badge 
                              className={`text-xs ${
                                userItem.status === 'APPROVED' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : userItem.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {userItem.status === 'APPROVED' ? 'Aprovado' : 
                               userItem.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            Cadastrado em: {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          {userItem.approved_by && userItem.approved_at && (
                            <p className="text-sm text-slate-500">
                              Aprovado por: {userItem.approved_by} em {new Date(userItem.approved_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Só mostrar ações se não for o próprio admin logado */}
                      {userItem.username !== user.username && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setResetPasswordModal({ isOpen: true, user: userItem })}
                            variant="outline"
                            size="sm"
                            className="btn-hover border-blue-200 text-blue-700 hover:bg-blue-50"
                            data-testid="reset-password-btn"
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Reset Senha
                          </Button>
                          <Button
                            onClick={() => setDeleteUserModal({ isOpen: true, user: userItem })}
                            variant="outline"
                            size="sm"
                            className="btn-hover border-red-200 text-red-700 hover:bg-red-50"
                            data-testid="delete-user-btn"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Validar Pendências */}
          <TabsContent value="pendencias" className="space-y-4">
            {allPendencias.filter(p => p.status === 'Finalizado' && !p.validation_status).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma pendência para validar</h3>
                  <p className="text-slate-600">Todas as pendências finalizadas foram validadas</p>
                </CardContent>
              </Card>
            ) : (
              allPendencias
                .filter(p => p.status === 'Finalizado' && !p.validation_status)
                .map((pendencia) => (
                  <Card key={pendencia.id} className="glass">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-orange-100 text-orange-700">
                                Aguardando Validação
                              </Badge>
                              <Badge variant="outline">
                                {pendencia.tipo} - {pendencia.subtipo}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-slate-900">{pendencia.site}</h3>
                            <p className="text-sm text-slate-600">{pendencia.observacoes}</p>
                            <p className="text-sm text-slate-600">
                              Finalizado por: <span className="font-medium">{pendencia.usuario_finalizacao}</span>
                            </p>
                            {pendencia.informacoes_fechamento && (
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">Informações de Fechamento:</span>
                                </p>
                                <p className="text-sm text-slate-800">{pendencia.informacoes_fechamento}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {pendencia.foto_base64 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newWindow = window.open();
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>Foto da Abertura</title></head>
                                      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                                        <img src="data:image/jpeg;base64,${pendencia.foto_base64}" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                                      </body>
                                    </html>
                                  `);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Foto Abertura
                              </Button>
                            )}
                            
                            {pendencia.foto_fechamento_base64 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newWindow = window.open();
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>Foto do Fechamento</title></head>
                                      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                                        <img src="data:image/jpeg;base64,${pendencia.foto_fechamento_base64}" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                                      </body>
                                    </html>
                                  `);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Foto Fechamento
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handlePendenciaValidation(pendencia.id, 'APPROVED')}
                              className="btn-hover bg-emerald-500 hover:bg-emerald-600 text-white"
                              size="sm"
                              data-testid="approve-pendencia-btn"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => handlePendenciaValidation(pendencia.id, 'REJECTED', 'Pendência rejeitada pelo administrador')}
                              variant="outline"
                              size="sm"
                              className="btn-hover border-red-200 text-red-700 hover:bg-red-50"
                              data-testid="reject-pendencia-btn"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Configurar Formulário */}
          <TabsContent value="form-config" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-500" />
                  Configuração do Formulário "Nova Pendência"
                </CardTitle>
                <CardDescription>
                  Gerencie as opções disponíveis nos campos Energia e Arcon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seção Energia */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    ⚡ Opções de Energia
                  </h3>
                  
                  {/* Adicionar novo item */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite nova opção para Energia"
                      value={newEnergiaItem}
                      onChange={(e) => setNewEnergiaItem(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddEnergiaItem();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddEnergiaItem}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {/* Lista de itens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formConfig.energia_options.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border"
                      >
                        <span className="text-sm font-medium">{item}</span>
                        <Button
                          onClick={() => handleRemoveEnergiaItem(item)}
                          variant="outline"
                          size="sm"
                          className="ml-2 p-1 h-7 w-7 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção Arcon */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    ❄️ Opções de Arcon
                  </h3>
                  
                  {/* Adicionar novo item */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite nova opção para Arcon"
                      value={newArconItem}
                      onChange={(e) => setNewArconItem(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddArconItem();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddArconItem}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {/* Lista de itens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formConfig.arcon_options.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border"
                      >
                        <span className="text-sm font-medium">{item}</span>
                        <Button
                          onClick={() => handleRemoveArconItem(item)}
                          variant="outline"
                          size="sm"
                          className="ml-2 p-1 h-7 w-7 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveFormConfig}
                    disabled={configLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6"
                  >
                    {configLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gerenciar KML */}
          <TabsContent value="kml-manager" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                  Gerenciador de Arquivos KML
                </CardTitle>
                <CardDescription>
                  Importe arquivos KML e gerencie localizações para disponibilizar aos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-slate-400" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Importar Arquivo KML</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Selecione um arquivo KML contendo dados de localização
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                      <input
                        id="kml-file-input"
                        type="file"
                        accept=".kml"
                        onChange={handleKmlFileChange}
                        className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      
                      <Button 
                        onClick={handleKmlUpload}
                        disabled={!kmlFile || kmlUploading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]"
                      >
                        {kmlUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar KML
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {kmlFile && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Arquivo selecionado: <span className="font-medium">{kmlFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Locations List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Localizações Importadas ({kmlLocations.length})</h3>
                    <Button onClick={loadKmlLocations} variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Atualizar Lista
                    </Button>
                  </div>

                  {kmlLocations.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Nenhuma localização encontrada</h3>
                        <p className="text-slate-600 dark:text-slate-400">Importe um arquivo KML para começar</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {kmlLocations.map((location, index) => (
                        <Card key={index} className="glass card-hover">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {location.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {location.source_file}
                                  </p>
                                </div>
                                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              </div>
                              
                              {location.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {location.description}
                                </p>
                              )}
                              
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Latitude:</span>
                                  <span className="font-mono">{location.latitude?.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Longitude:</span>
                                  <span className="font-mono">{location.longitude?.toFixed(6)}</span>
                                </div>
                              </div>
                              
                              <Button 
                                onClick={() => openInMaps(location.latitude, location.longitude, location.name)}
                                variant="outline"
                                size="sm"
                                className="w-full btn-hover border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                <ExternalLink className="w-3 h-3 mr-2" />
                                Abrir no Maps
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estatísticas Mensais */}
          <TabsContent value="stats" className="space-y-6">
            {monthlyStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      Mais Criou Pendências
                    </CardTitle>
                    <CardDescription>
                      {monthlyStats.month} {monthlyStats.year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyStats.most_created ? (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Trophy className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{monthlyStats.most_created._id}</h3>
                        <p className="text-slate-600">{monthlyStats.most_created.count} pendências criadas</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2" />
                        <p>Nenhuma pendência criada este mês</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-emerald-500" />
                      Mais Finalizou Pendências
                    </CardTitle>
                    <CardDescription>
                      {monthlyStats.month} {monthlyStats.year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyStats.most_finished ? (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Trophy className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{monthlyStats.most_finished._id}</h3>
                        <p className="text-slate-600">{monthlyStats.most_finished.count} pendências finalizadas</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2" />
                        <p>Nenhuma pendência finalizada este mês</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Reset de Senha */}
      {resetPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Resetar Senha - {resetPasswordModal.user?.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="new-password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a nova senha (min. 4 caracteres)"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordModal({ isOpen: false, user: null })}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const newPassword = document.getElementById('new-password').value;
                    if (newPassword && newPassword.length >= 4) {
                      handleResetPassword(resetPasswordModal.user.id, newPassword);
                    } else {
                      setError('A senha deve ter pelo menos 4 caracteres');
                      setTimeout(() => setError(''), 3000);
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Resetar Senha
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteUserModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-slate-900">
                Confirmar Exclusão
              </h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{deleteUserModal.user?.username}</strong>? 
              Esta ação não pode ser desfeita e o usuário perderá acesso imediatamente.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteUserModal({ isOpen: false, user: null })}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteUser(deleteUserModal.user.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Excluir Usuário
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}