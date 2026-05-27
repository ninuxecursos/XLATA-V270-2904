import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Phone, Calendar, Clock, CheckCircle, XCircle,
  Shield, Ban, AlertTriangle, RotateCcw, MapPin, ShoppingBag,
  Globe, Monitor, Activity, Key, Lock, Eye, ArrowLeft
} from 'lucide-react';
import { ShopUser } from '@/hooks/useShopUsers';
import { toast } from 'sonner';

interface ShopUserDetailsInlineProps {
  user: ShopUser;
  onBack: () => void;
  onStatusChange: (userId: string, status: 'active' | 'inactive') => Promise<void>;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onBlockUser: (userId: string, reason: string, duration?: number) => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
}

export function ShopUserDetailsInline({
  user,
  onBack,
  onStatusChange,
  onBanUser,
  onBlockUser,
  onResetPassword
}: ShopUserDetailsInlineProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState(24);

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'inactive':
        return { label: 'Inativo', className: 'bg-gray-100 text-gray-600 border-gray-200' };
      case 'blocked':
        return { label: 'Bloqueado', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'banned':
        return { label: 'Banido', className: 'bg-red-100 text-red-700 border-red-200' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const statusConfig = getStatusConfig(user.status);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 h-9 px-3"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para lista
      </Button>

      {/* Header Card */}
      <div className="shop-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200 flex-shrink-0">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-xl font-bold text-gray-900 truncate">{user.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                  {user.email_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Desde {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="shop-card overflow-hidden">
          <div className="border-b border-gray-100 px-1">
            <TabsList className="bg-transparent border-0 p-0 h-auto w-full justify-start gap-0">
              {[
                { value: 'info', label: 'Informações', icon: User },
                { value: 'orders', label: 'Pedidos', icon: ShoppingBag },
                { value: 'security', label: 'Segurança', icon: Shield },
                { value: 'logs', label: 'Logs', icon: Activity },
                { value: 'actions', label: 'Ações', icon: AlertTriangle },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="p-5 sm:p-6">
            {/* Tab: Informações */}
            <TabsContent value="info" className="mt-0 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contato</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Telefone</p>
                        <p className="text-sm font-medium text-gray-900">{user.phone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Datas</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Cadastro</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Último Acesso</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(user.last_login_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Endereço</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Endereço principal</p>
                      <p className="text-sm text-gray-500 italic">Nenhum endereço cadastrado</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Verificação</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      {user.email_verified ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3 mr-1" />
                          Pendente
                        </span>
                      )}
                    </div>
                    <Separator className="bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Telefone</span>
                      <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                        Não verificado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Pedidos */}
            <TabsContent value="orders" className="mt-0">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Histórico de Pedidos</h4>
                <div className="text-center py-10 text-gray-500">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-600">Nenhum pedido encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">Os pedidos deste usuário aparecerão aqui</p>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Segurança */}
            <TabsContent value="security" className="mt-0 space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Sessões Ativas</h4>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <Monitor className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sessão Atual</p>
                      <p className="text-xs text-gray-500">Último acesso: {formatDate(user.last_login_at)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Ativa</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Informações de Acesso</h4>
                <div className="space-y-0 divide-y divide-gray-100">
                  {[
                    { icon: Globe, label: 'IP do Último Acesso', value: '-', mono: true },
                    { icon: Monitor, label: 'Dispositivo', value: '-' },
                    { icon: Key, label: 'Última Troca de Senha', value: '-' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className={`text-sm text-gray-900 ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Logs */}
            <TabsContent value="logs" className="mt-0">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Logs de Atividade</h4>
                <div className="space-y-2.5">
                  {[
                    { icon: Activity, color: 'text-emerald-500 bg-emerald-50', label: 'Login realizado', date: user.last_login_at },
                    { icon: User, color: 'text-blue-500 bg-blue-50', label: 'Conta criada', date: user.created_at },
                  ].map((log, i) => {
                    const Icon = log.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${log.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.label}</p>
                          <p className="text-xs text-gray-500">{formatDate(log.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Ações */}
            <TabsContent value="actions" className="mt-0 space-y-5">
              {/* Ações Rápidas */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Ações Rápidas</h4>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleStatusToggle}
                    disabled={isLoading}
                    className={user.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50 bg-white' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white'}
                  >
                    {user.status === 'active' ? (
                      <><XCircle className="w-4 h-4 mr-2" />Desativar Conta</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" />Ativar Conta</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset de Senha
                  </Button>
                  <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver como Usuário
                  </Button>
                </div>
              </div>

              {/* Bloquear Temporariamente */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                <h4 className="text-base font-semibold text-amber-800 flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4" />
                  Bloquear Temporariamente
                </h4>
                <p className="text-sm text-amber-700 mb-4">
                  Bloqueia o acesso do usuário por um período determinado.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Motivo</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 text-sm"
                      placeholder="Informe o motivo..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duração (horas)</label>
                    <select
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 text-sm"
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
              </div>

              {/* Banir Permanentemente */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
                <h4 className="text-base font-semibold text-red-800 flex items-center gap-2 mb-3">
                  <Ban className="w-4 h-4" />
                  Banir Permanentemente
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  <strong>Atenção:</strong> Esta ação é irreversível. O usuário perderá acesso permanente à plataforma.
                </p>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Motivo do Banimento</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 text-sm"
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
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
