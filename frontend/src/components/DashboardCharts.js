import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import DoughnutChart from './charts/DoughnutChart';
import { 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Download,
  RefreshCw,
  CalendarDays,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function DashboardCharts() {
  const navigate = useNavigate();
  const [timelineData, setTimelineData] = useState([]);
  const [distributionData, setDistributionData] = useState({ by_type: [], by_site: [], by_status: [] });
  const [performanceData, setPerformanceData] = useState({ top_creators: [], top_finalizers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [timelineResponse, distributionResponse, performanceResponse] = await Promise.all([
        axios.get(`${API_BASE}/reports/timeline`),
        axios.get(`${API_BASE}/reports/distribution`),
        axios.get(`${API_BASE}/reports/performance`)
      ]);

      setTimelineData(timelineResponse.data);
      setDistributionData(distributionResponse.data);
      setPerformanceData(performanceResponse.data);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Timeline data
      if (timelineData.length > 0) {
        const timelineWS = XLSX.utils.json_to_sheet(timelineData);
        XLSX.utils.book_append_sheet(wb, timelineWS, 'Linha do Tempo');
      }

      // Distribution data
      const distributionWS = XLSX.utils.aoa_to_sheet([
        ['Tipo de Distribuição', 'Item', 'Quantidade'],
        ...distributionData.by_type.map(item => ['Por Tipo', item.type, item.count]),
        ...distributionData.by_site.map(item => ['Por Site', item.site, item.count]),
        ...distributionData.by_status.map(item => ['Por Status', item.status, item.count])
      ]);
      XLSX.utils.book_append_sheet(wb, distributionWS, 'Distribuição');

      // Performance data
      if (performanceData.top_creators.length > 0) {
        const performanceWS = XLSX.utils.json_to_sheet(performanceData.top_creators);
        XLSX.utils.book_append_sheet(wb, performanceWS, 'Performance');
      }

      // Save file
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `relatorio_gerenciador_cn19_${today}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  // Prepare chart data
  const prepareTimelineChartData = () => {
    const labels = timelineData.map(item => item.period);
    
    return {
      labels,
      datasets: [
        {
          label: 'Total',
          data: timelineData.map(item => item.total),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
        {
          label: 'Finalizadas',
          data: timelineData.map(item => item.finished),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
        {
          label: 'Aprovadas',
          data: timelineData.map(item => item.approved),
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          fill: true,
        }
      ]
    };
  };

  const prepareDistributionByTypeData = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return {
      labels: distributionData.by_type.map(item => item.type),
      datasets: [{
        data: distributionData.by_type.map(item => item.count),
        backgroundColor: colors.slice(0, distributionData.by_type.length),
        borderColor: colors.slice(0, distributionData.by_type.length),
        borderWidth: 2
      }]
    };
  };

  const prepareSitePerformanceData = () => {
    const topSites = distributionData.by_site.slice(0, 8); // Top 8 sites
    
    return {
      labels: topSites.map(item => item.site),
      datasets: [{
        label: 'Pendências',
        data: topSites.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };
  };

  const preparePerformanceCreatorsData = () => {
    const topCreators = performanceData.top_creators.slice(0, 6);
    
    return {
      labels: topCreators.map(item => item.username),
      datasets: [
        {
          label: 'Criadas',
          data: topCreators.map(item => item.created),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        },
        {
          label: 'Aprovadas',
          data: topCreators.map(item => item.approved),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-lg">Carregando relatórios...</span>
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatórios e Análises</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Visualize dados e métricas do sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 fade-in">
        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Distribuição
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Sites
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="glass card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Evolução Temporal das Pendências
              </CardTitle>
              <CardDescription>
                Acompanhe a evolução das pendências ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <LineChart 
                  data={prepareTimelineChartData()} 
                  title="Pendências por Período"
                  height={400}
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de linha do tempo disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass card-hover">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-emerald-500" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>
                  Proporção entre Energia e Arcon
                </CardDescription>
              </CardHeader>
              <CardContent>
                {distributionData.by_type.length > 0 ? (
                  <DoughnutChart 
                    data={prepareDistributionByTypeData()}
                    height={300}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum dado de distribuição disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass card-hover">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                  Status das Pendências
                </CardTitle>
                <CardDescription>
                  Distribuição por status atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {distributionData.by_status.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="font-medium">{item.status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${(item.count / Math.max(...distributionData.by_status.map(s => s.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-6">
          <Card className="glass card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                Top Sites com Mais Pendências
              </CardTitle>
              <CardDescription>
                Sites ordenados por número de pendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              {distributionData.by_site.length > 0 ? (
                <BarChart 
                  data={prepareSitePerformanceData()}
                  title="Pendências por Site"
                  height={400}
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de sites disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="glass card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-indigo-500" />
                Performance dos Usuários
              </CardTitle>
              <CardDescription>
                Top criadores nos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.top_creators.length > 0 ? (
                <BarChart 
                  data={preparePerformanceCreatorsData()}
                  title="Criadores vs Aprovações"
                  height={400}
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de performance disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Table */}
          {performanceData.top_creators.length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Tabela de Performance</CardTitle>
                <CardDescription>Detalhamento dos top performers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold">Usuário</th>
                        <th className="text-left py-3 px-4 font-semibold">Criadas</th>
                        <th className="text-left py-3 px-4 font-semibold">Aprovadas</th>
                        <th className="text-left py-3 px-4 font-semibold">Taxa Aprovação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.top_creators.map((creator, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 px-4 font-medium">{creator.username}</td>
                          <td className="py-3 px-4">{creator.created}</td>
                          <td className="py-3 px-4">{creator.approved}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${
                              creator.approval_rate >= 80 ? 'text-emerald-600' :
                              creator.approval_rate >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {creator.approval_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}