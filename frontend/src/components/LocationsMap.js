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
  FileText
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
    const coords = filteredLocations.map(loc => `${loc.latitude},${loc.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/${coords}`;
    window.open(url, '_blank');
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
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, descrição ou arquivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {filteredLocations.length} de {locations.length} localizações
              </span>
              
              {filteredLocations.length > 1 && (
                <Button onClick={openAllInMaps} variant="outline" size="sm">
                  <Map className="w-4 h-4 mr-2" />
                  Ver Todas no Maps
                </Button>
              )}
              
              <Button onClick={loadLocations} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {filteredLocations.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              {locations.length === 0 ? (
                <>
                  <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Nenhuma localização disponível
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Aguarde o administrador importar arquivos KML com dados de localização
                  </p>
                </>
              ) : (
                <>
                  <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Nenhuma localização encontrada
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Tente ajustar os termos de busca
                  </p>
                  <Button 
                    onClick={() => setSearchTerm('')} 
                    variant="outline"
                  >
                    Limpar Busca
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLocations.map((location, index) => (
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
                  
                  <Button 
                    onClick={() => openInMaps(location.latitude, location.longitude, location.name)}
                    className="w-full btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}