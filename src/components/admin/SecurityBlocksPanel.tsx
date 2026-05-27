import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Lock, 
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  User,
  Mail,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { useSecurityBlocks, BlockType } from '@/hooks/useSecurityBlocks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const SecurityBlocksPanel = () => {
  const { blocks, loading, refetch, createBlock, removeBlock, getActiveBlocks } = useSecurityBlocks();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    identifier: '',
    blockType: 'ip' as BlockType,
    reason: '',
    isPermanent: false,
    durationHours: 24
  });

  const activeBlocks = getActiveBlocks();

  const getBlockTypeIcon = (type: BlockType) => {
    switch (type) {
      case 'ip':
        return <Globe className="h-4 w-4 text-blue-400" />;
      case 'user':
        return <User className="h-4 w-4 text-green-400" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-400" />;
      case 'device':
        return <Smartphone className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getBlockTypeLabel = (type: BlockType) => {
    switch (type) {
      case 'ip':
        return 'Endereço IP';
      case 'user':
        return 'Usuário';
      case 'email':
        return 'Email';
      case 'device':
        return 'Dispositivo';
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.identifier || !newBlock.reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const blockedUntil = newBlock.isPermanent 
      ? undefined 
      : new Date(Date.now() + newBlock.durationHours * 60 * 60 * 1000);

    const success = await createBlock(
      newBlock.identifier,
      newBlock.blockType,
      newBlock.reason,
      newBlock.isPermanent,
      blockedUntil
    );

    if (success) {
      toast.success('Bloqueio criado com sucesso');
      setShowAddModal(false);
      setNewBlock({
        identifier: '',
        blockType: 'ip',
        reason: '',
        isPermanent: false,
        durationHours: 24
      });
    } else {
      toast.error('Erro ao criar bloqueio');
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    const success = await removeBlock(blockId);
    if (success) {
      toast.success('Bloqueio removido');
    } else {
      toast.error('Erro ao remover bloqueio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Bloqueios</p>
                <p className="text-2xl font-bold text-white">{blocks.length}</p>
              </div>
              <Lock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Bloqueios Ativos</p>
                <p className="text-2xl font-bold text-red-400">{activeBlocks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Permanentes</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {blocks.filter(b => b.isPermanent).length}
                </p>
              </div>
              <Lock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Automáticos</p>
                <p className="text-2xl font-bold text-blue-400">
                  {blocks.filter(b => b.autoBlocked).length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocks Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              Gerenciar Bloqueios
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Bloqueio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Tipo</TableHead>
                    <TableHead className="text-gray-300">Identificador</TableHead>
                    <TableHead className="text-gray-300">Motivo</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Expira em</TableHead>
                    <TableHead className="text-gray-300">Criado em</TableHead>
                    <TableHead className="text-gray-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map(block => {
                    const isActive = block.isPermanent || 
                      (block.blockedUntil && new Date(block.blockedUntil) > new Date());

                    return (
                      <TableRow key={block.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getBlockTypeIcon(block.blockType)}
                            <span className="text-gray-300">{getBlockTypeLabel(block.blockType)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                            {block.identifier}
                          </code>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">
                          {block.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className={isActive ? 'bg-red-600' : 'bg-gray-600'}>
                            {isActive ? 'Ativo' : 'Expirado'}
                          </Badge>
                          {block.autoBlocked && (
                            <Badge variant="outline" className="ml-2 border-yellow-600 text-yellow-400">
                              Auto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {block.isPermanent ? (
                            <span className="text-red-400">Permanente</span>
                          ) : block.blockedUntil ? (
                            format(new Date(block.blockedUntil), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {format(new Date(block.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBlock(block.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {blocks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        Nenhum bloqueio cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Block Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              Novo Bloqueio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Bloqueio</Label>
              <Select 
                value={newBlock.blockType} 
                onValueChange={(v: BlockType) => setNewBlock({ ...newBlock, blockType: v })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="ip">Endereço IP</SelectItem>
                  <SelectItem value="user">Usuário (ID)</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="device">Dispositivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Identificador</Label>
              <Input
                placeholder={
                  newBlock.blockType === 'ip' ? '192.168.1.1' :
                  newBlock.blockType === 'email' ? 'email@exemplo.com' :
                  newBlock.blockType === 'user' ? 'UUID do usuário' :
                  'Identificador do dispositivo'
                }
                value={newBlock.identifier}
                onChange={(e) => setNewBlock({ ...newBlock, identifier: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Descreva o motivo do bloqueio..."
                value={newBlock.reason}
                onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Bloqueio Permanente</Label>
              <Switch
                checked={newBlock.isPermanent}
                onCheckedChange={(checked) => setNewBlock({ ...newBlock, isPermanent: checked })}
              />
            </div>

            {!newBlock.isPermanent && (
              <div className="space-y-2">
                <Label>Duração (horas)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newBlock.durationHours}
                  onChange={(e) => setNewBlock({ ...newBlock, durationHours: parseInt(e.target.value) || 24 })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddBlock} className="bg-red-600 hover:bg-red-700">
              Criar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
