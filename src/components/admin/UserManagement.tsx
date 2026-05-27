import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  TestTube, 
  CreditCard, 
  UserX,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Calendar,
  Crown,
  UserMinus,
  Shield,
  User,
  Trash2,
  Clock,
  MessageCircle,
  Key,
  Copy,
  XCircle,
  MailCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SubscriptionPeriodModal from '@/components/SubscriptionPeriodModal';
import UserDetailsInline from '@/components/admin/UserDetailsInline';
import { upsertSubscription } from '@/utils/subscriptionStorage';
import { ConfirmDeleteUserModal } from '@/components/admin/ConfirmDeleteUserModal';
import { SendMessageModal } from '@/components/admin/SendMessageModal';
import { PasswordResetModal } from '@/components/admin/PasswordResetModal';
import { useAuditLog } from '@/hooks/useAuditLog';

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
  profile_is_active: boolean; // Status da conta do usuário (profile.is_active)
  remaining_days: number | null;
  plan_display_name: string | null;
  user_status: 'active' | 'inactive';
  last_seen_at?: string | null;
  is_online?: boolean;
  status?: 'admin' | 'user';
  last_login_at?: string | null;
  session_duration?: number | null;
}

// User management with inline details view
export const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewingUserDetails, setViewingUserDetails] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);
  const [messageTargetUser, setMessageTargetUser] = useState<UserData | null>(null);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar assinaturas
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Mapear dados
      const userData = profiles?.map(profile => {
        const userSubscription = subscriptions?.find(sub => 
          sub.user_id === profile.id && sub.is_active
        );

        let subscriptionStatus: 'trial' | 'paid' | 'expired' | 'inactive' = 'inactive';
        let remainingDays: number | null = null;
        let planDisplayName: string | null = null;
        
        if (userSubscription) {
          const now = new Date();
          const expiresAt = new Date(userSubscription.expires_at);
          
          // Calcular dias restantes
          const diffTime = expiresAt.getTime() - now.getTime();
          remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (userSubscription.is_active && expiresAt > now) {
            subscriptionStatus = userSubscription.plan_type === 'trial' ? 'trial' : 'paid';
          } else {
            subscriptionStatus = 'expired';
            remainingDays = 0;
          }

          // Nome do plano para exibição
          switch (userSubscription.plan_type) {
            case 'trial':
              planDisplayName = 'Teste Grátis (7 dias)';
              break;
            case 'monthly':
              planDisplayName = 'Plano Mensal';
              break;
            case 'quarterly':
              planDisplayName = 'Plano Trimestral';
              break;
            case 'annual':
              planDisplayName = 'Plano Anual';
              break;
            default:
              planDisplayName = userSubscription.plan_type;
          }
        }

        const userStatus: 'active' | 'inactive' = 'active';

        return {
          id: profile.id,
          email: profile.email || 'N/A',
          name: profile.name,
          whatsapp: profile.whatsapp,
          created_at: profile.created_at,
          subscription_status: subscriptionStatus,
          subscription_type: userSubscription?.plan_type || null,
          expires_at: userSubscription?.expires_at || null,
          is_active: userSubscription?.is_active || false,
          profile_is_active: profile.is_active !== false, // Status da conta do profile
          remaining_days: remainingDays,
          plan_display_name: planDisplayName,
          user_status: userStatus,
          last_seen_at: profile.updated_at,
          is_online: false,
          status: profile.status || 'user',
          last_login_at: null,
          session_duration: null
        };
      }) || [];

      setUsers(userData);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (user: UserData) => {
    setMessageTargetUser(user);
    setSendMessageModalOpen(true);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (checked) {
      newSelectedUsers.add(userId);
    } else {
      newSelectedUsers.delete(userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(filteredUsers.map(user => user.id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) {
      toast({
        title: "Nenhum usuário selecionado",
        description: "Selecione pelo menos um usuário para executar a ação.",
        variant: "destructive",
      });
      return;
    }

    const selectedUsersList = Array.from(selectedUsers);
    
    try {
      switch (action) {
        case 'copy_data':
          await handleCopyUsersData(selectedUsersList);
          break;
        case 'activate_trial':
          await handleBulkActivateTrial(selectedUsersList);
          break;
        case 'deactivate_trial':
          await handleBulkDeactivateTrial(selectedUsersList);
          break;
        case 'deactivate_user':
          await handleBulkDeactivateUser(selectedUsersList);
          break;
        case 'delete_user':
          await handleBulkDeleteUser(selectedUsersList);
          break;
        default:
          break;
      }
      
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar a ação em lote.",
        variant: "destructive",
      });
    }
  };

  const handleBulkActivateTrial = async (userIds: string[]) => {
    const promises = userIds.map(async (userId) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return upsertSubscription({
        user_id: userId,
        is_active: true,
        plan_type: 'trial',
        expires_at: expiresAt.toISOString(),
        activated_at: now.toISOString(),
        activation_method: 'admin_manual',
        period_days: 7
      });
    });

    await Promise.all(promises);
    toast({
      title: "Testes ativados",
      description: `Teste grátis de 7 dias ativado para ${userIds.length} usuário(s).`,
    });
  };

  const handleBulkDeactivateTrial = async (userIds: string[]) => {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .in('user_id', userIds)
      .eq('plan_type', 'trial');

    if (error) throw error;

    toast({
      title: "Testes desativados",
      description: `Teste grátis desativado para ${userIds.length} usuário(s).`,
    });
  };

  const handleBulkDeactivateUser = async (userIds: string[]) => {
    toast({
      title: "Função em desenvolvimento",
      description: "A desativação em lote será implementada quando o campo correto for adicionado ao banco de dados.",
    });
  };

  const handleBulkDeleteUser = async (userIds: string[]) => {
    if (!confirm(`Tem certeza que deseja excluir ${userIds.length} usuário(s)? Esta ação não pode ser desfeita e excluirá todos os dados dos usuários.`)) {
      return;
    }

    try {
      await supabase
        .from('user_subscriptions')
        .delete()
        .in('user_id', userIds);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);

      if (error) throw error;

      toast({
        title: "Usuários excluídos",
        description: `${userIds.length} usuário(s) excluído(s) com sucesso.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuários.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUsersData = async (userIds: string[]) => {
    try {
      const selectedUsersData = users.filter(user => userIds.includes(user.id));
      
      let copyText = '';
      
      selectedUsersData.forEach((user, index) => {
        const firstName = user.name?.split(' ')[0] || 'Cliente';
        const whatsappNumber = user.whatsapp ? user.whatsapp.replace(/\D/g, '') : '';
        const whatsappLink = whatsappNumber 
          ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Oii, ${firstName} eu sou o Rick, responsável pelo sistema de Gestão XLata. Vi que você se cadastrou mas acredito que você não conseguiu usar nosso sistema como deveria, posso te ajudar com isso?`)}`
          : 'WhatsApp não cadastrado';
        
        copyText += `Nome cliente: ${user.name || 'Não informado'};\n`;
        copyText += `Email Cliente: ${user.email};\n`;
        copyText += `WhatsApp: ${whatsappLink};\n`;
        
        if (index < selectedUsersData.length - 1) {
          copyText += '\n';
        }
      });
      
      await navigator.clipboard.writeText(copyText);
      
      toast({
        title: "Dados copiados com sucesso!",
        description: `Dados de ${selectedUsersData.length} usuário(s) copiados para a área de transferência.`,
      });
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
      toast({
        title: "Erro ao copiar dados",
        description: "Não foi possível copiar os dados dos usuários.",
        variant: "destructive",
      });
    }
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    try {
      const newPassword = generateRandomPassword();
      
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      if (error) throw error;
      
      setResetPasswordData({
        email: userEmail,
        password: newPassword
      });
      setPasswordResetModalOpen(true);
      
      toast({
        title: "Senha resetada com sucesso",
        description: `Nova senha gerada para ${userEmail}`,
      });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro ao resetar senha",
        description: "Não foi possível resetar a senha do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmUserEmail = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-confirm-user', {
        body: { userId },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Email confirmado",
          description: `Email de ${userName} foi confirmado com sucesso.`,
        });
        fetchUsers();
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao confirmar email:', error);
      toast({
        title: "Erro ao confirmar email",
        description: error.message || "Não foi possível confirmar o email do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCopyWhatsAppUrl = (user: UserData) => {
    if (!user.whatsapp) {
      toast({
        title: "WhatsApp não cadastrado",
        description: `O usuário ${user.name || user.email} não possui WhatsApp cadastrado.`,
        variant: "destructive",
      });
      return;
    }

    let phone = user.whatsapp.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    const userName = user.name || user.email;
    const message = `Oi, *${userName}* tudo bem? 😊 Me chamo Rick, sou o responsável pelo XLata - Sistema para Reciclagem e Ferro Velho.\n\nVi aqui que você se cadastrou no XLata.site, nosso sistema de gestão pra ferro velho, e fiquei na dúvida se você conseguiu testar.\n\nChegou a usar ou acabou deixando pra depois?\n\nSe precisar eu te ajudo a colocar pra funcionar em poucos minutos.`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado!",
        description: `URL do WhatsApp de ${userName} copiada para a área de transferência.`,
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    });
  };

  const handleActivateTrial = async (userId: string, userName: string) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      await upsertSubscription({
        user_id: userId,
        is_active: true,
        plan_type: 'trial',
        expires_at: expiresAt.toISOString(),
        activated_at: now.toISOString(),
        activation_method: 'admin_manual',
        period_days: 7
      });

      toast({
        title: "Teste grátis ativado",
        description: `Teste de 7 dias ativado para ${userName}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao ativar teste grátis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o teste grátis.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateTrial = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('plan_type', 'trial');

      if (error) throw error;

      toast({
        title: "Teste desativado",
        description: `Teste grátis desativado para ${userName}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao desativar teste:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o teste.",
        variant: "destructive",
      });
    }
  };

  const handleClearTrialRecord = async (userId: string, userName: string) => {
    try {
      // Delete trial subscription records so the user can use trial again
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('plan_type', 'trial');

      if (error) throw error;

      toast({
        title: "✅ Registro de teste limpo",
        description: `Registro de teste de ${userName} foi removido. O usuário poderá usar o teste novamente.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao limpar registro de teste:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar o registro de teste.",
        variant: "destructive",
      });
    }
  };


  const handleRemoveSubscription = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Limpar caches locais e disparar evento de bloqueio
      localStorage.removeItem(`subscription_${userId}`);
      localStorage.removeItem(`user_subscription_${userId}`);
      localStorage.removeItem(`subscription_status_${userId}`);
      window.dispatchEvent(new CustomEvent('subscriptionCleared', { detail: { userId } }));
      window.dispatchEvent(new CustomEvent('adminSubscriptionDeactivated', { detail: { userId } }));

      toast({ title: "Plano removido", description: `Plano de ${userName} removido com sucesso.` });
      fetchUsers();
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      toast({ title: "Erro", description: "Não foi possível remover o plano.", variant: "destructive" });
    }
  };

  const handleActivateSubscription = (user: UserData) => {
    setSelectedUser(user);
    setSubscriptionModalOpen(true);
  };

  const handleViewUserDetails = (user: UserData) => {
    setSelectedUser(user);
    setViewingUserDetails(true);
  };

  const handleMakeAdmin = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'admin' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário promovido",
        description: `${userName} agora é um administrador.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível promover o usuário a administrador.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async (userId: string, userName: string, currentUserId: string) => {
    if (userId === currentUserId) {
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
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Privilégios removidos",
        description: `${userName} não é mais um administrador.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao remover privilégios de admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover os privilégios de administrador.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário desativado",
        description: `${userName} foi desativado. O usuário deve entrar em contato com o suporte para reativar a conta.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, deactivated_at: null })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário ativado",
        description: `${userName} foi reativado com sucesso.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleSubscriptionConfirm = async (days: number, tier?: string) => {
    if (!selectedUser) return;

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      let planType: 'monthly' | 'quarterly' | 'annual' = 'monthly';
      if (days === 90) planType = 'quarterly';
      if (days === 365) planType = 'annual';

      await upsertSubscription({
        user_id: selectedUser.id,
        is_active: true,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
        activated_at: now.toISOString(),
        activation_method: 'admin_manual',
        period_days: days,
        tier: tier || 'pro'
      });

      toast({
        title: "Assinatura ativada",
        description: `Assinatura de ${days} dias ativada com sucesso para ${selectedUser.name || selectedUser.email}.`,
      });

      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao ativar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar a assinatura.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (user: UserData) => {
    const status = user.subscription_status;
    let badge;
    let daysInfo = '';
    
    switch (status) {
      case 'trial':
        badge = <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">Teste</Badge>;
        if (user.remaining_days !== null && user.remaining_days > 0) {
          daysInfo = `${user.remaining_days}d restantes`;
        }
        break;
      case 'paid':
        badge = <Badge className="bg-green-600 text-white text-xs px-2 py-0.5">Ativo</Badge>;
        if (user.remaining_days !== null && user.remaining_days > 0) {
          daysInfo = `${user.remaining_days}d restantes`;
        }
        break;
      case 'expired':
        badge = <Badge variant="destructive" className="text-xs px-2 py-0.5">Expirado</Badge>;
        break;
      default:
        badge = <Badge variant="outline" className="text-xs px-2 py-0.5">Inativo</Badge>;
    }
    
    return (
      <div className="flex flex-col gap-0.5">
        {badge}
        {daysInfo && <span className="text-xs text-muted-foreground">{daysInfo}</span>}
      </div>
    );
  };

  const getLastActivityInfo = (user: UserData) => {
    const lastActivity = user.last_seen_at || user.created_at;
    const lastDate = new Date(lastActivity);
    const now = new Date();
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `${diffDays}d`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h`;
    } else {
      timeAgo = `${diffMinutes}min`;
    }

    return <span className="text-sm text-muted-foreground">{timeAgo}</span>;
  };

  const getPlanName = (user: UserData) => {
    if (user.subscription_type === 'monthly') return 'Mensal';
    if (user.subscription_type === 'quarterly') return 'Trimestral';
    if (user.subscription_type === 'annual') return 'Anual';
    if (user.subscription_type === 'trial') return 'Teste';
    return '-';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    trial: users.filter(u => u.subscription_status === 'trial').length,
    paid: users.filter(u => u.subscription_status === 'paid').length,
    inactive: users.filter(u => u.subscription_status === 'inactive').length,
    online: 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (viewingUserDetails && selectedUser) {
    return (
      <UserDetailsInline
        user={selectedUser}
        onBack={() => { setViewingUserDetails(false); setSelectedUser(null); }}
        onRefresh={fetchUsers}
      />
    );
  }

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
    setConfirmDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userToDelete.id);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `${userToDelete.name || userToDelete.email} foi excluído com sucesso.`,
      });

      setConfirmDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Estatísticas - Layout mais compacto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Em Teste</p>
                <p className="text-xl font-bold text-blue-400">{stats.trial}</p>
              </div>
              <TestTube className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pagantes</p>
                <p className="text-xl font-bold text-green-400">{stats.paid}</p>
              </div>
              <CreditCard className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Inativos</p>
                <p className="text-xl font-bold text-red-400">{stats.inactive}</p>
              </div>
              <UserX className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca - Mais compacto */}
      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">Todos</option>
              <option value="trial">Teste</option>
              <option value="paid">Pago</option>
              <option value="expired">Expirado</option>
              <option value="inactive">Inativo</option>
            </select>

            {selectedUsers.size > 0 && (
              <Select onValueChange={handleBulkAction}>
                <SelectTrigger className="w-36 h-8 text-sm bg-blue-600 border-blue-500 text-white">
                  <SelectValue placeholder={`Ações (${selectedUsers.size})`} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="copy_data" className="text-foreground hover:bg-muted text-sm">
                    <Copy className="h-3 w-3 inline mr-1" />
                    Copiar
                  </SelectItem>
                  <SelectItem value="activate_trial" className="text-foreground hover:bg-muted text-sm">
                    Ativar Teste
                  </SelectItem>
                  <SelectItem value="deactivate_trial" className="text-foreground hover:bg-muted text-sm">
                    Desativar Teste
                  </SelectItem>
                  <SelectItem value="delete_user" className="text-foreground hover:bg-muted text-sm text-red-400">
                    Excluir
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button 
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:bg-muted bg-transparent h-8"
            >
              Atualizar
            </Button>

            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filteredUsers.length} usuários
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="rounded-lg border-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30">
                  <TableHead className="w-10 py-3 text-muted-foreground">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="border-muted-foreground"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3">Usuário</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3 hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3 w-28 hidden lg:table-cell">Plano</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3 w-32">Status</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3 w-20 hidden md:table-cell">Ativ.</TableHead>
                  <TableHead className="text-muted-foreground text-sm font-medium py-3 text-right w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  return (
                    <TableRow key={user.id} className="border-border hover:bg-muted/30">
                      <TableCell className="py-2">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          className="border-muted-foreground"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-foreground text-sm font-medium bg-muted shrink-0">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {user.name || 'Sem nome'}
                            </span>
                            {user.status === 'admin' && (
                              <Badge className="bg-pink-600 text-white text-[10px] px-1.5 py-0">ADM</Badge>
                            )}
                            {user.whatsapp && (
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </TableCell>
                      <TableCell className="py-2 hidden lg:table-cell">
                        <span className="text-sm text-foreground">{getPlanName(user)}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell className="py-2 hidden md:table-cell">
                        {getLastActivityInfo(user)}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => handleViewUserDetails(user)}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleSendMessage(user)}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-600/10"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleCopyWhatsAppUrl(user)}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10"
                            title="Copiar link WhatsApp"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-border">
                              <DropdownMenuItem 
                                onClick={() => handleActivateSubscription(user)}
                                className="text-foreground hover:bg-muted cursor-pointer"
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Ativar Plano
                              </DropdownMenuItem>

                              {/* Ativar/Desativar Teste Grátis */}
                              {user.subscription_status === 'inactive' || user.subscription_status === 'expired' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleActivateTrial(user.id, user.name || user.email)}
                                  className="text-blue-400 hover:bg-muted cursor-pointer"
                                >
                                  <TestTube className="h-4 w-4 mr-2" />
                                  Ativar Teste 7 Dias
                                </DropdownMenuItem>
                              ) : user.subscription_status === 'trial' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateTrial(user.id, user.name || user.email)}
                                  className="text-orange-400 hover:bg-muted cursor-pointer"
                                >
                                  <TestTube className="h-4 w-4 mr-2" />
                                  Desativar Teste
                                </DropdownMenuItem>
                              ) : null}

                              {(user.subscription_status === 'paid' || user.subscription_status === 'trial') && (
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveSubscription(user.id, user.name || user.email)}
                                  className="text-red-400 hover:bg-muted cursor-pointer"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Remover Plano
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => handleResetPassword(user.id, user.email)}
                                className="text-foreground hover:bg-muted cursor-pointer"
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Resetar Senha
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => handleConfirmUserEmail(user.id, user.name || user.email)}
                                className="text-emerald-400 hover:bg-muted cursor-pointer"
                              >
                                <MailCheck className="h-4 w-4 mr-2" />
                                Confirmar Email
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => handleClearTrialRecord(user.id, user.name || user.email)}
                                className="text-amber-400 hover:bg-muted cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpar Registro Teste
                              </DropdownMenuItem>

                              {user.status !== 'admin' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleMakeAdmin(user.id, user.name || user.email)}
                                  className="text-foreground hover:bg-muted cursor-pointer"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Tornar Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveAdmin(user.id, user.name || user.email, '')}
                                  className="text-foreground hover:bg-muted cursor-pointer"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Remover Admin
                                </DropdownMenuItem>
                              )}
                              
                              {/* Ativar/Desativar Conta do Usuário */}
                              {user.profile_is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => handleDeactivateUser(user.id, user.name || user.email)}
                                  className="text-yellow-400 hover:bg-muted cursor-pointer"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Desativar Conta
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleActivateUser(user.id, user.name || user.email)}
                                  className="text-green-400 hover:bg-muted cursor-pointer"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Reativar Conta
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-400 hover:bg-muted cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <SubscriptionPeriodModal 
        open={subscriptionModalOpen}
        onOpenChange={(open) => {
          setSubscriptionModalOpen(open);
          if (!open) setSelectedUser(null);
        }}
        onConfirm={handleSubscriptionConfirm}
        userName={selectedUser?.name || selectedUser?.email || 'Usuário'}
        userId={selectedUser?.id}
      />


      {userToDelete && (
        <ConfirmDeleteUserModal
          open={confirmDeleteModalOpen}
          onOpenChange={setConfirmDeleteModalOpen}
          onConfirm={confirmDeleteUser}
          userName={userToDelete.name || ''}
          userEmail={userToDelete.email}
        />
      )}

      {messageTargetUser && (
        <SendMessageModal
          open={sendMessageModalOpen}
          onOpenChange={setSendMessageModalOpen}
          targetUserId={messageTargetUser.id}
          targetUserName={messageTargetUser.name || messageTargetUser.email}
        />
      )}

      {resetPasswordData && (
        <PasswordResetModal
          open={passwordResetModalOpen}
          onOpenChange={setPasswordResetModalOpen}
          email={resetPasswordData.email}
          password={resetPasswordData.password}
        />
      )}
    </div>
  );
};
