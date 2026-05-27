import { useState, useMemo } from 'react';
import { 
  User, Mail, Phone, Calendar, CheckCircle, XCircle, 
  Ban, Lock, Shield, AlertTriangle, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useShopUsers } from '@/hooks/useShopUsers';
import { useShopUserManagement } from '@/hooks/useShopUserManagement';
import { ShopUserDetailsInline } from './users/ShopUserDetailsInline';
import { ShopUserFilters } from './users/ShopUserFilters';
import { ShopUser } from '@/hooks/useShopUsers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ShopUsersManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<ShopUser | null>(null);
  
  const { data: users = [], isLoading } = useShopUsers();
  const { updateStatus, banUser, blockUser, resetPassword } = useShopUserManagement();

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm));
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(user.status);
      const matchesVerified = verifiedFilter === null || user.email_verified === verifiedFilter;
      return matchesSearch && matchesStatus && matchesVerified;
    });
  }, [users, searchTerm, statusFilter, verifiedFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    blocked: users.filter(u => u.status === 'blocked' || u.status === 'banned').length,
    verified: users.filter(u => u.email_verified).length
  }), [users]);

  const handleStatusChange = async (userId: string, status: 'active' | 'inactive') => {
    await updateStatus.mutateAsync({ userId, status });
  };

  const handleBanUser = async (userId: string, reason: string) => {
    await banUser.mutateAsync({ userId, reason });
    setSelectedUser(null);
  };

  const handleBlockUser = async (userId: string, reason: string, durationHours: number = 24) => {
    await blockUser.mutateAsync({ userId, reason, durationHours });
    setSelectedUser(null);
  };

  const handleResetPassword = async (userId: string) => {
    await resetPassword.mutateAsync(userId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium";
    switch (status) {
      case 'active':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Ativo</span>;
      case 'inactive':
        return <span className={`${baseClass} bg-gray-100 text-gray-600`}>Inativo</span>;
      case 'blocked':
        return <span className={`${baseClass} bg-amber-100 text-amber-700`}>Bloqueado</span>;
      case 'banned':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Banido</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  // If a user is selected, show inline details
  if (selectedUser) {
    return (
      <div className="p-4 lg:p-6">
        <ShopUserDetailsInline
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
          onStatusChange={handleStatusChange}
          onBanUser={handleBanUser}
          onBlockUser={handleBlockUser}
          onResetPassword={handleResetPassword}
        />
      </div>
    );
  }

  return (
     <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="shop-cms-page-title">Usuários da Loja</h1>
           <p className="shop-cms-page-subtitle">Gerencie os usuários cadastrados na loja</p>
        </div>
         <Button variant="outline" className="shop-btn-outline h-9 px-3">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
       <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
               <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Ativos</p>
               <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-500" />
              </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Inativos</p>
               <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Bloqueados</p>
               <p className="text-xl font-bold text-gray-900">{stats.blocked}</p>
              </div>
            </div>
         </div>

         <div className="shop-card p-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wide">Verificados</p>
               <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
         </div>
      </div>

      {/* Filters */}
      <ShopUserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        verifiedFilter={verifiedFilter}
        onVerifiedFilterChange={setVerifiedFilter}
      />

      {/* Users Table */}
       <div className="shop-card overflow-hidden">
         <div className="px-4 py-4 sm:px-5 border-b border-gray-100 flex items-center justify-between">
           <h2 className="font-semibold text-gray-900">Lista de Usuários</h2>
          <span className="text-sm text-gray-500">
            {filteredUsers.length} de {users.length} usuários
          </span>
         </div>
         
          {isLoading ? (
           <div className="p-8 text-center">
             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
             <p className="text-gray-500 text-sm">Carregando usuários...</p>
           </div>
          ) : filteredUsers.length === 0 ? (
           <div className="shop-empty-state py-12">
             <User className="shop-empty-state-icon" />
             <p className="shop-empty-state-title">Nenhum usuário encontrado</p>
             <p className="shop-empty-state-description">
               {searchTerm ? 'Tente uma busca diferente.' : 'Quando clientes se cadastrarem, eles aparecerão aqui.'}
             </p>
            </div>
          ) : (
           <>
             {/* Desktop Table */}
             <div className="hidden lg:block overflow-x-auto">
               <table className="shop-table w-full">
                 <thead>
                   <tr>
                     <th>Usuário</th>
                     <th>Contato</th>
                     <th>Cadastro</th>
                     <th>Último Acesso</th>
                     <th>Status</th>
                     <th className="w-16 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody>
                  {filteredUsers.map((user) => (
                     <tr 
                       key={user.id} 
                       className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                       onClick={() => setSelectedUser(user)}
                     >
                       <td>
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                           <div className="min-w-0">
                            <p className="font-medium text-gray-900">{user.name}</p>
                              {user.email_verified && (
                                <TooltipProvider>
                                  <Tooltip>
                                     <TooltipTrigger asChild>
                                       <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline ml-1" />
                                     </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Email verificado</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                          </div>
                        </div>
                       </td>
                       <td>
                         <div className="space-y-0.5">
                           <p className="text-sm text-gray-900">{user.email}</p>
                          {user.phone && (
                             <p className="text-xs text-gray-500">{user.phone}</p>
                          )}
                        </div>
                       </td>
                       <td>
                         <span className="text-sm text-gray-600">
                          {formatDate(user.created_at)}
                         </span>
                       </td>
                       <td>
                         <span className="text-sm text-gray-500">
                          {formatDate(user.last_login_at)}
                        </span>
                       </td>
                       <td>
                        {getStatusBadge(user.status)}
                       </td>
                       <td className="text-right">
                         <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {user.status === 'active' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(user.id, 'inactive')}
                                    disabled={updateStatus.isPending}
                                     className="h-8 w-8 p-0 hover:bg-amber-50"
                                  >
                                    <Lock className="w-4 h-4 text-amber-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Desativar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : user.status === 'inactive' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(user.id, 'active')}
                                    disabled={updateStatus.isPending}
                                     className="h-8 w-8 p-0 hover:bg-emerald-50"
                                  >
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ativar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 cursor-not-allowed"
                                    disabled
                                  >
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Usuário {user.status}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                       </td>
                     </tr>
                  ))}
                 </tbody>
               </table>
            </div>
             
             {/* Mobile List */}
             <div className="lg:hidden divide-y divide-gray-100">
               {filteredUsers.map((user) => (
                 <div 
                   key={user.id} 
                   className="p-4 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                   onClick={() => setSelectedUser(user)}
                 >
                   <div className="flex items-start justify-between gap-3 mb-2">
                     <div className="flex items-center gap-3 min-w-0 flex-1">
                       <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                         <User className="w-5 h-5 text-emerald-600" />
                       </div>
                       <div className="min-w-0">
                         <div className="flex items-center gap-1">
                           <p className="font-medium text-gray-900 truncate">{user.name}</p>
                           {user.email_verified && (
                             <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                           )}
                         </div>
                         <p className="text-sm text-gray-500 truncate">{user.email}</p>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center justify-between gap-2 pl-13">
                     <span className="text-xs text-gray-500">
                       Cadastro: {formatDate(user.created_at)}
                     </span>
                     {getStatusBadge(user.status)}
                   </div>
                 </div>
               ))}
             </div>
           </>
          )}
       </div>
    </div>
  );
}
