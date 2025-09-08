import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Boards from "./pages/Boards";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import Training from "./pages/Training";
import TrainingDetail from "./pages/TrainingDetail";
import AddTraining from "./pages/AddTraining";
import Managers from "./pages/Managers";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Feedbacks from "./pages/Feedbacks";
import RelatorioN8n from "./pages/RelatorioN8n";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/clientes/:id" element={<ClientDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/capacitacao" element={<Training />} />
          <Route path="/capacitacao/:id" element={<TrainingDetail />} />
          <Route path="/capacitacao/adicionar" element={<AddTraining />} />
          <Route path="/gestores" element={<Managers />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/configuracao" element={<Settings />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
          <Route path="/relatorio-n8n" element={<RelatorioN8n />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
