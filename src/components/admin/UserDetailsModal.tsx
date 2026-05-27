
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Mail, Calendar, CreditCard, Clock, Shield, Activity, Info, BarChart3, Trash2, Download, Phone, MessageCircle, ChevronDown, Copy, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteUserModal } from '@/components/admin/ConfirmDeleteUserModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  whatsapp?: string | null;
  created_at: string;
  subscription_status: 'trial' | 'paid' | 'expired' | 'inactive';
  subscription_type: string | null;
  expires_at: string | null;
  is_active: boolean;
  remaining_days: number | null;
  plan_display_name: string | null;
  user_status: 'active' | 'inactive';
  status?: 'admin' | 'user'; // Add this optional property for admin status
}

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const navigate = useNavigate();
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge variant="secondary" className="bg-[#33cfff] text-white hover:bg-[#33cfff]/80">Teste Grátis</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Assinatura Paga</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">Inativo</Badge>;
    }
  };

  const getUserStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Desativado</Badge>
    );
  };

  const getRemainingDaysDisplay = (days: number | null, status: string) => {
    if (days === null || status === 'inactive') return null;
    
    if (days <= 0) {
      return <span className="text-red-400 font-medium">Expirado</span>;
    }
    
    return <span className="text-yellow-500 font-medium">{days} dias restantes</span>;
  };

  const handleDashboardAccess = () => {
    // Navigate to dashboard with user context
    navigate('/dashboard', { 
      state: { 
        adminViewingUser: user.id,
        adminViewingUserName: user.name || user.email 
      } 
    });
    onOpenChange(false);
  };

  const handleBackupUserData = async () => {
    try {
      toast({
        title: "Preparando backup...",
        description: "Coletando dados do usuário...",
      });

      // Buscar todos os dados do usuário
      const [
        { data: profile },
        { data: subscriptions },
        { data: customers },
        { data: materials },
        { data: orders },
        { data: orderItems },
        { data: cashRegisters },
        { data: cashTransactions }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id),
        supabase.from('customers').select('*').eq('user_id', user.id),
        supabase.from('materials').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('order_items').select('*').eq('user_id', user.id),
        supabase.from('cash_registers').select('*').eq('user_id', user.id),
        supabase.from('cash_transactions').select('*').eq('user_id', user.id)
      ]);

      const backupData = {
        backup_info: {
          user_id: user.id,
          user_email: user.email,
          user_name: user.name,
          backup_date: new Date().toISOString(),
          backup_version: '1.0'
        },
        profile: profile,
        subscriptions: subscriptions || [],
        customers: customers || [],
        materials: materials || [],
        orders: orders || [],
        order_items: orderItems || [],
        cash_registers: cashRegisters || [],
        cash_transactions: cashTransactions || []
      };

      // Criar e baixar arquivo JSON
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_usuario_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup concluído",
        description: `Backup dos dados de ${user.name || user.email} baixado com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      toast({
        title: "Erro no backup",
        description: "Não foi possível fazer o backup dos dados.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = () => {
    setShowBackupPrompt(true);
  };

  const handleDeleteWithoutBackup = () => {
    setShowBackupPrompt(false);
    setConfirmDeleteModalOpen(true);
  };

  const handleBackupAndDelete = async () => {
    await handleBackupUserData();
    setShowBackupPrompt(false);
    setConfirmDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      // Delete user subscriptions first
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Delete user profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `${user.name || user.email} foi excluído com sucesso.`,
      });

      onOpenChange(false);
      // You might want to redirect or refresh the parent component
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      });
    }
  };

  const handleMakeAdmin = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'admin' })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário promovido",
        description: `${user.name || user.email} agora é um administrador.`,
      });

      // Refresh user data or close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível promover o usuário a administrador.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async () => {
    // Verificar se é o próprio admin tentando remover seu status
    const { data: currentUser } = await supabase.auth.getUser();
    const currentUserId = currentUser.user?.id;

    if (user.id === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover seu próprio status de administrador.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'user' })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Privilégios removidos",
        description: `${user.name || user.email} não é mais um administrador.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao remover privilégios de admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover os privilégios de administrador.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário desativado",
        description: `${user.name || user.email} foi desativado. O usuário deve entrar em contato com o suporte para reativar a conta.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleActivateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, deactivated_at: null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário ativado",
        description: `${user.name || user.email} foi reativado com sucesso.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o usuário.",
        variant: "destructive",
      });
    }
  };

  const getFirstName = (fullName: string | null) => {
    if (!fullName) return 'Usuário';
    return fullName.split(' ')[0];
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar.",
        variant: "destructive",
      });
    });
  };

  const handleWhatsAppMessage = (messageType: string) => {
    if (!user.whatsapp) {
      toast({
        title: "WhatsApp não informado",
        description: "O usuário não possui um número de WhatsApp cadastrado.",
        variant: "destructive",
      });
      return;
    }

    const firstName = getFirstName(user.name);
    let message = '';

    switch (messageType) {
      case 'option1':
        message = `Olá! ${firstName} Tudo certo? Vi que você se cadastrou no sistema Xlata, mas ainda não ativou o teste gratuito. Posso te ajudar com qualquer dúvida ou dificuldade que tenha surgido. Quer uma ajuda pra começar? 🚀`;
        break;
      case 'option2':
        message = `Oii, ${firstName}. Notei que você criou uma conta no Xlata, mas talvez não tenha conseguido usar ainda. Se precisar de ajuda pra entender como funciona ou quiser tirar alguma dúvida, tô por aqui! 😉`;
        break;
      case 'option3':
        message = `Oii, ${firstName}. Aqui é do sistema Xlata 😊 Vi que você se registrou, mas ainda não iniciou o uso da plataforma. Aconteceu algo? Estamos disponíveis pra te ajudar a começar, tirar dúvidas ou até fazer uma demonstração, se quiser. Só me chamar!`;
        break;
      default:
        return;
    }

    // Remove caracteres especiais do número para o formato wa.me
    const phoneNumber = user.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getWhatsAppLink = (messageType: string) => {
    if (!user.whatsapp) return '';
    
    const firstName = getFirstName(user.name);
    let message = '';

    switch (messageType) {
      case 'option1':
        message = `Olá! ${firstName} Tudo certo? Vi que você se cadastrou no sistema Xlata, mas ainda não ativou o teste gratuito. Posso te ajudar com qualquer dúvida ou dificuldade que tenha surgido. Quer uma ajuda pra começar? 🚀`;
        break;
      case 'option2':
        message = `Oii, ${firstName}. Notei que você criou uma conta no Xlata, mas talvez não tenha conseguido usar ainda. Se precisar de ajuda pra entender como funciona ou quiser tirar alguma dúvida, tô por aqui! 😉`;
        break;
      case 'option3':
        message = `Oii, ${firstName}. Aqui é do sistema Xlata 😊 Vi que você se registrou, mas ainda não iniciou o uso da plataforma. Aconteceu algo? Estamos disponíveis pra te ajudar a começar, tirar dúvidas ou até fazer uma demonstração, se quiser. Só me chamar!`;
        break;
      default:
        return '';
    }

    const phoneNumber = user.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="w-screen h-screen max-w-none max-h-none bg-gray-800 border-gray-700 overflow-hidden flex flex-col rounded-none"
          hideCloseButton={true}
        >
          <DialogHeader className="flex flex-row items-center justify-between pr-6 border-b border-gray-700 pb-4">
            <DialogTitle className="text-white flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {user.name || 'Usuário sem nome'}
                  {getUserStatusBadge(user.user_status)}
                  {!user.is_active && (
                    <Badge variant="destructive">Desativado</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 font-normal">{user.email}</p>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <span className="text-lg">×</span>
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Informações Básicas */}
              <div className="space-y-6">
                {/* Informações Pessoais */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Nome Completo</label>
                        <p className="text-white font-medium">{user.name || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Status</label>
                        {getUserStatusBadge(user.user_status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Email</label>
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-white">{user.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                          className="h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Copy className="h-4 w-4 text-gray-300" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">WhatsApp</label>
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-white">{user.whatsapp || 'Não informado'}</p>
                        </div>
                        {user.whatsapp && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 border-green-600 text-white flex items-center gap-2"
                              >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80 bg-gray-800 border-gray-700">
                              <DropdownMenuItem
                                onClick={() => handleWhatsAppMessage('option1')}
                                className="text-gray-200 hover:bg-gray-700 cursor-pointer p-3"
                              >
                                <div className="flex items-center justify-between flex-1">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Primeira mensagem</span>
                                    <span className="text-xs text-gray-400">Sobre teste gratuito não ativado</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(getWhatsAppLink('option1'), 'Link');
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-gray-600 ml-2"
                                  >
                                    <Link className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleWhatsAppMessage('option2')}
                                className="text-gray-200 hover:bg-gray-700 cursor-pointer p-3"
                              >
                                <div className="flex items-center justify-between flex-1">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Segunda mensagem</span>
                                    <span className="text-xs text-gray-400">Oferta de ajuda casual</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(getWhatsAppLink('option2'), 'Link');
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-gray-600 ml-2"
                                  >
                                    <Link className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleWhatsAppMessage('option3')}
                                className="text-gray-200 hover:bg-gray-700 cursor-pointer p-3"
                              >
                                <div className="flex items-center justify-between flex-1">
                                  <div className="flex flex-col">
                                    <span className="font-medium">Terceira mensagem</span>
                                    <span className="text-xs text-gray-400">Demonstração e suporte</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(getWhatsAppLink('option3'), 'Link');
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-gray-600 ml-2"
                                  >
                                    <Link className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">ID do Usuário</label>
                      <p className="text-xs font-mono text-gray-300 bg-gray-800 p-2 rounded border">{user.id}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <Button 
                        onClick={handleDashboardAccess}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Acessar Dashboard do Usuário
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Cadastro */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                      Histórico de Cadastro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Data de Cadastro</label>
                        <p className="text-white">
                          {new Date(user.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Horário</label>
                        <p className="text-white">
                          {new Date(user.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Tempo de Cadastro</label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-white">
                          {Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita - Assinatura */}
              <div className="space-y-6">
                {/* Status da Assinatura */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-400" />
                      Status da Assinatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <span className="text-gray-300">Status Atual</span>
                      {getStatusBadge(user.subscription_status)}
                    </div>
                    
                    {user.plan_display_name && (
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                        <span className="text-gray-300">Plano</span>
                        <span className="text-white font-medium">{user.plan_display_name}</span>
                      </div>
                    )}

                    {user.expires_at && user.subscription_status !== 'inactive' && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <span className="text-gray-300">Data de Expiração</span>
                          <span className="text-white">
                            {new Date(user.expires_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {user.remaining_days !== null && (
                          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <span className="text-gray-300">Tempo Restante</span>
                            {getRemainingDaysDisplay(user.remaining_days, user.subscription_status)}
                          </div>
                        )}
                      </>
                    )}

                    {user.subscription_status === 'inactive' && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Info className="h-4 w-4" />
                          <p className="text-sm">
                            Este usuário não possui nenhuma assinatura ativa no momento.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações Técnicas */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-400" />
                      Detalhes Técnicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Tipo de Assinatura</label>
                        <p className="text-white">{user.subscription_type || 'Nenhuma'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Assinatura Ativa</label>
                        <Badge variant={user.is_active ? "default" : "secondary"} className={user.is_active ? "bg-green-600" : ""}>
                          {user.is_active ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-400" />
                      Ações Administrativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="bg-blue-700 border-blue-600 text-white hover:bg-blue-600">
                        Ativar Plano
                      </Button>
                      
                      {user.status !== 'admin' ? (
                        <Button 
                          onClick={handleMakeAdmin}
                          variant="outline" 
                          size="sm" 
                          className="bg-purple-700 border-purple-600 text-white hover:bg-purple-600"
                        >
                          Tornar Admin
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleRemoveAdmin}
                          variant="outline" 
                          size="sm" 
                          className="bg-purple-700 border-purple-600 text-white hover:bg-purple-600"
                        >
                          Remover Admin
                        </Button>
                      )}
                      
                      <Button 
                        onClick={handleBackupUserData}
                        variant="outline" 
                        size="sm" 
                        className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Backup
                      </Button>
                      
                      {user.is_active ? (
                        <Button 
                          onClick={handleDeactivateUser}
                          variant="outline" 
                          size="sm" 
                          className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                        >
                          Desativar Usuário
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleActivateUser}
                          variant="outline" 
                          size="sm" 
                          className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                        >
                          Ativar Usuário
                        </Button>
                      )}
                      
                      <Button 
                        onClick={handleDeleteUser}
                        variant="outline" 
                        size="sm" 
                        className="bg-red-800 border-red-700 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir Usuário
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de backup antes da exclusão */}
      <Dialog open={showBackupPrompt} onOpenChange={setShowBackupPrompt}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-yellow-500" />
              Fazer Backup dos Dados?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Deseja fazer backup dos dados de <strong className="text-white">{user.name || user.email}</strong> antes de excluir?
            </p>
            <p className="text-sm text-yellow-400">
              ⚠️ O backup incluirá todos os dados do usuário: perfil, assinaturas, clientes, materiais, pedidos, caixa e transações.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowBackupPrompt(false)}
                variant="outline"
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteWithoutBackup}
                variant="outline"
                className="bg-red-700 border-red-600 text-white hover:bg-red-600"
              >
                Excluir sem Backup
              </Button>
              <Button
                onClick={handleBackupAndDelete}
                variant="outline"
                className="bg-green-700 border-green-600 text-white hover:bg-green-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Fazer Backup e Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteUserModal
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
        onConfirm={confirmDeleteUser}
        userName={user.name || 'Usuário sem nome'}
        userEmail={user.email}
      />
    </>
  );
};

export default UserDetailsModal;
