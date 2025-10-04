import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Monitor,
  Network,
  Server,
  Globe,
  Terminal
} from 'lucide-react';
import { testConnection } from '../utils/connectionTest';

export default function ConnectionDiagnostic({ isOpen, onClose }) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);

  const runDiagnostic = async () => {
    setIsTestingConnection(true);
    try {
      const results = await testConnection();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success === null) return <Monitor className="w-4 h-4 text-gray-400" />;
    return success 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (success) => {
    if (success === null) return <Badge variant="secondary">Não testado</Badge>;
    return success 
      ? <Badge variant="success" className="bg-green-100 text-green-800">OK</Badge>
      : <Badge variant="destructive">Falhou</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Diagnóstico de Conectividade</CardTitle>
                <CardDescription>
                  Verificar problemas de conexão com o servidor
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Botão de teste */}
          <div className="text-center">
            <Button 
              onClick={runDiagnostic} 
              disabled={isTestingConnection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executando Diagnóstico...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Executar Teste de Conectividade
                </>
              )}
            </Button>
          </div>

          {/* Resultados dos testes */}
          {diagnosticResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Resultados dos Testes
              </h3>

              {/* Health Check */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(diagnosticResults.healthCheck?.success)}
                      <div>
                        <h4 className="font-medium">Teste de Health do Backend</h4>
                        <p className="text-sm text-gray-600">
                          Conectividade básica com {process.env.REACT_APP_BACKEND_URL}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(diagnosticResults.healthCheck?.success)}
                  </div>
                  
                  {diagnosticResults.healthCheck?.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Erro: {diagnosticResults.healthCheck.error}
                    </div>
                  )}
                  
                  {diagnosticResults.healthCheck?.success && (
                    <div className="mt-2 text-sm text-green-600">
                      Servidor: {diagnosticResults.healthCheck.data?.service}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Direct IP Check */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(diagnosticResults.directIpCheck?.success)}
                      <div>
                        <h4 className="font-medium">Teste com IP Direto (127.0.0.1)</h4>
                        <p className="text-sm text-gray-600">
                          Teste alternativo usando IP em vez de localhost
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(diagnosticResults.directIpCheck?.success)}
                  </div>
                  
                  {diagnosticResults.directIpCheck?.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Erro: {diagnosticResults.directIpCheck.error}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CORS Test */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(diagnosticResults.corsTest?.success)}
                      <div>
                        <h4 className="font-medium">Teste de CORS</h4>
                        <p className="text-sm text-gray-600">
                          Verificar políticas de cross-origin
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(diagnosticResults.corsTest?.success)}
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Recomendações
                  </h3>
                  
                  {diagnosticResults.recommendations.map((rec, index) => (
                    <Alert key={index} className={`border-l-4 ${
                      rec.type === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-green-500 bg-green-50 dark:bg-green-900/20'
                    }`}>
                      <AlertDescription>
                        <div className="space-y-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm">{rec.description}</p>
                          {rec.actions && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Ações sugeridas:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                {rec.actions.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Informações técnicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="w-5 h-5 mr-2" />
                    Informações Técnicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm font-mono">
                  <div><strong>Backend URL:</strong> {process.env.REACT_APP_BACKEND_URL}</div>
                  <div><strong>API Base:</strong> {process.env.REACT_APP_BACKEND_URL}/api</div>
                  <div><strong>Frontend Origin:</strong> {window.location.origin}</div>
                  <div><strong>User Agent:</strong> {navigator.userAgent.split(' ')[0]}...</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instruções manuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Teste Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Para verificar se o backend está funcionando, execute no terminal:
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                curl http://localhost:8001/api/health
              </div>
              <p className="text-xs text-gray-500">
                Deve retornar: {"{"}"status": "healthy"{"}"} se o servidor estiver funcionando.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}