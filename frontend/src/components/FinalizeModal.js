import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle2, 
  Loader2, 
  Upload, 
  X, 
  Camera,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

export default function FinalizeModal({ 
  isOpen, 
  onClose, 
  pendencia, 
  onSuccess 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [informacoesFechamento, setInformacoesFechamento] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInformacoesFechamento('');
      setPhoto(null);
      setPhotoPreview(null);
      setError('');
    }
  }, [isOpen]);

  // Função para converter arquivo para base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove o prefixo data:image/...;base64,
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Dropzone para upload de imagem
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Verifica se é uma imagem
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Verifica o tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 10MB');
        return;
      }
      
      try {
        const base64 = await fileToBase64(file);
        setPhoto(base64);
        setPhotoPreview(URL.createObjectURL(file));
        setError('');
      } catch (err) {
        setError('Erro ao processar a imagem');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!informacoesFechamento.trim()) {
      setError('As informações de fechamento são obrigatórias');
      return;
    }

    if (!photo) {
      setError('A foto de fechamento é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      await axios.put(`${API_BASE}/pendencias/${pendencia.id}`, {
        status: 'Finalizado',
        informacoes_fechamento: informacoesFechamento.trim(),
        foto_fechamento_base64: photo
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error finalizing pendencia:', err);
      setError(err.response?.data?.detail || 'Erro ao finalizar pendência');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
            Finalizar Pendência
          </DialogTitle>
          <DialogDescription>
            Preencha as informações sobre a resolução da pendência
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informações da Pendência */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-medium text-slate-900 mb-2">Detalhes da Pendência</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium">Site:</span> {pendencia?.site}</p>
              <p><span className="font-medium">Tipo:</span> {pendencia?.tipo} - {pendencia?.subtipo}</p>
              <p><span className="font-medium">Observações:</span> {pendencia?.observacoes}</p>
            </div>
          </div>

          {/* Informações de Fechamento */}
          <div className="space-y-2">
            <Label htmlFor="informacoes-fechamento" className="text-sm font-medium text-slate-700">
              Informações do Fechamento *
            </Label>
            <Textarea
              id="informacoes-fechamento"
              data-testid="close-info-textarea"
              placeholder="Descreva como a pendência foi resolvida, quais ações foram tomadas, peças substituídas, etc."
              value={informacoesFechamento}
              onChange={(e) => setInformacoesFechamento(e.target.value)}
              required
              className="form-input min-h-[120px] resize-none"
            />
          </div>

          {/* Upload de Foto de Fechamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Foto do Fechamento *</Label>
            
            {!photo ? (
              <div
                {...getRootProps()}
                className={`upload-area border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? 'drag-over' : ''
                }`}
                data-testid="close-photo-upload-area"
              >
                <input {...getInputProps()} data-testid="close-photo-input" />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    {isDragActive ? (
                      <Upload className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG, JPEG até 10MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Imagem anexada</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Imagem de fechamento carregada
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    data-testid="remove-close-photo-btn"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              data-testid="cancel-finalize-btn"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              data-testid="confirm-finalize-btn"
              className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              disabled={isLoading || !informacoesFechamento.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar Pendência
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}