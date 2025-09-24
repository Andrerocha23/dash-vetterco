import React, { useState, useEffect } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { MobilePeriodSelector } from "@/components/ui/mobile-period-selector";
import { MobileSearchDialog } from "@/components/ui/mobile-search-dialog";
import { MobileDrawer } from "./MobileDrawer";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { navigationItems } from "./navigationConfig";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Sync com o estado da sidebar
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const location = useLocation();
  const { user } = useAuth();
  
  // Escutar mudanças no localStorage da sidebar
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(saved ? JSON.parse(saved) : false);
    };

    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Polling para mudanças locais (mesmo tab)
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const getPageInfo = () => {
    const path = location.pathname;
    const currentItem = navigationItems.find(item => {
      if (item.url === "/dashboard") {
        return path === "/" || path === "/dashboard" || path === "/boards";
      }
      return path.startsWith(item.url);
    });
    
    return {
      title: currentItem?.title || "Dashboard",
      icon: currentItem?.icon,
      subtitle: getPageSubtitle(path)
    };
  };

  const getPageSubtitle = (path: string) => {
    if (path === "/" || path === "/dashboard") return "Visão geral dos dados";
    if (path.startsWith("/clientes")) return "Gestão de clientes";
    if (path.startsWith("/analytics")) return "Análise de performance";
    if (path.startsWith("/feedbacks")) return "Avaliações e comentários";
    if (path.startsWith("/templates")) return "Biblioteca de mensagens";
    if (path.startsWith("/capacitacao")) return "Treinamento da equipe";
    if (path.startsWith("/gestores")) return "Gestão de equipes";
    if (path.startsWith("/usuarios")) return "Controle de acesso";
    if (path.startsWith("/relatorio-n8n")) return "Relatórios automatizados";
    if (path.startsWith("/configuracao")) return "Configurações do sistema";
    return "";
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Buscar por:", query);
    // Implementar lógica de busca aqui
  };

  const mockNotifications = [
    {
      id: 1,
      title: "Saldo baixo detectado",
      description: "Cliente Imóveis ABC com saldo abaixo de R$ 100",
      time: "2 min atrás",
      type: "warning",
      unread: true
    },
    {
      id: 2,
      title: "Novo lead recebido",
      description: "Lead qualificado para Casa & Cia Imóveis",
      time: "15 min atrás", 
      type: "success",
      unread: true
    },
    {
      id: 3,
      title: "Relatório processado",
      description: "Relatório diário enviado com sucesso",
      time: "1h atrás",
      type: "info",
      unread: false
    }
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;
  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <>
      {/* Desktop TopBar - Fixa e alinhada */}
      <header 
        className={`
          hidden lg:flex items-center justify-between h-16 bg-card border-b border-border
          transition-all duration-500 ease-in-out fixed top-0 right-0 z-30
          ${sidebarCollapsed ? 'left-16' : 'left-64'}
        `}
        style={{ 
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        
        {/* Left Section - Page Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {PageIcon && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <PageIcon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {pageInfo.title}
              </h1>
              {pageInfo.subtitle && (
                <p className="text-sm text-text-secondary">
                  {pageInfo.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Buscar clientes, campanhas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="input-professional pl-9 pr-4 w-80 focus:w-96 transition-all duration-300"
            />
          </div>

          {/* Period Selector */}
          <PeriodSelector />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative hover:bg-muted transition-all duration-200 hover:scale-105"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 shadow-xl">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {mockNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-4 gap-1 hover:bg-muted/50 transition-colors ${
                      notification.unread ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            notification.unread ? 'text-foreground' : 'text-text-secondary'
                          }`}>
                            {notification.title}
                          </span>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">
                      {notification.time}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-primary cursor-pointer hover:bg-primary/10">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-muted transition-all duration-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {user?.user_metadata?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Administrador
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-text-tertiary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-xl">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-muted/50">
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-muted/50">
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile TopBar - Mantém comportamento original */}
      <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-card border-b border-border">
        
        {/* Left Section - Mobile Menu + Title */}
        <div className="flex items-center gap-3">
          <MobileDrawer />

          <div className="flex items-center gap-2">
            {PageIcon && <PageIcon className="h-5 w-5 text-primary" />}
            <h1 className="text-lg font-semibold text-foreground">
              {pageInfo.title}
            </h1>
          </div>
        </div>

        {/* Right Section - Mobile Actions */}
        <div className="flex items-center gap-2">
          
          {/* Mobile Search */}
          <MobileSearchDialog
            open={searchOpen}
            onOpenChange={setSearchOpen}
            onSearch={handleSearch}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Mobile Period Selector */}
          <MobilePeriodSelector />

          {/* Mobile Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mockNotifications.slice(0, 3).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 gap-1">
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs text-text-secondary">{notification.time}</div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}