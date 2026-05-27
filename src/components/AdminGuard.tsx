 import React, { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { ShieldAlert } from 'lucide-react';
 import { toast } from '@/hooks/use-toast';
 
 interface AdminGuardProps {
   children: React.ReactNode;
 }
 
 /**
  * AdminGuard - Proteção de rotas administrativas
  * 
  * DIFERENTE DO AuthGuard:
  * - Requer autenticação E role de admin
  * - Verifica admin via RPC server-side (seguro)
  * - Usado para: /shop-cms, /covildomal, etc.
  */
// Build offline standalone: licenca local ja autorizou, nao ha role-check Supabase
const IS_OFFLINE_BUILD = (import.meta as any).env?.VITE_OFFLINE_BUILD === 'true';

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  if (IS_OFFLINE_BUILD) {
    return <>{children}</>;
  }
  return <AdminGuardOnline>{children}</AdminGuardOnline>;
};

const AdminGuardOnline: React.FC<AdminGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
   const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
   const [checkingAccess, setCheckingAccess] = useState(true);
 
   useEffect(() => {
     const checkAdminAccess = async () => {
       // Aguardar loading de autenticação
       if (authLoading) return;
 
       // Se não há usuário, redirecionar para login
       if (!user) {
         console.warn('🚫 AdminGuard: Tentativa de acesso sem autenticação');
         navigate('/login', { replace: true });
         setCheckingAccess(false);
         return;
       }
 
       try {
         // SEGURANÇA: Verificar role de admin via RPC server-side
         // Nunca confie em dados client-side para verificação de permissão
         const { data, error: rpcError } = await supabase.rpc('is_admin');
 
         if (rpcError) {
           console.error('❌ AdminGuard: Erro ao verificar permissão:', rpcError);
           toast({
             title: "Erro de Verificação",
             description: "Não foi possível verificar suas permissões.",
             variant: "destructive"
           });
           navigate('/', { replace: true });
           setIsAdmin(false);
           setCheckingAccess(false);
           return;
         }
 
         if (!data) {
           console.warn('🚫 AdminGuard: Usuário não é admin:', user.email);
           toast({
             title: "⛔ Acesso Negado",
             description: "Você não tem permissão para acessar esta área administrativa.",
             variant: "destructive"
           });
           navigate('/', { replace: true });
           setIsAdmin(false);
           setCheckingAccess(false);
           return;
         }
 
         // Usuário é admin - permitir acesso
         console.log('✅ AdminGuard: Acesso concedido para:', user.email);
         setIsAdmin(true);
       } catch (err) {
         console.error('💥 AdminGuard: Erro inesperado:', err);
         navigate('/', { replace: true });
         setIsAdmin(false);
       } finally {
         setCheckingAccess(false);
       }
     };
 
     checkAdminAccess();
   }, [user, authLoading, navigate]);
 
   // Loading enquanto verifica autenticação e permissões
   if (authLoading || checkingAccess) {
     return (
       <div className="min-h-screen bg-gray-900 flex items-center justify-center">
         <div className="text-center">
           <ShieldAlert className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-pulse" />
           <p className="text-white text-lg">Verificando permissões...</p>
           <p className="text-gray-400 text-sm mt-2">Aguarde enquanto validamos seu acesso</p>
         </div>
       </div>
     );
   }
 
   // Se não é admin, não renderiza nada (já foi redirecionado)
   if (!isAdmin) {
     return null;
   }
 
   // Usuário é admin - renderizar conteúdo
   return <>{children}</>;
 };
 
 export default AdminGuard;