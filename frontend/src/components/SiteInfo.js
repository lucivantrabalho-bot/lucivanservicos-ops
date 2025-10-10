import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  Search, 
  Database,
  FileText,
  RefreshCw,
  Info,
  Building,
  Zap,
  Cpu,
  Wind,
  Power,
  HardDrive,
  MessageSquare,
  Plus,
  Trash2,
  User,
  Eye,
  Edit3
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Icons for each category
const categoryIcons = {
  CLIMA: Wind,
  CONCESSIONARIA: Building,
  FCC: Cpu,
  GERADOR: Zap,
  INVERSOR: Power,
  UPS: HardDrive
};

const categoryColors = {
  CLIMA: 'bg-blue-500',
  CONCESSIONARIA: 'bg-orange-500',
  FCC: 'bg-purple-500',
  GERADOR: 'bg-yellow-500',
  INVERSOR: 'bg-green-500',
  UPS: 'bg-red-500'
};

export default function SiteInfo() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [siteData, setSiteData] = useState({});
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  
  // Observation modal states
  const [observationModal, setObservationModal] = useState({
    isOpen: false,
    record: null,
    recordId: '',
    observations: []
  });
  const [newObservation, setNewObservation] = useState('');
  
  // State for expanded cards
  const [expandedCards, setExpandedCards] = useState(new Set());

  const searchSiteData = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSearching(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE}/excel/search-site`, {
        params: { site: searchTerm }
      });
      
      setSiteData(response.data);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error searching site data:', err);
      setError('Erro ao buscar informações do site');
      setSiteData({});
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchSiteData();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSiteData({});
    setSearchPerformed(false);
    setError('');
  };

  // Observation functions
  const openObservationModal = async (record, recordId) => {
    setObservationModal({
      isOpen: true,
      record: record,
      recordId: recordId,
      observations: []
    });
    
    // Load existing observations
    try {
      const response = await axios.get(`${API_BASE}/excel/records/${recordId}/observations`);
      setObservationModal(prev => ({
        ...prev,
        observations: response.data || []
      }));
    } catch (err) {
      console.error('Error loading observations:', err);
    }
  };

  const closeObservationModal = () => {
    setObservationModal({
      isOpen: false,
      record: null,
      recordId: '',
      observations: []
    });
    setNewObservation('');
  };

  const addObservation = async () => {
    if (!newObservation.trim()) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/excel/records/${observationModal.recordId}/observations`, {
        observation: newObservation.trim()
      });

      // Reload observations
      const response = await axios.get(`${API_BASE}/excel/records/${observationModal.recordId}/observations`);
      setObservationModal(prev => ({
        ...prev,
        observations: response.data || []
      }));
      
      setNewObservation('');
    } catch (err) {
      console.error('Error adding observation:', err);
      setError('Erro ao adicionar observação');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteObservation = async (observationId) => {
    try {
      await axios.delete(`${API_BASE}/excel/observations/${observationId}`);
      
      // Reload observations
      const response = await axios.get(`${API_BASE}/excel/records/${observationModal.recordId}/observations`);
      setObservationModal(prev => ({
        ...prev,
        observations: response.data || []
      }));
    } catch (err) {
      console.error('Error deleting observation:', err);
      setError('Erro ao excluir observação');
      setTimeout(() => setError(''), 3000);
    }
  };

  // State for expanded cards
  const [expandedCards, setExpandedCards] = useState(new Set());

  const toggleCardExpansion = (cardKey) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardKey)) {
      newExpanded.delete(cardKey);
    } else {
      newExpanded.add(cardKey);
    }
    setExpandedCards(newExpanded);
  };

  const getMainFields = (record, columns) => {
    // Priority order for main fields to show as TAGs
    const priorityFields = ['site', 'nome', 'local', 'codigo', 'id', 'tag', 'equipamento', 'tipo', 'status'];
    
    // Find main fields based on priority and available columns
    const mainFields = [];
    const availableColumns = columns.filter(col => col !== '_record_id');
    
    // First, add fields that match priority order
    for (const priority of priorityFields) {
      for (const col of availableColumns) {
        if (col.toLowerCase().includes(priority)) {
          mainFields.push(col);
          break; // Only add one field per priority type
        }
      }
    }
    
    // If we have less than 3 main fields, add first available columns
    while (mainFields.length < 3 && mainFields.length < availableColumns.length) {
      for (const col of availableColumns) {
        if (!mainFields.includes(col)) {
          mainFields.push(col);
          break;
        }
      }
    }
    
    return mainFields.slice(0, 3); // Maximum 3 main fields as tags
  };

  const renderRecordCards = (records, columns, category) => {
    if (!records || records.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {records.map((record, recordIndex) => {
          const recordId = record._record_id || `${category}_${recordIndex}`;
          const cardKey = `${category}_${recordIndex}`;
          const isExpanded = expandedCards.has(cardKey);
          const mainFields = getMainFields(record, columns);
          const allFields = columns.filter(col => col !== '_record_id');
          const additionalFields = allFields.filter(col => !mainFields.includes(col));
          
          return (
            <Card key={recordIndex} className="glass border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-blue-500" />
                    {category} #{recordIndex + 1}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {additionalFields.length > 0 && (
                      <Button
                        onClick={() => toggleCardExpansion(cardKey)}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {isExpanded ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => openObservationModal(record, recordId)}
                      variant="outline"
                      size="sm"
                      className="btn-hover border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Obs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Main Fields - Always Visible as TAGs */}
                <div className="space-y-2">
                  {mainFields.map((col, colIndex) => (
                    <div key={colIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2 border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          {col}
                        </span>
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100 text-right break-words max-w-[70%]">
                          {record[col] || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Fields - Show/Hide Toggle */}
                {additionalFields.length > 0 && (
                  <div className="space-y-2">
                    {isExpanded && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Informações Adicionais:
                          </span>
                        </div>
                        {additionalFields.map((col, colIndex) => (
                          <div key={colIndex} className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                                {col}:
                              </span>
                              <span className="text-sm text-slate-900 dark:text-slate-100 break-words">
                                {record[col] || '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!isExpanded && additionalFields.length > 0 && (
                      <Button
                        onClick={() => toggleCardExpansion(cardKey)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-dashed border-slate-300 dark:border-slate-600 hover:border-solid"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ver {additionalFields.length} campo(s) adicional(ais)
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Quick info about observations */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    <span>Clique em "Obs" para suas anotações</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
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
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Informações por Site</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Consulte dados técnicos por localização</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Section */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-500" />
              Buscar Informações por Site
            </CardTitle>
            <CardDescription>
              Digite o nome ou código do site para encontrar informações técnicas em todas as categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  placeholder="Ex: BRH, Torre123, CN19-001..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="text-lg"
                />
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={searchSiteData} 
                  disabled={searching || searchTerm.length < 2}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex-1 sm:flex-none"
                >
                  {searching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">Buscar</span>
                </Button>
                
                {searchPerformed && (
                  <Button onClick={clearSearch} variant="outline">
                    Limpar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>💡 Dica:</strong> A busca procura em todas as categorias disponíveis: Clima, Concessionária, FCC, Gerador, Inversor e UPS</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {!searchPerformed ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Busque Informações do Site
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Digite o nome ou código do site no campo acima para encontrar informações técnicas detalhadas.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                📋 Sistema integrado com dados de: Clima, Concessionária, FCC, Gerador, Inversor e UPS
              </p>
            </CardContent>
          </Card>
        ) : siteData.categories_found === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Nenhuma informação encontrada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Não encontramos dados para o site "{siteData.site}". Tente:
              </p>
              <ul className="text-sm text-slate-500 dark:text-slate-500 mb-4 space-y-1 text-left inline-block">
                <li>• Verificar a grafia do nome do site</li>
                <li>• Usar códigos ou nomes alternativos</li>
                <li>• Confirmar se os dados foram carregados pelo administrador</li>
              </ul>
              <Button onClick={clearSearch} variant="outline">
                Nova Busca
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Resultados para "{siteData.site}"
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {siteData.categories_found} categoria(s) encontrada(s)
              </div>
            </div>

            {Object.entries(siteData.data || {}).map(([category, categoryData]) => {
              const IconComponent = categoryIcons[category] || FileText;
              const colorClass = categoryColors[category] || 'bg-slate-500';
              
              return (
                <Card key={category} className="glass">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category}</CardTitle>
                          <CardDescription>
                            {categoryData.records.length} registro(s) encontrado(s) • 
                            Arquivo: {categoryData.filename}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Atualizado: {new Date(categoryData.uploaded_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {renderRecordCards(categoryData.records, categoryData.columns, category)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Observation Modal */}
        {observationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Observações do Registro
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Adicione suas anotações e observações para este registro
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeObservationModal}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96 space-y-6">
                {/* Record Summary */}
                {observationModal.record && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Dados do Registro
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {Object.entries(observationModal.record)
                        .filter(([key]) => key !== '_record_id')
                        .slice(0, 6) // Show first 6 fields
                        .map(([key, value], index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{key}:</span>
                          <span className="text-slate-900 dark:text-slate-100 text-right">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Observation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Nova Observação
                  </h4>
                  <div className="space-y-3">
                    <textarea
                      value={newObservation}
                      onChange={(e) => setNewObservation(e.target.value)}
                      placeholder="Digite suas observações, anotações ou comentários sobre este registro..."
                      className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 resize-none"
                      rows={4}
                    />
                    <Button 
                      onClick={addObservation}
                      disabled={!newObservation.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Observação
                    </Button>
                  </div>
                </div>

                {/* Existing Observations */}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Observações Existentes ({observationModal.observations.length})
                  </h4>
                  
                  {observationModal.observations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma observação ainda.</p>
                      <p className="text-sm">Seja o primeiro a adicionar uma observação para este registro!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {observationModal.observations.map((obs, index) => (
                        <div key={index} className="bg-white dark:bg-slate-700 rounded-lg p-4 border dark:border-slate-600 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {obs.username}
                                  </span>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(obs.created_at).toLocaleDateString('pt-BR')} às {' '}
                                    {new Date(obs.created_at).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                                {obs.observation}
                              </p>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteObservation(obs.id)}
                              className="ml-3 p-1 h-8 w-8 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}