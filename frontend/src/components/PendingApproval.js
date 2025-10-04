import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  LogOut
} from 'lucide-react';

export default function PendingApproval() {
  const { user, logout, checkUserStatus } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    const updatedUser = await checkUserStatus();
    if (updatedUser?.status === 'APPROVED') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciador CN19</h1>
          <p className="text-slate-600">Sistema de Gerenciamento de informações do CN19</p>
        </div>

        {/* Status Card */}
        <Card className="glass shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Cadastro Realizado com Sucesso!
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sua conta foi criada e está pendente de aprovação
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user?.username}</p>
                  <p className="text-sm text-slate-500">Usuário cadastrado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-700 font-medium">Aguardando Aprovação</span>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Próximos Passos:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Sua solicitação foi enviada para o administrador</li>
                    <li>• Aguarde a aprovação para ter acesso ao sistema</li>
                    <li>• Você será notificado quando sua conta for aprovada</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Status
              </Button>
              
              <Button
                onClick={logout}
                variant="outline"
                className="w-full border-slate-300 hover:border-slate-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Em caso de dúvidas, entre em contato com o administrador do sistema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}