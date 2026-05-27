import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Heart, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';


interface ErrorReportModalProps {
  open: boolean;
  onClose: () => void;
}

const ErrorReportModal: React.FC<ErrorReportModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [errorType, setErrorType] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorDescription, setErrorDescription] = useState('');
  const [selectedWhatsApp, setSelectedWhatsApp] = useState('');
  const [reproduceSteps, setReproduceSteps] = useState('');
  const [userWhatsAppNumbers, setUserWhatsAppNumbers] = useState<{
    whatsapp1?: string;
    whatsapp2?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch user's WhatsApp numbers when modal opens
  useEffect(() => {
    if (open && user) {
      const fetchUserWhatsApp = async () => {
        try {
          // First try to get from system_settings
          const { data: systemSettings } = await supabase
            .from('system_settings')
            .select('whatsapp1, whatsapp2')
            .eq('user_id', user.id)
            .single();

          if (systemSettings?.whatsapp1 || systemSettings?.whatsapp2) {
            const numbers = {
              whatsapp1: systemSettings.whatsapp1 || undefined,
              whatsapp2: systemSettings.whatsapp2 || undefined
            };
            setUserWhatsAppNumbers(numbers);
            
            // Auto-select first available number
            if (numbers.whatsapp1) {
              setSelectedWhatsApp(numbers.whatsapp1);
            } else if (numbers.whatsapp2) {
              setSelectedWhatsApp(numbers.whatsapp2);
            }
            return;
          }

          // Fallback to profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .single();
          
          if (profile?.phone) {
            setUserWhatsAppNumbers({ whatsapp1: profile.phone });
            setSelectedWhatsApp(profile.phone);
          }
        } catch (error) {
          // Erro ao buscar WhatsApp - ignora silenciosamente
        }
      };
      
      fetchUserWhatsApp();
    }
  }, [open, user]);

  const handleSubmit = async () => {
    const trimTitle = errorTitle.trim();
    const trimDesc = errorDescription.trim();
    
    if (!errorType || !trimTitle || !trimDesc) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para enviar um relatório.",
        variant: "destructive"
      });
      return;
    }
    
    // Length validation
    if (trimTitle.length > 100) {
      toast({
        title: "Erro",
        description: "Título muito longo (máximo 100 caracteres)",
        variant: "destructive"
      });
      return;
    }
    
    if (trimDesc.length > 1000) {
      toast({
        title: "Erro",
        description: "Descrição muito longa (máximo 1000 caracteres)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('error_reports')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          user_whatsapp: selectedWhatsApp || null,
          error_type: errorType,
          error_title: trimTitle.substring(0, 100),
          error_description: trimDesc.substring(0, 1000),
          reproduce_steps: reproduceSteps.trim().substring(0, 500) || null
        });

      if (error) {
        throw error;
      }

      // Reset form
      setErrorType('');
      setErrorTitle('');
      setErrorDescription('');
      setReproduceSteps('');
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao enviar relatório",
        description: "Ocorreu um erro ao enviar seu relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMultipleWhatsApp = userWhatsAppNumbers.whatsapp1 && userWhatsAppNumbers.whatsapp2;

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  // Success Modal
  if (showSuccessModal) {
    return (
      <Dialog open={true} onOpenChange={handleCloseSuccessModal}>
        <DialogContent className="sm:max-w-[400px] bg-gray-900 border-gray-700">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Solicitação Enviada!</h2>
            <p className="text-gray-400 text-sm">
              Seu relatório foi enviado com sucesso. Nossa equipe será notificada e entrará em contato em breve.
            </p>
            <Button
              onClick={handleCloseSuccessModal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
            >
              Terminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Relatar Erro
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Reporte bugs ou problemas para nossa equipe técnica
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Positive feedback message */}
          <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
            <Heart className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-300">
              Sua opinião é muito importante! Levamos todos os feedbacks em consideração para melhorar nosso sistema.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorType" className="text-gray-300">
              Tipo do Erro *
            </Label>
            <Select value={errorType} onValueChange={setErrorType}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Selecione o tipo do erro" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="bug" className="text-white">🐛 Bug/Erro de Sistema</SelectItem>
                <SelectItem value="performance" className="text-white">⚡ Problema de Performance</SelectItem>
                <SelectItem value="ui" className="text-white">🎨 Problema de Interface</SelectItem>
                <SelectItem value="data" className="text-white">📊 Problema com Dados</SelectItem>
                <SelectItem value="login" className="text-white">🔐 Problema de Login</SelectItem>
                <SelectItem value="payment" className="text-white">💳 Problema de Pagamento</SelectItem>
                <SelectItem value="other" className="text-white">🔧 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorTitle" className="text-gray-300">
              Título do Erro *
            </Label>
            <Input
              id="errorTitle"
              value={errorTitle}
              onChange={(e) => setErrorTitle(e.target.value)}
              placeholder="Ex: Não consigo salvar um novo material"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorDescription" className="text-gray-300">
              Descrição Detalhada *
            </Label>
            <Textarea
              id="errorDescription"
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              placeholder="Descreva o erro em detalhes: o que você estava fazendo, o que aconteceu, qual era o resultado esperado..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
            />
          </div>

          {(userWhatsAppNumbers.whatsapp1 || userWhatsAppNumbers.whatsapp2) && (
            <div className="space-y-2">
              <Label className="text-gray-300">
                WhatsApp para Contato
              </Label>
              
              {hasMultipleWhatsApp ? (
                <Select value={selectedWhatsApp} onValueChange={setSelectedWhatsApp}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione qual WhatsApp usar" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {userWhatsAppNumbers.whatsapp1 && (
                      <SelectItem value={userWhatsAppNumbers.whatsapp1} className="text-white">
                        WhatsApp 1: {userWhatsAppNumbers.whatsapp1}
                      </SelectItem>
                    )}
                    {userWhatsAppNumbers.whatsapp2 && (
                      <SelectItem value={userWhatsAppNumbers.whatsapp2} className="text-white">
                        WhatsApp 2: {userWhatsAppNumbers.whatsapp2}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={selectedWhatsApp || 'WhatsApp não cadastrado'}
                  className="bg-gray-800 border-gray-600 text-white"
                  disabled
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reproduceSteps" className="text-gray-300">
              Passos para Reproduzir o Erro
            </Label>
            <Textarea
              id="reproduceSteps"
              value={reproduceSteps}
              onChange={(e) => setReproduceSteps(e.target.value)}
              placeholder="1. Primeiro eu cliquei em...&#10;2. Depois eu tentei...&#10;3. O erro apareceu quando..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto h-12 text-gray-300 hover:text-white hover:bg-gray-700 rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!errorType || !errorTitle || !errorDescription || isSubmitting}
              className="w-full sm:w-auto h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorReportModal;