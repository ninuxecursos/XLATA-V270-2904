/**
 * AppOffline - roteador enxuto para o build offline (XLata PDV Standalone)
 *
 * Diferenças do App.tsx normal:
 * - SEM landing, login, register, planos, blog, portal SEO, shop, covildomal
 * - SEM AuthGuard / AdminGuard (no offline o servidor já força owner fixo)
 * - Entra direto no /dashboard
 *
 * Apenas rotas operacionais: PDV, Dashboard, Vendas, Compras, Estoque,
 * Materiais, Fluxo, Despesas, Adições de Caixa, Clientes, Funcionários,
 * Configurações.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import { TimeProvider } from "./contexts/TimeContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { MainLayout } from "./components/MainLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Materials = lazy(() => import("./pages/Materials"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const SalesOrders = lazy(() => import("./pages/SalesOrders"));
const CurrentStock = lazy(() => import("./pages/CurrentStock"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Expenses = lazy(() => import("./pages/Expenses"));
const DailyFlow = lazy(() => import("./pages/DailyFlow"));
const CashAdditions = lazy(() => import("./pages/CashAdditions"));
const DepotClients = lazy(() => import("./pages/DepotClients"));
const Employees = lazy(() => import("./pages/Employees"));
const Settings = lazy(() => import("./pages/Settings"));
const Index = lazy(() => import("./pages/Index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="text-white text-xl">Carregando...</div>
  </div>
);

const ContentLoader = () => (
  <div className="flex items-center justify-center h-full bg-gray-950">
    <div className="text-gray-400 text-lg">Carregando...</div>
  </div>
);

const AppOffline = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <TimeProvider>
              <EmployeeProvider>
                <OnboardingProvider>
                  <Toaster />
                  <Sonner position="top-center" richColors closeButton duration={0} />
                  <Routes>
                    {/* Raiz → Dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* PDV em fullscreen */}
                    <Route
                      path="/pdv"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Index />
                        </Suspense>
                      }
                    />

                    {/* Rotas com MainLayout — alinhadas com AppSidebar.tsx */}
                    <Route element={<MainLayout />}>
                      <Route path="/dashboard" element={<Suspense fallback={<ContentLoader />}><Dashboard /></Suspense>} />
                      <Route path="/current-stock" element={<Suspense fallback={<ContentLoader />}><CurrentStock /></Suspense>} />
                      <Route path="/purchase-orders" element={<Suspense fallback={<ContentLoader />}><PurchaseOrders /></Suspense>} />
                      <Route path="/sales-orders" element={<Suspense fallback={<ContentLoader />}><SalesOrders /></Suspense>} />
                      <Route path="/transactions" element={<Suspense fallback={<ContentLoader />}><Transactions /></Suspense>} />
                      <Route path="/expenses" element={<Suspense fallback={<ContentLoader />}><Expenses /></Suspense>} />
                      <Route path="/cash-additions" element={<Suspense fallback={<ContentLoader />}><CashAdditions /></Suspense>} />
                      <Route path="/daily-flow" element={<Suspense fallback={<ContentLoader />}><DailyFlow /></Suspense>} />
                      <Route path="/materiais" element={<Suspense fallback={<ContentLoader />}><Materials /></Suspense>} />
                      <Route path="/materials" element={<Navigate to="/materiais" replace />} />
                      <Route path="/clientes" element={<Suspense fallback={<ContentLoader />}><DepotClients /></Suspense>} />
                      <Route path="/funcionarios" element={<Suspense fallback={<ContentLoader />}><Employees /></Suspense>} />
                      <Route path="/configuracoes" element={<Suspense fallback={<ContentLoader />}><Settings /></Suspense>} />
                      <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
                    </Route>

                    {/* Catch-all → Dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </OnboardingProvider>
              </EmployeeProvider>
            </TimeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default AppOffline;
