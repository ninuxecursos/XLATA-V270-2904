
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import { ShopAuthProvider } from "./contexts/ShopAuthContext";
import { SubscriptionSyncProvider } from "./components/SubscriptionSyncProvider";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { TimeProvider } from "./contexts/TimeContext";
import { useSEO } from "./hooks/useSEO";
import AuthGuard from "./components/AuthGuard";
import AdminGuard from "./components/AdminGuard";
import WhatsAppSupportButton from "./components/WhatsAppSupportButton";
import SubscriptionRenewalAlert from "./components/SubscriptionRenewalAlert";
import PromotionalCampaignModal from "./components/PromotionalCampaignModal";
import { AuthenticatedFeatures } from "./components/AuthenticatedFeatures";
import { MainLayout } from "./components/MainLayout";
import { DirectMessageProvider } from "./components/DirectMessageProvider";
import { OnboardingChecklist } from "./components/onboarding/OnboardingChecklist";
import { OnboardingCompletionWrapper } from "./components/onboarding/OnboardingCompletionWrapper";
import MenuAuthGate from "./components/MenuAuthGate";


// Code splitting: lazy load de todas as páginas
import { Suspense } from 'react';
import { lazyWithRetry as lazy } from './utils/lazyWithRetry';
import ScrollToTop from './components/ScrollToTop';

const WelcomeSplash = lazy(() => import("./components/landing/WelcomeSplash").then(m => ({ default: m.WelcomeSplash })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Materials = lazy(() => import('./pages/Materials'));
const Settings = lazy(() => import('./pages/Settings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const CurrentStock = lazy(() => import('./pages/CurrentStock'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Expenses = lazy(() => import('./pages/Expenses'));
const DailyFlow = lazy(() => import('./pages/DailyFlow'));
const CashAdditions = lazy(() => import('./pages/CashAdditions'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GuiaCompleto = lazy(() => import('./pages/GuiaCompleto'));
const UserHomeScreen = lazy(() => import('./components/UserHomeScreen'));
const Planos = lazy(() => import('./pages/Planos'));
const PromoXlata01 = lazy(() => import('./pages/PromoXlata01'));
const Covildomal = lazy(() => import('./pages/Covildomal'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ErrorReport = lazy(() => import('./pages/ErrorReport'));
const ReferralSystemPage = lazy(() => import('./pages/ReferralSystem'));
const DepotClients = lazy(() => import('./pages/DepotClients'));
const Employees = lazy(() => import('./pages/Employees'));
const Index = lazy(() => import('./pages/Index'));
const ScaleIntegrationPage = lazy(() => import('./pages/connectivity/ScaleIntegrationPage'));

// Loja Digital (independente do XLata)
const Shop = lazy(() => import('./pages/shop/Shop'));
const ShopCMS = lazy(() => import('./pages/ShopCMS'));
const ProductDetail = lazy(() => import('./pages/shop/ProductDetail'));
const ShopAbout = lazy(() => import('./pages/shop/ShopAbout'));
const ShopPrivacy = lazy(() => import('./pages/shop/ShopPrivacy'));
const ShopTerms = lazy(() => import('./pages/shop/ShopTerms'));
const ShopHowToBuy = lazy(() => import('./pages/shop/ShopHowToBuy'));
const ShopFAQ = lazy(() => import('./pages/shop/ShopFAQ'));
const ShopInteractiveOffers = lazy(() => import('./pages/shop/ShopInteractiveOffers'));
const ShopAccount = lazy(() => import('./pages/shop/ShopAccount'));
const ShopOrders = lazy(() => import('./pages/shop/ShopOrders'));
const ShopOrderDetail = lazy(() => import('./pages/shop/ShopOrderDetail'));
const ShopCart = lazy(() => import('./pages/shop/ShopCart'));
const ShopCheckoutPage = lazy(() => import('./pages/shop/ShopCheckoutPage'));
const ShopAccountProfile = lazy(() => import('./pages/shop/account/ShopAccountProfile'));
const ShopAccountAddresses = lazy(() => import('./pages/shop/account/ShopAccountAddresses'));
const ShopAccountSecurity = lazy(() => import('./pages/shop/account/ShopAccountSecurity'));
const ShopAccountNotifications = lazy(() => import('./pages/shop/account/ShopAccountNotifications'));
const ShopAccountFavorites = lazy(() => import('./pages/shop/account/ShopAccountFavorites'));

// PWA Install Page
const InstallApp = lazy(() => import('./pages/InstallApp'));

// Portal de Conteúdo (páginas públicas SEO)
const Blog = lazy(() => import('./pages/portal/Blog'));
const BlogPost = lazy(() => import('./pages/portal/BlogPost'));
const HelpCenter = lazy(() => import('./pages/portal/HelpCenter'));
const HelpArticle = lazy(() => import('./pages/portal/HelpArticle'));
const Solutions = lazy(() => import('./pages/portal/Solutions'));
const Solution = lazy(() => import('./pages/portal/Solution'));
const Glossary = lazy(() => import('./pages/portal/Glossary'));
const GlossaryTerm = lazy(() => import('./pages/portal/GlossaryTerm'));
// LocalPage is NOT lazy loaded to avoid Suspense errors during navigation
import LocalPage from './pages/portal/LocalPage';
// RecyclingStatePage and RecyclingCityPage are NOT lazy loaded for SEO and to avoid Suspense errors
import RecyclingStatePage from './pages/portal/RecyclingStatePage';
import RecyclingCityPage from './pages/portal/RecyclingCityPage';
import ProgrammaticSeoPage from './pages/portal/ProgrammaticSeoPage';
const SistemaParaFerroVelho = lazy(() => import('./pages/SistemaParaFerroVelho'));

import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";

// Componente para controlar acesso PWA - redireciona para login se não autenticado
const PWAAuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verifica se está rodando como PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) {
      return; // Não é PWA, não faz nada
    }

    // Se é PWA e está carregando, aguarda
    if (loading) {
      return;
    }

    // Se é PWA e não está logado, redireciona para login
    if (!user) {
      if (location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/login', { replace: true });
      }
      return;
    }

    // Se é PWA e está tentando acessar landing page, redireciona para home
    const blockedRoutes = ['/landing', '/planos', '/guia-completo', '/covildomal'];
    if (blockedRoutes.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
      gcTime: 30 * 60 * 1000, // 30 minutos - tempo de cache
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Loading fallback otimizado
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="text-white text-xl">Carregando...</div>
  </div>
);

// Loading fallback para conteúdo dentro do MainLayout (menor)
const ContentLoader = () => (
  <div className="flex items-center justify-center h-full bg-gray-950">
    <div className="text-gray-400 text-lg">Carregando...</div>
  </div>
);

const AppContent = () => {
  useSEO();
  // NOTE: Realtime hooks moved to AuthenticatedFeatures component
  // to prevent WebSocket errors on public landing pages

  return (
    <>
      {/* Controle de acesso para PWA instalado */}
      <PWAAuthRedirect />
      
      <SubscriptionRenewalAlert />
      <PromotionalCampaignModal />
      <Routes>
        {/* Rotas públicas - não precisam de autenticação */}
        <Route path="/landing" element={
          <Suspense fallback={<PageLoader />}>
            <Landing />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        } />
        <Route path="/reset-password" element={
          <Suspense fallback={<PageLoader />}>
            <ResetPassword />
          </Suspense>
        } />
        <Route path="/termos-de-uso" element={
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        } />
        <Route path="/guia-completo" element={
          <Suspense fallback={<PageLoader />}>
            <GuiaCompleto />
          </Suspense>
        } />
        <Route path="/planos" element={
          <Suspense fallback={<PageLoader />}>
            <Planos />
          </Suspense>
        } />
        <Route path="/renovar" element={<Navigate to="/planos" replace />} />
        <Route path="/renovacao" element={<Navigate to="/planos" replace />} />
        <Route path="/covildomal" element={
          <AdminGuard>
            <Suspense fallback={<PageLoader />}>
              <Covildomal />
            </Suspense>
          </AdminGuard>
        } />

        {/* Loja Digital - Rotas públicas com ShopAuthProvider */}
        <Route path="/shop" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Shop />
            </Suspense>
          </ShopAuthProvider>
        } />
        {/* Rotas específicas antes da dinâmica */}
        <Route path="/shop/sobre" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAbout />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/privacidade" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopPrivacy />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/termos" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopTerms />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/como-comprar" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopHowToBuy />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/faq" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopFAQ />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/ofertas-interativas" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopInteractiveOffers />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccount />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account/profile" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccountProfile />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account/addresses" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccountAddresses />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account/security" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccountSecurity />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account/notifications" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccountNotifications />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/account/favorites" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopAccountFavorites />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/orders" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopOrders />
            </Suspense>
          </ShopAuthProvider>
        } />
        <Route path="/shop/orders/:orderId" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopOrderDetail />
            </Suspense>
          </ShopAuthProvider>
        } />
        {/* Carrinho - antes da rota dinâmica */}
        <Route path="/shop/carrinho" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopCart />
            </Suspense>
          </ShopAuthProvider>
        } />
        {/* Checkout - página independente */}
        <Route path="/shop/checkout" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ShopCheckoutPage />
            </Suspense>
          </ShopAuthProvider>
        } />
        {/* Rota dinâmica de produtos por último */}
        <Route path="/shop/:slug" element={
          <ShopAuthProvider>
            <Suspense fallback={<PageLoader />}>
              <ProductDetail />
            </Suspense>
          </ShopAuthProvider>
        } />
        
        {/* CMS da Loja - Admin only */}
        <Route path="/shop-cms" element={
          <AdminGuard>
            <Suspense fallback={<PageLoader />}>
              <ShopCMS />
            </Suspense>
          </AdminGuard>
        } />

        {/* Portal de Conteúdo - Rotas públicas SEO */}
        {/* Programmatic SEO Pages - 12 templates, must come BEFORE /blog/:slug */}
        <Route path="/blog/sistema-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/software-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/app-gestao-reciclagem-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/gestao-deposito-sucata-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/gestao-reciclagem-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/como-gerenciar-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/controle-estoque-sucata-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/controle-materiais-reciclagem-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/controle-financeiro-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/lucro-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/como-organizar-ferro-velho-*" element={<ProgrammaticSeoPage />} />
        <Route path="/blog/organizar-patio-sucata-*" element={<ProgrammaticSeoPage />} />
        
        <Route path="/blog" element={
          <Suspense fallback={<PageLoader />}>
            <Blog />
          </Suspense>
        } />
        <Route path="/blog/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <BlogPost />
          </Suspense>
        } />
        <Route path="/ajuda" element={
          <Suspense fallback={<PageLoader />}>
            <HelpCenter />
          </Suspense>
        } />
        <Route path="/ajuda/categoria/:categorySlug" element={
          <Suspense fallback={<PageLoader />}>
            <HelpCenter />
          </Suspense>
        } />
        <Route path="/ajuda/artigo/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <HelpArticle />
          </Suspense>
        } />
        <Route path="/ajuda/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <HelpArticle />
          </Suspense>
        } />
        <Route path="/solucoes" element={
          <Suspense fallback={<PageLoader />}>
            <Solutions />
          </Suspense>
        } />
        <Route path="/solucoes/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <Solution />
          </Suspense>
        } />
        <Route path="/glossario" element={
          <Suspense fallback={<PageLoader />}>
            <Glossary />
          </Suspense>
        } />
        <Route path="/glossario/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <GlossaryTerm />
          </Suspense>
        } />
        
        {/* Local SEO Pages - dynamic routes for state/city pages (not lazy to avoid Suspense errors) */}
        <Route path="/sistema-para-ferro-velho-em-:localSlug" element={<LocalPage />} />
        <Route path="/sistema-para-reciclagem-em-:localSlug" element={<LocalPage />} />
        <Route path="/sistema-para-sucata-em-:localSlug" element={<LocalPage />} />
        <Route path="/sistema-para-deposito-em-:localSlug" element={<LocalPage />} />
        
        {/* Recycling City Pages - SEO pages for each city (more specific route first) */}
        <Route path="/reciclagem/:stateSlug/:citySlug" element={<RecyclingCityPage />} />
        {/* Recycling State Pages - SEO pages for each Brazilian state */}
        <Route path="/reciclagem/:stateSlug" element={<RecyclingStatePage />} />
        {/* PWA Install Page - instruções de instalação */}
        <Route path="/instalar" element={
          <Suspense fallback={<PageLoader />}>
            <InstallApp />
          </Suspense>
        } />

        {/* Landing de conversão */}
        <Route path="/sistema-para-ferro-velho" element={
          <Suspense fallback={<PageLoader />}>
            <SistemaParaFerroVelho />
          </Suspense>
        } />

        {/* Rota principal - Tela dividida de seleção (Sistema ou Loja) */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <WelcomeSplash />
          </Suspense>
        } />

        {/* Rotas protegidas com MainLayout compartilhado (navegação SPA) */}
        <Route element={
          <AuthGuard>
            <AuthenticatedFeatures />
            <MenuAuthGate>
              <MainLayout />
            </MenuAuthGate>
          </AuthGuard>
        }>
          <Route path="/materiais" element={
            <Suspense fallback={<ContentLoader />}>
              <Materials />
            </Suspense>
          } />
          <Route path="/configuracoes" element={
            <Suspense fallback={<ContentLoader />}>
              <Settings />
            </Suspense>
          } />
          <Route path="/configuracoes/balanca" element={
            <Suspense fallback={<ContentLoader />}>
              <ScaleIntegrationPage />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<ContentLoader />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/purchase-orders" element={
            <Suspense fallback={<ContentLoader />}>
              <PurchaseOrders />
            </Suspense>
          } />
          <Route path="/current-stock" element={
            <Suspense fallback={<ContentLoader />}>
              <CurrentStock />
            </Suspense>
          } />
          <Route path="/sales-orders" element={
            <Suspense fallback={<ContentLoader />}>
              <SalesOrders />
            </Suspense>
          } />
          <Route path="/transactions" element={
            <Suspense fallback={<ContentLoader />}>
              <Transactions />
            </Suspense>
          } />
          <Route path="/expenses" element={
            <Suspense fallback={<ContentLoader />}>
              <Expenses />
            </Suspense>
          } />
          <Route path="/daily-flow" element={
            <Suspense fallback={<ContentLoader />}>
              <DailyFlow />
            </Suspense>
          } />
          <Route path="/cash-additions" element={
            <Suspense fallback={<ContentLoader />}>
              <CashAdditions />
            </Suspense>
          } />
          <Route path="/relatar-erro" element={
            <Suspense fallback={<ContentLoader />}>
              <ErrorReport />
            </Suspense>
          } />
          <Route path="/sistema-indicacoes" element={
            <Suspense fallback={<ContentLoader />}>
              <ReferralSystemPage />
            </Suspense>
          } />
          <Route path="/clientes" element={
            <Suspense fallback={<ContentLoader />}>
              <DepotClients />
            </Suspense>
          } />
          <Route path="/funcionarios" element={
            <Suspense fallback={<ContentLoader />}>
              <Employees />
            </Suspense>
          } />
        </Route>

        {/* PDV - Tela independente (fullscreen sem MainLayout) */}
        <Route path="/pdv" element={
          <AuthGuard>
            <AuthenticatedFeatures />
            <Suspense fallback={<PageLoader />}>
              <Index />
            </Suspense>
          </AuthGuard>
        } />

        {/* Rota promocional - layout próprio */}
        <Route path="/promocao-xlata01" element={
          <AuthGuard>
            <PromoXlata01 />
          </AuthGuard>
        } />
        
        {/* Rota de erro 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Checklist de onboarding flutuante */}
      <OnboardingChecklist />
      
      {/* Modal de conclusão do onboarding */}
      <OnboardingCompletionWrapper />
      
      {/* PWAInstallPrompt removido daqui - agora é inline nos layouts */}
      
      <WhatsAppSupportButton />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <TimeProvider>
              <EmployeeProvider>
                <OnboardingProvider>
                  <SubscriptionSyncProvider>
                    <DirectMessageProvider>
                      <Toaster />
                      <Sonner position="top-center" richColors closeButton duration={0} />
                      <AppContent />
                    </DirectMessageProvider>
                  </SubscriptionSyncProvider>
                </OnboardingProvider>
              </EmployeeProvider>
            </TimeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
