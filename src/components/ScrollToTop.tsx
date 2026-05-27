import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que rola a página para o topo quando a rota muda.
 * Preserva navegação com hash (#seção).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Se há um hash na URL, deixa o navegador lidar com a âncora
    if (hash) {
      return;
    }
    
    // Rola suavemente para o topo da página
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
