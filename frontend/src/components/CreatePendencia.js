import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Opções serão carregadas dinamicamente da API

export default function CreatePendencia() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    site: '',
    ami: '',
    tipo: '',
    subtipo: '',
    observacoes: ''
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para opções dinâmicas
  const [energiaOptions, setEnergiaOptions] = useState([]);
  const [arconOptions, setArconOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Carregar opções do formulário
  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const response = await axios.get(`${API_BASE}/admin/form-config`);
        setEnergiaOptions(response.data.energia_options || []);
        setArconOptions(response.data.arcon_options || []);
      } catch (err) {
        console.error('Error loading form options:', err);
        // Fallback para opções padrão se a API falhar
        setEnergiaOptions([
          'Controladora', 'QDCA', 'QM', 'Retificador', 'Disjuntor',
          'Bateria', 'Iluminação Pátio', 'Sensor de Porta',
          'Sensor de Incêndio', 'Iluminação Gabinete/Container',
          'Cabo de Alimentação'
        ]);
        setArconOptions([
          'Trocador de Calor', 'Sanrio', 'Walmont', 'Limpeza',
          'Contatora', 'Compressor', 'Gás', 'Fusível',
          'Placa Queimada', 'Transformador', 'Relé Térmico',
          'Relé Falta de Fase', 'Comando', 'Alarme'
        ]);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadFormOptions();
  }, []);

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
    setIsLoading(true);
    
    try {
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
      
      if (!photo) {
        setError('A foto é obrigatória para criar uma pendência');
        return;
      }
      
      const payload = {
        site: formData.site.trim(),
        tipo: formData.tipo,
        subtipo: formData.subtipo,
        observacoes: formData.observacoes.trim(),
        foto_base64: photo
      };
      
      await axios.post(`${API_BASE}/pendencias`, payload);
      
      setSuccess('Pendência criada com sucesso!');
      
      // Redirect após 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating pendencia:', err);
      setError(err.response?.data?.detail || 'Erro ao criar pendência');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubtipoOptions = () => {
    if (formData.tipo === 'Energia') return energiaOptions;
    if (formData.tipo === 'Arcon') return arconOptions;
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              data-testid="back-btn"
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nova Pendência</h1>
              <p className="text-sm text-slate-600">Preencha os dados da pendência</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="glass shadow-xl">
          <CardHeader>
            <CardTitle>Dados da Pendência</CardTitle>
            <CardDescription>
              Preencha todas as informações necessárias para registrar a pendência
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Site */}
              <div className="space-y-2">
                <Label htmlFor="site" className="text-sm font-medium text-slate-700">
                  Site *
                </Label>
                <Input
                  id="site"
                  data-testid="site-input"
                  type="text"
                  placeholder="Digite o nome do site"
                  value={formData.site}
                  onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              {/* AMI */}
              <div className="space-y-2">
                <Label htmlFor="ami" className="text-sm font-medium text-slate-700">
                  AMI
                </Label>
                <Input
                  id="ami"
                  data-testid="ami-input"
                  type="text"
                  placeholder="Digite o código AMI (opcional)"
                  value={formData.ami}
                  onChange={(e) => setFormData(prev => ({ ...prev, ami: e.target.value }))}
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
                  <SelectTrigger data-testid="tipo-select">
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
                    <SelectTrigger data-testid="subtipo-select">
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
                <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700">
                  Observações *
                </Label>
                <Textarea
                  id="observacoes"
                  data-testid="observacoes-textarea"
                  placeholder="Descreva detalhes sobre a pendência..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  required
                  className="form-input min-h-[120px] resize-none"
                />
              </div>
              
              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Foto *</Label>
                
                {!photo ? (
                  <div
                    {...getRootProps()}
                    className={`upload-area border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive ? 'drag-over' : ''
                    }`}
                    data-testid="photo-upload-area"
                  >
                    <input {...getInputProps()} data-testid="photo-input" />
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        {isDragActive ? (
                          <Upload className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400" />
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
                      <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden">
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
                        data-testid="remove-photo-btn"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                  data-testid="cancel-btn"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  data-testid="create-pendencia-submit-btn"
                  className="btn-hover bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Pendência'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}