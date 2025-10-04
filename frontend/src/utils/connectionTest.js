/**
 * Utilitários para testar conectividade com o backend
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export class ConnectionTester {
  constructor() {
    this.results = {
      healthCheck: null,
      directIpCheck: null,
      corsTest: null,
      networkError: null,
      recommendations: []
    };
  }

  async runFullDiagnostic() {
    console.log('[ConnectionTester] Iniciando diagnóstico completo de conectividade...');
    
    this.results.recommendations = [];
    
    // Teste 1: Health check básico
    await this.testHealthEndpoint();
    
    // Teste 2: Teste com IP direto (caso localhost não resolva)
    await this.testDirectIP();
    
    // Teste 3: Teste de CORS
    await this.testCORS();
    
    // Gerar recomendações
    this.generateRecommendations();
    
    return this.results;
  }

  async testHealthEndpoint() {
    console.log('[ConnectionTester] Testando endpoint de health...');
    
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.results.healthCheck = {
          success: true,
          status: response.status,
          data: data,
          responseTime: Date.now()
        };
        console.log('[ConnectionTester] Health check OK:', data);
      } else {
        this.results.healthCheck = {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('[ConnectionTester] Health check failed:', error);
      this.results.healthCheck = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
  }

  async testDirectIP() {
    console.log('[ConnectionTester] Testando com IP direto...');
    
    const directUrl = API_BASE.replace('localhost', '127.0.0.1');
    
    try {
      const response = await fetch(`${directUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.results.directIpCheck = {
          success: true,
          status: response.status,
          data: data
        };
        console.log('[ConnectionTester] Direct IP test OK:', data);
      } else {
        this.results.directIpCheck = {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('[ConnectionTester] Direct IP test failed:', error);
      this.results.directIpCheck = {
        success: false,
        error: error.message,
        type: error.name
      };
    }
  }

  async testCORS() {
    console.log('[ConnectionTester] Testando CORS...');
    
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });
      
      this.results.corsTest = {
        success: response.ok,
        status: response.status,
        headers: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers')
        }
      };
    } catch (error) {
      this.results.corsTest = {
        success: false,
        error: error.message
      };
    }
  }

  generateRecommendations() {
    const rec = this.results.recommendations;
    
    if (!this.results.healthCheck?.success) {
      if (this.results.healthCheck?.type === 'TypeError' && 
          this.results.healthCheck?.error.includes('fetch')) {
        rec.push({
          type: 'critical',
          title: 'Problema de Conectividade de Rede',
          description: 'Não foi possível conectar ao servidor backend.',
          actions: [
            'Verifique se o backend está rodando na porta 8001',
            'Teste curl http://localhost:8001/api/health no terminal',
            'Verifique firewall/antivírus bloqueando conexões localhost'
          ]
        });
      }
      
      if (this.results.directIpCheck?.success && !this.results.healthCheck?.success) {
        rec.push({
          type: 'warning',
          title: 'Problema de DNS/Resolução localhost',
          description: 'O IP direto funciona, mas localhost não resolve.',
          actions: [
            'Adicione "127.0.0.1 localhost" no arquivo hosts',
            'Use 127.0.0.1:8001 em vez de localhost:8001',
            'Verifique configurações de DNS do sistema'
          ]
        });
      }
    }
    
    if (!this.results.corsTest?.success) {
      rec.push({
        type: 'warning',
        title: 'Possível Problema de CORS',
        description: 'Preflight requests podem estar falhando.',
        actions: [
          'Verifique configuração CORS do backend',
          'Teste em modo incógnito do navegador',
          'Desative extensões do navegador temporariamente'
        ]
      });
    }
    
    if (this.results.healthCheck?.success) {
      rec.push({
        type: 'success',
        title: 'Conectividade OK',
        description: 'Backend acessível. Problema pode ser específico do login.',
        actions: [
          'Limpe cache do navegador (Ctrl+Shift+Delete)',
          'Teste em janela anônima/incógnita',
          'Verifique logs detalhados no console do navegador'
        ]
      });
    }
  }

  getStatusSummary() {
    if (this.results.healthCheck?.success) {
      return { status: 'healthy', message: 'Conectividade OK' };
    } else if (this.results.directIpCheck?.success) {
      return { status: 'warning', message: 'Problema com localhost, mas IP direto funciona' };
    } else {
      return { status: 'error', message: 'Não foi possível conectar ao servidor' };
    }
  }
}

export const testConnection = async () => {
  const tester = new ConnectionTester();
  return await tester.runFullDiagnostic();
};

export default ConnectionTester;