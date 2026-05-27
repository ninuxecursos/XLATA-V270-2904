
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Eye, Clock, User, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ErrorReport {
  id: string;
  user_email: string;
  user_whatsapp?: string;
  error_type: string;
  error_title: string;
  error_description: string;
  reproduce_steps?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  read_by?: string;
}

interface ErrorReportsModalProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
  onCountUpdate: (count: number) => void;
}

const ErrorReportsModal: React.FC<ErrorReportsModalProps> = ({ 
  open, 
  onClose, 
  unreadCount, 
  onCountUpdate 
}) => {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
      
      // Update unread count
      const unreadReports = data?.filter(report => !report.is_read) || [];
      onCountUpdate(unreadReports.length);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios de erro.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('error_reports')
        .update({ is_read: true })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, is_read: true, read_at: new Date().toISOString() }
          : report
      ));

      // Update selected report if it's the one being marked as read
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null);
      }

      // Update unread count
      const newUnreadCount = reports.filter(r => r.id !== reportId && !r.is_read).length;
      onCountUpdate(newUnreadCount);

    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar relatório como lido.",
        variant: "destructive"
      });
    }
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'performance': return '⚡';
      case 'ui': return '🎨';
      case 'data': return '📊';
      case 'login': return '🔐';
      case 'payment': return '💳';
      default: return '🔧';
    }
  };

  const getErrorTypeName = (type: string) => {
    switch (type) {
      case 'bug': return 'Bug/Erro de Sistema';
      case 'performance': return 'Problema de Performance';
      case 'ui': return 'Problema de Interface';
      case 'data': return 'Problema com Dados';
      case 'login': return 'Problema de Login';
      case 'payment': return 'Problema de Pagamento';
      default: return 'Outro';
    }
  };

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open]);

  if (selectedReport) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700 max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Detalhes do Relatório
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white"
              >
                ← Voltar
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Header with status */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={selectedReport.is_read ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {selectedReport.is_read ? "Lido" : "Não lido"}
                </Badge>
                <span className="text-xs text-gray-400">
                  {new Date(selectedReport.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* User info */}
              <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{selectedReport.user_email}</span>
                </div>
                {selectedReport.user_whatsapp && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{selectedReport.user_whatsapp}</span>
                  </div>
                )}
              </div>

              {/* Error details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getErrorTypeIcon(selectedReport.error_type)}</span>
                  <span className="text-sm text-gray-400">{getErrorTypeName(selectedReport.error_type)}</span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedReport.error_title}</h3>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.error_description}</p>
                  </div>
                </div>

                {selectedReport.reproduce_steps && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Passos para Reproduzir:</h4>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.reproduce_steps}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4">
                {!selectedReport.is_read && (
                  <Button
                    onClick={() => markAsRead(selectedReport.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Marcar como Lido
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-700 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Relatórios de Erro
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} não lidos
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando relatórios...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum relatório de erro encontrado.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-800 ${
                    report.is_read 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-red-900/20 border-red-700/50'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getErrorTypeIcon(report.error_type)}</span>
                        <span className="text-sm text-gray-400">{getErrorTypeName(report.error_type)}</span>
                        {!report.is_read && (
                          <Badge variant="destructive" className="text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-white mb-1">{report.error_title}</h3>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {report.error_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorReportsModal;
