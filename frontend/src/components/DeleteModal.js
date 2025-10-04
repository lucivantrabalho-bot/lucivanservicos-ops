import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { 
  Trash2, 
  Loader2, 
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  pendencia, 
  onSuccess,
  isAdmin 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Use admin endpoint if user is admin
      const endpoint = isAdmin 
        ? `${API_BASE}/admin/delete-pendencia/${pendencia.id}`
        : `${API_BASE}/pendencias/${pendencia.id}`;
      
      await axios.delete(endpoint);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error deleting pendencia:', err);
      setError(err.response?.data?.detail || 'Erro ao excluir pendência');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A pendência será permanentemente removida do sistema.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pendencia && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Pendência a ser excluída:</h4>
            <div className="space-y-1 text-sm text-red-700">
              <p><span className="font-medium">Site:</span> {pendencia.site}</p>
              <p><span className="font-medium">Tipo:</span> {pendencia.tipo} - {pendencia.subtipo}</p>
              <p><span className="font-medium">Observações:</span> {pendencia.observacoes}</p>
              <p><span className="font-medium">Criado por:</span> {pendencia.usuario_criacao}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="cancel-delete-btn"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleDelete}
            data-testid="confirm-delete-btn"
            className="btn-hover bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Pendência
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}