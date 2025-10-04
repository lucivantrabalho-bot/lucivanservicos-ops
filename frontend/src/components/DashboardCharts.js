import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, TrendingUp, Users, Calendar, MapPin, CheckCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function DashboardCharts() {
  const { user, isAdmin } = useAuth();
  const { isDark, colors } = useTheme();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas do dashboard
      const statsResponse = await axios.post(`${API_BASE}/reports/dashboard-stats`, {
        // Filtros podem ser adicionados aqui
      });
      
      setDashboardStats(statsResponse.data);

      // Se for admin, buscar métricas de performance
      if (isAdmin) {
        const performanceResponse = await axios.get(`${API_BASE}/reports/performance-metrics?days=30`);
        setPerformanceMetrics(performanceResponse.data);
      }

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportAdvanced = async () => {
    try {
      const response = await axios.post(`${API_BASE}/reports/export-advanced`, {
        filters: {},
        export_config: {
          format: 'excel',
          include_photos: false
        }
      }, {
        responseType: 'blob'
      });

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_avancado_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!dashboardStats) return null;

  // Configuração de cores para os gráficos baseada no tema
  const chartColors = {
    primary: isDark ? '#34d399' : '#10b981',
    secondary: isDark ? '#60a5fa' : '#3b82f6',
    success: isDark ? '#34d399' : '#10b981',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    error: isDark ? '#f87171' : '#ef4444',
    info: isDark ? '#60a5fa' : '#3b82f6',
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#f9fafb' : '#111827'
  };

  // Dados para o gráfico de status
  const statusChartData = {
    labels: ['Pendentes', 'Finalizadas', 'Validadas', 'Rejeitadas'],
    datasets: [{
      data: [
        dashboardStats.pendencias_abertas,
        dashboardStats.pendencias_finalizadas,
        dashboardStats.pendencias_validadas,
        dashboardStats.pendencias_rejeitadas
      ],
      backgroundColor: [
        chartColors.warning,
        chartColors.info,
        chartColors.success,
        chartColors.error
      ],
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#ffffff'
    }]
  };

  // Dados para o gráfico de sites
  const sitesChartData = {
    labels: Object.keys(dashboardStats.pendencias_por_site),
    datasets: [{
      label: 'Pendências por Site',
      data: Object.values(dashboardStats.pendencias_por_site),
      backgroundColor: chartColors.primary,
      borderColor: chartColors.primary,
      borderWidth: 1
    }]
  };

  // Dados para o gráfico de tipos
  const tiposChartData = {
    labels: Object.keys(dashboardStats.pendencias_por_tipo),
    datasets: [{
      label: 'Pendências por Tipo',
      data: Object.values(dashboardStats.pendencias_por_tipo),
      backgroundColor: [chartColors.primary, chartColors.secondary],
      borderColor: [chartColors.primary, chartColors.secondary],
      borderWidth: 1
    }]
  };

  // Opções gerais dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.text
        }
      },
      title: {
        color: chartColors.text
      }
    },
    scales: {
      x: {
        grid: {
          color: chartColors.background
        },
        ticks: {
          color: chartColors.text
        }
      },
      y: {
        grid: {
          color: chartColors.background
        },
        ticks: {
          color: chartColors.text
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Pendências</p>
                <p className="text-3xl font-bold">{dashboardStats.total_pendencias}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pendentes</p>
                <p className="text-3xl font-bold">{dashboardStats.pendencias_abertas}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Finalizadas</p>
                <p className="text-3xl font-bold">{dashboardStats.pendencias_finalizadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Taxa de Finalização</p>
                <p className="text-3xl font-bold">{dashboardStats.taxa_finalizacao}%</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Pendências</CardTitle>
            <CardDescription>
              Distribuição por status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut 
                data={statusChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: chartColors.text
                      }
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Sites */}
        <Card>
          <CardHeader>
            <CardTitle>Pendências por Site</CardTitle>
            <CardDescription>
              Distribuição por localização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={sitesChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Tipos */}
        <Card>
          <CardHeader>
            <CardTitle>Pendências por Tipo</CardTitle>
            <CardDescription>
              Distribuição por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={tiposChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Performance (só para admin) */}
        {isAdmin && performanceMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo Médio de Finalização</span>
                <span className="font-semibold">{performanceMetrics.tempo_medio_finalizacao_horas.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Usuários Ativos</span>
                <span className="font-semibold">{dashboardStats.usuarios_ativos}</span>
              </div>
              <Button 
                onClick={exportAdvanced} 
                className="w-full mt-4"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório Avançado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}