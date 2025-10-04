import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  CalendarDays, 
  Filter, 
  X, 
  Download,
  Search,
  MapPin,
  Tag,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  sites = [], 
  onExport,
  loading = false 
}) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      site: '',
      tipo: '',
      status: '',
      startDate: '',
      endDate: '',
      validation_status: ''
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  const getDatePresets = () => [
    {
      label: 'Hoje',
      value: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    {
      label: 'Esta Semana',
      value: () => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Este Mês',
      value: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Últimos 30 dias',
      value: () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
        const now = new Date();
        return {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      }
    }
  ];

  const applyDatePreset = (preset) => {
    const dates = preset.value();
    handleFilterChange('startDate', dates.startDate);
    handleFilterChange('endDate', dates.endDate);
  };

  return (
    <Card className="glass mb-6 border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Filtros Avançados</CardTitle>
              <CardDescription>
                Personalize sua busca e visualização
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Linha 1: Busca e Filtros Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pendências..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          
          {/* Site Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={filters.site || ''} onValueChange={(value) => handleFilterChange('site', value === 'all' ? '' : value)}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Todos os sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tipo Filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={filters.tipo || ''} onValueChange={(value) => handleFilterChange('tipo', value === 'all' ? '' : value)}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Energia">Energia</SelectItem>
                <SelectItem value="Arcon">Arcon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Validado">Validado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {isExpanded && (
          <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Presets de Data */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                Períodos Rápidos
              </h4>
              <div className="flex flex-wrap gap-2">
                {getDatePresets().map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset)}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seleção de Data Personalizada */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Período Personalizado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Status de Validação */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Status de Validação
              </h4>
              <Select 
                value={filters.validation_status || ''} 
                onValueChange={(value) => handleFilterChange('validation_status', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Todos os status de validação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="APPROVED">Aprovadas</SelectItem>
                  <SelectItem value="REJECTED">Rejeitadas</SelectItem>
                  <SelectItem value="">Pendentes de Validação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getActiveFiltersCount() > 0 
                  ? `${getActiveFiltersCount()} filtro${getActiveFiltersCount() > 1 ? 's' : ''} aplicado${getActiveFiltersCount() > 1 ? 's' : ''}`
                  : 'Nenhum filtro aplicado'
                }
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={onExport} 
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exportar Excel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}