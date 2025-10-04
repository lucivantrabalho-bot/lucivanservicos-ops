import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  MapPin, 
  ExternalLink,
  Search,
  Filter,
  Map,
  RefreshCw,
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function LocationsMap() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Observation modal states
  const [observationModal, setObservationModal] = useState({
    isOpen: false,
    location: null,
    observations: []
  });
  const [newObservation, setNewObservation] = useState('');

  const searchLocations = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSearching(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE}/kml/search`, {
        params: { query: searchTerm, limit: 50 }
      });
      
      setLocations(response.data.locations || []);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error searching locations:', err);
      setError('Erro ao buscar localizações');
      setLocations([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocations();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setLocations([]);
    setSearchPerformed(false);
    setError('');
  };

  const openInMaps = (latitude, longitude, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const openAllInMaps = () => {
    const coords = locations.map(loc => `${loc.latitude},${loc.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/${coords}`;
    window.open(url, '_blank');
  };

  // Observation functions
  const openObservationModal = async (location) => {
    setObservationModal({
      isOpen: true,
      location: location,
      observations: []
    });
    
    // Load existing observations
    try {
      const response = await axios.get(`${API_BASE}/kml/locations/${location.id}/observations`);
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
      location: null,
      observations: []
    });
    setNewObservation('');
  };

  const addObservation = async () => {
    if (!newObservation.trim()) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/kml/locations/${observationModal.location.id}/observations`, {
        observation: newObservation.trim()
      });

      // Reload observations
      const response = await axios.get(`${API_BASE}/kml/locations/${observationModal.location.id}/observations`);
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
      await axios.delete(`${API_BASE}/kml/observations/${observationId}`);
      
      // Reload observations
      const response = await axios.get(`${API_BASE}/kml/locations/${observationModal.location.id}/observations`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">Carregando localizações...</p>
        </div>
      </div>
    );
  }

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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mapa de Localizações</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Explore as localizações importadas</p>
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

        {/* Search and Actions */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Busque por nome da estação ou localização (min. 2 caracteres)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="pl-10"
                  />
                </div>
                
                <Button 
                  onClick={searchLocations} 
                  disabled={searching || searchTerm.length < 2}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {searching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
                
                {searchPerformed && (
                  <Button onClick={clearSearch} variant="outline">
                    Limpar
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                💡 Digite o nome da estação ou local que procura para encontrar rapidamente
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {searchPerformed && (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {locations.length} localizações encontradas
                </span>
              )}
              
              {locations.length > 1 && (
                <Button onClick={openAllInMaps} variant="outline" size="sm">
                  <Map className="w-4 h-4 mr-2" />
                  Ver Todas no Maps
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {!searchPerformed ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Busque por Localizações
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Digite o nome da estação ou local no campo de busca acima para encontrar rapidamente a localização desejada.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                📍 Exemplo: "BRH", "Torre", "Estação" ou código da localização
              </p>
            </CardContent>
          </Card>
        ) : locations.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Nenhuma localização encontrada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Não encontramos localizações com o termo "{searchTerm}". Tente:
              </p>
              <ul className="text-sm text-slate-500 dark:text-slate-500 mb-4 space-y-1">
                <li>• Verificar a grafia do nome</li>
                <li>• Usar termos mais gerais (ex: "Torre" ao invés do código completo)</li>
                <li>• Tentar parte do nome da estação</li>
              </ul>
              <Button onClick={clearSearch} variant="outline">
                Nova Busca
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {locations.map((location, index) => (
              <Card key={index} className="glass card-hover fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {location.name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <FileText className="w-3 h-3 mr-1" />
                        {location.source_file}
                      </CardDescription>
                    </div>
                    <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {location.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                      {location.description}
                    </p>
                  )}
                  
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Coordenadas:</span>
                      <span className="text-slate-600 dark:text-slate-400">GPS</span>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lat:</span>
                        <span>{location.latitude?.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lng:</span>
                        <span>{location.longitude?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => openInMaps(location.latitude, location.longitude, location.name)}
                      className="w-full btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no Google Maps
                    </Button>
                    
                    <Button 
                      onClick={() => openObservationModal(location)}
                      variant="outline"
                      className="w-full btn-hover border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Observações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}