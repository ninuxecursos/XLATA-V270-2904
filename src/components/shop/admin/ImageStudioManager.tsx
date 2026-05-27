import { useState } from 'react';
import { Sparkles, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useImageStudioPrompts } from '@/hooks/useImageStudioPrompts';
import { AIPromptsManager } from '@/components/admin/AIPromptsManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ImageStudioManager() {
  const { prompts, activePrompt, isLoading, createPrompt, updatePrompt, deletePrompt, activatePrompt, deactivatePrompt } = useImageStudioPrompts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ id: string; name: string; prompt: string } | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingPrompt(null);
    setFormName('');
    setFormPrompt('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: { id: string; name: string; prompt: string }) => {
    setEditingPrompt(p);
    setFormName(p.name);
    setFormPrompt(p.prompt);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrompt.trim()) return;
    setIsSaving(true);
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, { name: formName, prompt: formPrompt });
    } else {
      await createPrompt(formName, formPrompt);
    }
    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deletePrompt(deleteId);
    setDeleteId(null);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    if (currentActive) {
      await deactivatePrompt(id);
    } else {
      await activatePrompt(id);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--shop-text-primary))]">Prompts</h1>
            <p className="text-sm text-[hsl(var(--shop-text-muted))]">Todos os prompts de IA usados na loja: scanner, conteúdo, marketplace e galeria de imagens</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Prompt
        </Button>
      </div>

      {/* Active Prompt Highlight */}
      {activePrompt && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base text-green-800">Prompt Ativo: {activePrompt.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 whitespace-pre-wrap line-clamp-4">{activePrompt.prompt}</p>
          </CardContent>
        </Card>
      )}

      {!activePrompt && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <XCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Nenhum prompt ativo. A geração de imagem está desabilitada.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">Carregando...</p>
        ) : prompts.length === 0 ? (
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">Nenhum prompt cadastrado.</p>
        ) : (
          prompts.map((p) => (
            <Card key={p.id} className={p.is_active ? 'border-green-300' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-[hsl(var(--shop-text-primary))]">{p.name}</h3>
                      {p.is_active && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--shop-text-muted))] mb-2">
                      Criado em {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-[hsl(var(--shop-text-secondary))] whitespace-pre-wrap line-clamp-3">{p.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${p.id}`} className="text-xs text-[hsl(var(--shop-text-muted))]">
                        {p.is_active ? 'On' : 'Off'}
                      </Label>
                      <Switch
                        id={`switch-${p.id}`}
                        checked={p.is_active}
                        onCheckedChange={() => handleToggle(p.id, p.is_active)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="h-8 w-8">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Prompts da IA do sistema (scanner, conteúdo, marketplace, blog, etc.) */}
      <div className="pt-4 border-t border-gray-200">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[hsl(var(--shop-text-primary))]">Prompts do Sistema de IA</h2>
          <p className="text-sm text-[hsl(var(--shop-text-muted))]">
            Padronização de imagens (scanner), análise de conteúdo, otimização para marketplaces e geração de artigos do blog.
          </p>
        </div>
        <AIPromptsManager />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? 'Editar Prompt' : 'Novo Prompt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Prompt Padrão" />
            </div>
            <div>
              <Label>Prompt</Label>
              <Textarea
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                placeholder="Instruções para a IA gerar a imagem..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || !formName.trim() || !formPrompt.trim()}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prompt?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
