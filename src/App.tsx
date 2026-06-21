import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { MetricsProvider } from "@/contexts/MetricsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Loader2 } from "lucide-react";
import BuyCreditsPage from "@/pages/BuyCredits";

const AdminPage = lazy(() => import("@/pages/Admin"));
const OrderTrackingPage = lazy(() => import("@/pages/OrderTracking"));
const OrderHistoryPage = lazy(() => import("@/pages/OrderHistory"));
const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const PixPaymentPage = lazy(() => import("@/pages/PixPayment"));
const ResellerPage = lazy(() => import("@/pages/Reseller"));
const ComoFuncionaPage = lazy(() => import("@/pages/ComoFunciona"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const DynamicSeoPage = lazy(() => import("@/pages/DynamicSeoPage"));
const BannedPage = lazy(() => import("@/pages/Banned"));
const ResellerPublicPage = lazy(() => import("@/pages/ResellerPublicPage"));
const VibeCodingPage = lazy(() => import("@/pages/seo/VibeCoding"));
const LovableVsBoltPage = lazy(() => import("@/pages/seo/LovableVsBolt"));
const CriarAppComIAPage = lazy(() => import("@/pages/seo/CriarAppComIA"));
const ComprarCreditosLovablePage = lazy(() => import("@/pages/seo/ComprarCreditosLovable"));
const RecarregarLovablePage = lazy(() => import("@/pages/seo/RecarregarLovable"));
const RevendaCreditosLovablePage = lazy(() => import("@/pages/seo/RevendaCreditosLovable"));
const CreditosLovableIlimitadosPage = lazy(() => import("@/pages/seo/CreditosLovableIlimitados"));
const LovableDevComoFuncionaPage = lazy(() => import("@/pages/seo/LovableDevComoFunciona"));
const SeoRouter = lazy(() => import("@/pages/seo/SeoRouter"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isPublicReseller = location.pathname.startsWith("/r/");

  return (
    <>
      {!isPublicReseller && <Header />}
      {!isPublicReseller && <WhatsAppButton />}
      <div className="relative min-h-screen flex flex-col">
        <div className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<BuyCreditsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/painel-x7k9m" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/order/:orderId" element={<OrderTrackingPage />} />
              <Route path="/pix/:orderId" element={<PixPaymentPage />} />
              <Route path="/history" element={<OrderHistoryPage />} />
              <Route path="/revenda" element={<ProtectedRoute><ResellerPage /></ProtectedRoute>} />
              <Route path="/como-funciona" element={<ComoFuncionaPage />} />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/r/:slug" element={<ResellerPublicPage />} />
              <Route path="/r/:slug/:packSlug" element={<ResellerPublicPage />} />
              <Route path="/vibe-coding" element={<VibeCodingPage />} />
              <Route path="/lovable-vs-bolt" element={<LovableVsBoltPage />} />
              <Route path="/criar-app-com-ia" element={<CriarAppComIAPage />} />
              <Route path="/comprar-creditos-lovable" element={<ComprarCreditosLovablePage />} />
              <Route path="/como-recarregar-lovable" element={<RecarregarLovablePage />} />
              <Route path="/revenda-creditos-lovable" element={<RevendaCreditosLovablePage />} />
              <Route path="/creditos-lovable-ilimitados" element={<CreditosLovableIlimitadosPage />} />
              <Route path="/lovable-dev-como-funciona" element={<LovableDevComoFuncionaPage />} />
              <Route path="/s/:slug" element={<DynamicSeoPage />} />
              <Route path="/creditos/*" element={<SeoRouter />} />
              <Route path="/lovable/*" element={<SeoRouter />} />
              <Route path="/criar-app/*" element={<SeoRouter />} />
              <Route path="/vibe-coding/*" element={<SeoRouter />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MetricsProvider>
              <AppLayout />
            </MetricsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
