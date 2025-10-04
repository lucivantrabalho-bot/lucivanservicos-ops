import React, { useState, useCallback, useEffect } from 'react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Edit3, 
  Loader2, 
  Upload, 
  X, 
  Camera,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Opções baseadas no tipo
const OPCOES_ENERGIA = [
  'Controladora',
  'QDCA',
  'QM',
  'Retificador',
  'Disjuntor',
  'Bateria',
  'Iluminação Pátio',
  'Sensor de Porta',
  'Sensor de Incêndio',
  'Iluminação Gabinete/Container',
  'Cabo de Alimentação'
];

const OPCOES_ARCON = [
  'Trocador de Calor',
  'Sanrio',
  'Walmont',
  'Limpeza',
  'Contatora',
  'Compressor',
  'Gás',
  'Fusível',
  'Placa Queimada',
  'Transformador',
  'Relé Térmico',
  'Relé Falta de Fase',
  'Comando',
  'Alarme'
];

export default function EditModal({ 
  isOpen, 
  onClose, 
  pendencia, 
  onSuccess 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    site: '',
    tipo: '',
    subtipo: '',
    observacoes: ''
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && pendencia) {
      setFormData({
        site: pendencia.site || '',
        tipo: pendencia.tipo || '',
        subtipo: pendencia.subtipo || '',
        observacoes: pendencia.observacoes || ''
      });
      
      // Set existing photo if available
      if (pendencia.foto_base64) {
        setPhoto(pendencia.foto_base64);
        setPhotoPreview(`data:image/jpeg;base64,${pendencia.foto_base64}`);
      } else {
        setPhoto(null);
        setPhotoPreview(null);
      }
      
      setError('');
    }
  }, [isOpen, pendencia]);

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
    if (photoPreview && !photoPreview.startsWith('data:image/jpeg;base64,')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.site.trim()) {
      setError('O campo Site é obrigatório');
      return;
    }
    
    if (!formData.tipo) {
      setError('Selecione o tipo da pendência');
      return;
    }
    
    if (!formData.subtipo) {
      setError('Selecione o subtipo da pendência');
      return;
    }
    
    if (!formData.observacoes.trim()) {
      setError('O campo Observações é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        site: formData.site.trim(),
        tipo: formData.tipo,
        subtipo: formData.subtipo,
        observacoes: formData.observacoes.trim(),
        foto_base64: photo || null
      };

      await axios.put(`${API_BASE}/pendencias/${pendencia.id}/edit`, payload);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error editing pendencia:', err);
      setError(err.response?.data?.detail || 'Erro ao editar pendência');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubtipoOptions = () => {
    if (formData.tipo === 'Energia') return OPCOES_ENERGIA;
    if (formData.tipo === 'Arcon') return OPCOES_ARCON;
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <Edit3 className="w-5 h-5 text-blue-500 mr-2" />
            Editar Pendência
          </DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias na pendência
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Site */}
          <div className="space-y-2">
            <Label htmlFor="edit-site" className="text-sm font-medium text-slate-700">
              Site *
            </Label>
            <Input
              id="edit-site"
              data-testid="edit-site-input"
              type="text"
              placeholder="Digite o nome do site"
              value={formData.site}
              onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
              required
              className="form-input"
            />
          </div>
          
          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Tipo da Pendência *</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, tipo: value, subtipo: '' })); // Reset subtipo when tipo changes
              }}
            >
              <SelectTrigger data-testid="edit-tipo-select">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Energia">Energia</SelectItem>
                <SelectItem value="Arcon">Arcon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Subtipo */}
          {formData.tipo && (
            <div className="space-y-2 slide-up">
              <Label className="text-sm font-medium text-slate-700">Subtipo *</Label>
              <Select value={formData.subtipo} onValueChange={(value) => setFormData(prev => ({ ...prev, subtipo: value }))}>
                <SelectTrigger data-testid="edit-subtipo-select">
                  <SelectValue placeholder="Selecione o subtipo" />
                </SelectTrigger>
                <SelectContent>
                  {getSubtipoOptions().map(opcao => (
                    <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="edit-observacoes" className="text-sm font-medium text-slate-700">
              Observações *
            </Label>
            <Textarea
              id="edit-observacoes"
              data-testid="edit-observacoes-textarea"
              placeholder="Descreva detalhes sobre a pendência..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              required
              className="form-input min-h-[120px] resize-none"
            />
          </div>
          
          {/* Upload de Foto */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Foto (Opcional)</Label>
            
            {!photo ? (
              <div
                {...getRootProps()}
                className={`upload-area border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? 'drag-over' : ''
                }`}
                data-testid="edit-photo-upload-area"
              >
                <input {...getInputProps()} data-testid="edit-photo-input" />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    {isDragActive ? (
                      <Upload className="w-6 h-6 text-blue-500" />
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
                      Imagem carregada com sucesso
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    data-testid="edit-remove-photo-btn"
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
              data-testid="cancel-edit-btn"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              data-testid="save-edit-btn"
              className="btn-hover bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}