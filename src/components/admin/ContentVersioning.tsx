import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  History, 
  RotateCcw, 
  Eye, 
  Save, 
  Clock, 
  CheckCircle,
  User,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Json } from '@/integrations/supabase/types';

interface ContentVersion {
  id: string;
  content_type: string;
  content_id: string | null;
  version_number: number;
  data: Json;
  created_by: string | null;
  created_at: string;
  is_published: boolean | null;
  published_at: string | null;
  publish_note: string | null;
  creator_email?: string;
}

interface ContentVersioningProps {
  contentType: 'landing' | 'blog' | 'help';
  contentId?: string;
  currentData: Json;
  onRestoreVersion: (data: Json) => void;
}

export const ContentVersioning: React.FC<ContentVersioningProps> = ({
  contentType,
  contentId,
  currentData,
  onRestoreVersion
}) => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const { logContentChange } = useAuditLog();

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, contentType, contentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('content_versions')
        .select('*')
        .eq('content_type', contentType)
        .order('version_number', { ascending: false })
        .limit(20);

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch creator emails
      const creatorIds = [...new Set(data?.filter(v => v.created_by).map(v => v.created_by))];
      let creatorsMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', creatorIds as string[]);

        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.email || 'N/A';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      setVersions((data || []).map(v => ({
        ...v,
        creator_email: v.created_by ? creatorsMap[v.created_by] : 'Sistema'
      })));

    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de versões.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async (note?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get next version number
      const { data: lastVersion } = await supabase
        .from('content_versions')
        .select('version_number')
        .eq('content_type', contentType)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (lastVersion?.version_number || 0) + 1;

      const { error } = await supabase
        .from('content_versions')
        .insert([{
          content_type: contentType,
          content_id: contentId || null,
          version_number: nextVersion,
          data: currentData as Json,
          created_by: user?.id || null,
          is_published: true,
          published_at: new Date().toISOString(),
          publish_note: note || null
        }]);

      if (error) throw error;

      await logContentChange(contentType, contentId || 'global', 'publish', note);

      toast({
        title: "Versão salva",
        description: `Versão ${nextVersion} salva com sucesso.`
      });

      setShowSaveDialog(false);
      setPublishNote('');
      fetchVersions();

    } catch (error) {
      console.error('Error saving version:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a versão.",
        variant: "destructive"
      });
    }
  };

  const restoreVersion = async (version: ContentVersion) => {
    try {
      onRestoreVersion(version.data);

      await logContentChange(contentType, contentId || 'global', 'update', `Restaurado para versão ${version.version_number}`);

      toast({
        title: "Versão restaurada",
        description: `Versão ${version.version_number} restaurada. Salve para confirmar as alterações.`
      });

      setIsOpen(false);
      setSelectedVersion(null);

    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar a versão.",
        variant: "destructive"
      });
    }
  };

  const getContentTypeName = () => {
    switch (contentType) {
      case 'landing': return 'Landing Page';
      case 'blog': return 'Blog';
      case 'help': return 'Ajuda';
      default: return contentType;
    }
  };

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar Versão
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          Histórico ({versions.length})
        </Button>
      </div>

      {/* Save Version Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Salvar Nova Versão
            </DialogTitle>
            <DialogDescription>
              Salve o estado atual do conteúdo como uma nova versão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Nota da versão (opcional)</Label>
              <Input
                id="note"
                placeholder="Ex: Atualizado textos do hero..."
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => saveVersion(publishNote)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Versão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Versões - {getContentTypeName()}
            </DialogTitle>
            <DialogDescription>
              Visualize e restaure versões anteriores do conteúdo.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma versão salva ainda.</p>
                <p className="text-sm mt-2">Clique em "Salvar Versão" para criar a primeira.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <Card 
                    key={version.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedVersion?.id === version.id ? 'border-primary ring-1 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Versão {version.version_number}</span>
                            {version.is_published && (
                              <Badge className="bg-green-600 text-white text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Publicada
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">Atual</Badge>
                            )}
                          </div>
                          {version.publish_note && (
                            <p className="text-sm text-muted-foreground">{version.publish_note}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(version.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.creator_email}
                            </span>
                          </div>
                        </div>

                        {selectedVersion?.id === version.id && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPreview(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            {index > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreVersion(version);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restaurar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview - Versão {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              Visualização do conteúdo desta versão.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px]">
            {selectedVersion && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Dados da Versão
                  </h4>
                  <pre className="text-xs overflow-x-auto bg-background p-3 rounded border">
                    {JSON.stringify(selectedVersion.data, null, 2)}
                  </pre>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    restoreVersion(selectedVersion);
                    setShowPreview(false);
                  }}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurar Esta Versão
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentVersioning;
