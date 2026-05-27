import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-foreground text-xl">Carregando...</div>
  </div>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Redirecionar para o local apropriado
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuário autenticado vai para dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Usuário não autenticado vai para landing
        navigate('/landing', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto verifica
  return <PageLoader />;
};

export default Home;
