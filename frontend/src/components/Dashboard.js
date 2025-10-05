import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Plus, 
  LogOut, 
  Filter, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Eye,
  User,
  Calendar,
  MapPin,
  Edit3,
  Trash2,
  BarChart3
} from 'lucide-react';
import { ThemeToggle } from './ui/theme-toggle';
import { Alert, AlertDescription } from './ui/alert';
import FinalizeModal from './FinalizeModal';
import EditModal from './EditModal';
import DeleteModal from './DeleteModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [pendencias, setPendencias] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [finalizeModal, setFinalizeModal] = useState({
    isOpen: false,
    pendencia: null
  });
  
  const [editModal, setEditModal] = useState({
    isOpen: false,
    pendencia: null
  });
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    pendencia: null
  });
  
  // Filters
  const [filters, setFilters] = useState({
    site: '',
    tipo: '',
    status: '',
    search: ''
  });

  // Load data on mount
  useEffect(() => {
    loadPendencias();
    loadSites();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadPendencias();
  }, [filters.site, filters.tipo, filters.status]);

  const loadPendencias = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.site) params.append('site', filters.site);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API_BASE}/pendencias?${params.toString()}`);
      setPendencias(response.data);
    } catch (err) {
      console.error('Error loading pendencias:', err);
      setError('Erro ao carregar pendências');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sites`);
      setSites(response.data.sites);
    } catch (err) {
      console.error('Error loading sites:', err);
    }
  };

  const openFinalizeModal = (pendencia) => {
    setFinalizeModal({
      isOpen: true,
      pendencia: pendencia
    });
  };

  const closeFinalizeModal = () => {
    setFinalizeModal({
      isOpen: false,
      pendencia: null
    });
  };

  const handleFinalizeSuccess = () => {
    setSuccess('Pendência finalizada com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
    loadPendencias();
  };

  // Edit modal functions
  const openEditModal = (pendencia) => {
    setEditModal({
      isOpen: true,
      pendencia: pendencia
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      pendencia: null
    });
  };

  const handleEditSuccess = () => {
    setSuccess('Pendência editada com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
    loadPendencias();
  };

  // Delete modal functions
  const openDeleteModal = (pendencia) => {
    setDeleteModal({
      isOpen: true,
      pendencia: pendencia
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      pendencia: null
    });
  };

  const handleDeleteSuccess = () => {
    setSuccess('Pendência excluída com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
    loadPendencias();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.site) params.append('site', filters.site);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API_BASE}/pendencias/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pendencias.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Arquivo exportado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting:', err);
      setError('Erro ao exportar arquivo');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredPendencias = pendencias.filter(pendencia => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      pendencia.site.toLowerCase().includes(searchLower) ||
      pendencia.observacoes.toLowerCase().includes(searchLower) ||
      pendencia.usuario_criacao.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: pendencias.length,
    pendente: pendencias.filter(p => p.status === 'Pendente').length,
    finalizado: pendencias.filter(p => p.status === 'Finalizado').length
  };

  if (loading && pendencias.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2M12 4.5L19.5 8.5V10C19.5 15 16.5 18.5 12 20C7.5 18.5 4.5 15 4.5 10V8.5L12 4.5M7 14L9 16L17 8L15.59 6.59L9 13.17L8.41 12.59L7 14Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gerenciador CN19</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bem-vindo, {user?.username}!</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={() => navigate('/create')}
                data-testid="create-pendencia-btn"
                className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Pendência
              </Button>
              
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  data-testid="admin-panel-btn"
                  className="btn-hover bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button
                onClick={() => navigate('/profile')}
                data-testid="profile-btn"
                className="btn-hover bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              
              <Button
                onClick={() => navigate('/locations')}
                data-testid="locations-btn"
                className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Localizações
              </Button>

              {isAdmin && (
                <Button
                  onClick={() => navigate('/reports')}
                  data-testid="reports-btn"
                  className="btn-hover bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
              )}
              
              <Button
                onClick={logout}
                variant="outline"
                data-testid="logout-btn"
                className="btn-hover border-slate-300 hover:border-slate-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pendentes</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendente}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Finalizadas</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.finalizado}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              
              {/* Site Filter */}
              <Select value={filters.site} onValueChange={(value) => setFilters(prev => ({ ...prev, site: value === 'all' ? '' : value }))}>
                <SelectTrigger data-testid="site-filter">
                  <SelectValue placeholder="Todos os sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Tipo Filter */}
              <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value === 'all' ? '' : value }))}>
                <SelectTrigger data-testid="tipo-filter">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Energia">Energia</SelectItem>
                  <SelectItem value="Arcon">Arcon</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isAdmin && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  data-testid="export-btn"
                  className="btn-hover"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pendências List */}
        <div className="space-y-4">
          {filteredPendencias.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma pendência encontrada</h3>
                <p className="text-slate-600 mb-6">Comece criando sua primeira pendência</p>
                <Button
                  onClick={() => navigate('/create')}
                  className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Pendência
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPendencias.map((pendencia) => (
              <Card key={pendencia.id} className="card-hover glass" data-testid="pendencia-card">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Main Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            className={`${pendencia.status === 'Pendente' ? 'status-pendente' : 'status-finalizado'} status-badge`}
                            data-testid="pendencia-status"
                          >
                            {pendencia.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {pendencia.tipo} - {pendencia.subtipo}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="font-medium">Site:</span>
                          <span className="ml-1">{pendencia.site}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">Criado em:</span>
                          <span className="ml-1">
                            {new Date(pendencia.data_hora).toLocaleDateString('pt-BR')} às {' '}
                            {new Date(pendencia.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <User className="w-4 h-4 mr-2" />
                          <span className="font-medium">Criado por:</span>
                          <span className="ml-1">{pendencia.usuario_criacao}</span>
                        </div>
                        
                        {pendencia.observacoes && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Observações:</span>
                            </p>
                            <p className="text-sm text-slate-800 mt-1 bg-slate-50 p-3 rounded-lg">
                              {pendencia.observacoes}
                            </p>
                          </div>
                        )}
                        
                        {pendencia.status === 'Finalizado' && pendencia.usuario_finalizacao && (
                          <>
                            <div className="flex items-center text-sm text-emerald-600">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              <span className="font-medium">Finalizado por:</span>
                              <span className="ml-1">{pendencia.usuario_finalizacao}</span>
                              {pendencia.data_finalizacao && (
                                <span className="ml-2 text-slate-500">
                                  em {new Date(pendencia.data_finalizacao).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {pendencia.informacoes_fechamento && (
                              <div className="mt-3">
                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">Informações de Fechamento:</span>
                                </p>
                                <p className="text-sm text-slate-800 mt-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                  {pendencia.informacoes_fechamento}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      {pendencia.foto_base64 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newWindow = window.open();
                            newWindow.document.write(`
                              <html>
                                <head><title>Foto da Pendência</title></head>
                                <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                                  <img src="data:image/jpeg;base64,${pendencia.foto_base64}" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                                </body>
                              </html>
                            `);
                          }}
                          data-testid="view-photo-btn"
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
                          data-testid="view-close-photo-btn"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Foto Fechamento
                        </Button>
                      )}
                      
                      {pendencia.status === 'Pendente' && (
                        <>
                          <Button
                            onClick={() => openEditModal(pendencia)}
                            data-testid="edit-pendencia-btn"
                            variant="outline"
                            size="sm"
                            className="btn-hover border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          
                          {/* Apenas admin pode excluir */}
                          {isAdmin && (
                            <Button
                              onClick={() => openDeleteModal(pendencia)}
                              data-testid="delete-pendencia-btn"
                              variant="outline"
                              size="sm"
                              className="btn-hover border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => openFinalizeModal(pendencia)}
                            data-testid="finalize-pendencia-btn"
                            className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Finalizar
                          </Button>
                        </>
                      )}

                      {/* Admin pode excluir qualquer pendência */}
                      {isAdmin && pendencia.status === 'Finalizado' && (
                        <Button
                          onClick={() => openDeleteModal(pendencia)}
                          variant="outline"
                          size="sm"
                          className="btn-hover border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir (Admin)
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modals */}
        <FinalizeModal
          isOpen={finalizeModal.isOpen}
          onClose={closeFinalizeModal}
          pendencia={finalizeModal.pendencia}
          onSuccess={handleFinalizeSuccess}
        />
        
        <EditModal
          isOpen={editModal.isOpen}
          onClose={closeEditModal}
          pendencia={editModal.pendencia}
          onSuccess={handleEditSuccess}
        />
        
        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          pendencia={deleteModal.pendencia}
          onSuccess={handleDeleteSuccess}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}