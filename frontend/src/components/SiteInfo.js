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
  HardDrive
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

  const renderTable = (records, columns) => {
    if (!records || records.length === 0) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {columns.map((col, index) => (
                <th key={index} className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, recordIndex) => (
              <tr key={recordIndex} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {record[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
                    {renderTable(categoryData.records, categoryData.columns)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}