import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User, Mail, Phone, Calendar, Clock, CheckCircle, XCircle,
  Shield, Ban, AlertTriangle, RotateCcw, MapPin, ShoppingBag,
  Globe, Monitor, Activity, Key, Lock, Unlock, Eye
} from 'lucide-react';
import { ShopUser } from '@/hooks/useShopUsers';
import { toast } from 'sonner';

interface ShopUserDetailsModalProps {
  user: ShopUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (userId: string, status: 'active' | 'inactive') => Promise<void>;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onBlockUser: (userId: string, reason: string, duration?: number) => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
}

export function ShopUserDetailsModal({
  user,
  open,
  onOpenChange,
  onStatusChange,
  onBanUser,
  onBlockUser,
  onResetPassword
}: ShopUserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState(24);

  if (!user) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleStatusToggle = async () => {
    setIsLoading(true);
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await onStatusChange(user.id, newStatus);
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao alterar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      toast.error('Informe o motivo do banimento');
      return;
    }
    setIsLoading(true);
    try {
      await onBanUser(user.id, banReason);
      toast.success('Usuário banido permanentemente');
      setBanReason('');
    } catch (error) {
      toast.error('Erro ao banir usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }
    setIsLoading(true);
    try {
      await onBlockUser(user.id, blockReason, blockDuration);
      toast.success(`Usuário bloqueado por ${blockDuration} horas`);
      setBlockReason('');
    } catch (error) {
      toast.error('Erro ao bloquear usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      await onResetPassword(user.id);
      toast.success('E-mail de reset de senha enviado');
    } catch (error) {
      toast.error('Erro ao enviar reset de senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl text-gray-900">{user.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={user.status === 'active' ? 'default' : 'secondary'}
                  className={user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                >
                  {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                {user.email_verified && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Email Verificado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 border-b border-gray-200">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="info" 
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none"
              >
                <User className="w-4 h-4 mr-2" />
                Informações
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none"
              >
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none"
              >
                <Activity className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger 
                value="actions" 
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Ações
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-6">
              {/* Tab: Informações */}
              <TabsContent value="info" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-500">Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.phone || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-500">Datas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Cadastro</p>
                          <span className="text-gray-900">{formatDate(user.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Último Acesso</p>
                          <span className="text-gray-900">{formatDate(user.last_login_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-500">Endereço</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-500 text-sm">Nenhum endereço cadastrado</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-500">Verificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email</span>
                        {user.email_verified ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Telefone</span>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Não verificado
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Pedidos */}
              <TabsContent value="orders" className="mt-0">
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">Histórico de Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhum pedido encontrado</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Segurança */}
              <TabsContent value="security" className="mt-0 space-y-6">
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">Sessões Ativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Sessão Atual</p>
                            <p className="text-xs text-gray-500">Último acesso: {formatDate(user.last_login_at)}</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Ativa</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">Informações de Acesso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">IP do Último Acesso</span>
                      </div>
                      <span className="text-gray-900 font-mono text-sm">-</span>
                    </div>
                    <Separator className="bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Dispositivo</span>
                      </div>
                      <span className="text-gray-900 text-sm">-</span>
                    </div>
                    <Separator className="bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Última Troca de Senha</span>
                      </div>
                      <span className="text-gray-900 text-sm">-</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Logs */}
              <TabsContent value="logs" className="mt-0">
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">Logs de Atividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Activity className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Login realizado</p>
                          <p className="text-xs text-gray-500">{formatDate(user.last_login_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <User className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Conta criada</p>
                          <p className="text-xs text-gray-500">{formatDate(user.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Ações */}
              <TabsContent value="actions" className="mt-0 space-y-6">
                {/* Ações Rápidas */}
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={handleStatusToggle}
                        disabled={isLoading}
                        className={user.status === 'active' ? 'border-red-300 text-red-600 hover:bg-red-50 bg-white' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-white'}
                      >
                        {user.status === 'active' ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Desativar Conta
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Ativar Conta
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResetPassword}
                        disabled={isLoading}
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset de Senha
                      </Button>
                      <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver como Usuário
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloquear Temporariamente */}
                <Card className="border border-amber-300 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Bloquear Temporariamente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-amber-700">
                      Bloqueia o acesso do usuário por um período determinado.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Motivo</label>
                        <input
                          type="text"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900"
                          placeholder="Informe o motivo..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Duração (horas)</label>
                        <select
                          value={blockDuration}
                          onChange={(e) => setBlockDuration(Number(e.target.value))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value={1}>1 hora</option>
                          <option value={6}>6 horas</option>
                          <option value={12}>12 horas</option>
                          <option value={24}>24 horas</option>
                          <option value={48}>48 horas</option>
                          <option value={72}>72 horas</option>
                          <option value={168}>1 semana</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      onClick={handleBlock}
                      disabled={isLoading || !blockReason.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Bloquear por {blockDuration}h
                    </Button>
                  </CardContent>
                </Card>

                {/* Banir Permanentemente */}
                <Card className="border border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-base text-red-800 flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Banir Permanentemente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-red-700">
                      <strong>Atenção:</strong> Esta ação é irreversível. O usuário perderá acesso permanente à plataforma.
                    </p>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Motivo do Banimento</label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="Informe o motivo detalhado..."
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleBan}
                      disabled={isLoading || !banReason.trim()}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Banir Permanentemente
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
