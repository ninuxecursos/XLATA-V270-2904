import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Flag, 
  RefreshCw,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const FeatureFlagsPanel = () => {
  const { flags, loading, refetch, toggleFlag, createFlag, updateFlagPercentage, deleteFlag } = useFeatureFlags();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    isEnabled: false
  });

  const handleToggle = async (flagId: string, currentState: boolean) => {
    const success = await toggleFlag(flagId, !currentState);
    if (success) {
      toast.success(`Feature flag ${!currentState ? 'ativada' : 'desativada'}`);
    } else {
      toast.error('Erro ao alterar feature flag');
    }
  };

  const handlePercentageChange = async (flagId: string, percentage: number) => {
    const success = await updateFlagPercentage(flagId, percentage);
    if (!success) {
      toast.error('Erro ao atualizar porcentagem');
    }
  };

  const handleCreate = async () => {
    if (!newFlag.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Validate name format
    if (!/^[a-z_]+$/.test(newFlag.name)) {
      toast.error('Nome deve conter apenas letras minúsculas e underscores');
      return;
    }

    const success = await createFlag(newFlag.name, newFlag.description, newFlag.isEnabled);
    if (success) {
      toast.success('Feature flag criada');
      setShowAddModal(false);
      setNewFlag({ name: '', description: '', isEnabled: false });
    } else {
      toast.error('Erro ao criar feature flag');
    }
  };

  const handleDelete = async (flagId: string, flagName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a flag "${flagName}"?`)) {
      return;
    }

    const success = await deleteFlag(flagId);
    if (success) {
      toast.success('Feature flag excluída');
    } else {
      toast.error('Erro ao excluir feature flag');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Flag className="h-5 w-5 text-purple-400" />
                Feature Flags
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Controle quais funcionalidades estão disponíveis no sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Flag
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Flags List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map(flag => (
            <Card key={flag.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-lg text-purple-400 font-mono">{flag.name}</code>
                      <Badge className={flag.isEnabled ? 'bg-green-600' : 'bg-muted'}>
                        {flag.isEnabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {flag.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={() => handleToggle(flag.id, flag.isEnabled)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(flag.id, flag.name)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Percentage Rollout */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      <span>Rollout Gradual</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {flag.enabledPercentage}%
                    </span>
                  </div>
                  <Slider
                    value={[flag.enabledPercentage]}
                    onValueChange={([value]) => handlePercentageChange(flag.id, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {flag.enabledPercentage === 0 
                      ? 'Rollout desativado' 
                      : `Habilitado para ${flag.enabledPercentage}% dos usuários`}
                  </p>
                </div>

                {/* Users with Access */}
                {flag.enabledForUsers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Usuários específicos: {flag.enabledForUsers.length}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-4 text-xs text-muted-foreground">
                  Atualizado: {format(new Date(flag.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
              </CardContent>
            </Card>
          ))}

          {flags.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma feature flag cadastrada</p>
              <Button 
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowAddModal(true)}
              >
                Criar primeira flag
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Flag Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-purple-400" />
              Nova Feature Flag
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome (snake_case)</Label>
              <Input
                placeholder="exemplo_feature_nova"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                className="bg-muted border-border font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use apenas letras minúsculas e underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o que esta flag controla..."
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Iniciar Ativada</Label>
              <Switch
                checked={newFlag.isEnabled}
                onCheckedChange={(checked) => setNewFlag({ ...newFlag, isEnabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
              Criar Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
