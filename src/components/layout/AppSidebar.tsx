import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { navigationItems } from "./navigationConfig";

interface AppSidebarProps {
  logoSrc?: string;
  logoCollapsedSrc?: string;
  brandName?: string;
}

export function AppSidebar({
  logoSrc = "/Logo-branca.webp",
  logoCollapsedSrc = "/logo-mark.svg",
  brandName = "Vetter Co.",
}: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Persistir estado no localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard" || currentPath === "/boards";
    }
    return currentPath.startsWith(path);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={`
        hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out relative z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={`
            absolute -right-3 top-6 z-50 h-6 w-6 rounded-full 
            bg-sidebar border border-sidebar-border shadow-md
            hover:shadow-lg transition-all duration-200
            text-sidebar-foreground hover:bg-sidebar-accent
          `}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Header com Logo */}
        <div className={`
          flex items-center border-b border-sidebar-border
          ${isCollapsed ? 'p-3 justify-center' : 'p-4'}
          transition-all duration-300
        `}>
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center">
              {isCollapsed ? (
                <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-sidebar-foreground">
                      {brandName}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      Marketing Dashboard
                    </span>
                  </div>
                </div>
              )}
            </div>
          </NavLink>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
          <div className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            
            {/* Label de seção - apenas quando expandido */}
            {!isCollapsed && (
              <div className="px-3 py-2">
                <p className="text-overline text-text-muted">
                  Navegação
                </p>
              </div>
            )}

            {navigationItems.map((item, index) => {
              const active = isActive(item.url);
              
              if (isCollapsed) {
                return (
                  <Tooltip key={item.title} side="right">
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.url}
                        className={`
                          flex items-center justify-center h-11 w-11 mx-auto rounded-xl
                          transition-all duration-200 group relative
                          ${active 
                            ? 'bg-gradient-primary text-white shadow-glow' 
                            : 'text-text-secondary hover:bg-sidebar-accent hover:text-sidebar-foreground'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5" />
                        {active && (
                          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full opacity-80" />
                        )}
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 group relative overflow-hidden
                    ${active
                      ? 'bg-gradient-primary text-white shadow-glow'
                      : 'text-text-secondary hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {item.title}
                  </span>
                  
                  {/* Indicador visual para item ativo */}
                  {active && (
                    <div className="absolute right-2 w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer com User Info */}
        <div className={`
          border-t border-sidebar-border bg-sidebar-accent/30
          ${isCollapsed ? 'p-2' : 'p-4'}
          transition-all duration-300
        `}>
          {isCollapsed ? (
            <div className="space-y-2">
              {/* User Avatar - Collapsed */}
              <Tooltip side="right">
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <Avatar className="h-8 w-8 border-2 border-sidebar-border">
                      <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 
                         user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-sm">
                    <div className="font-medium">
                      {user?.user_metadata?.full_name || 'Usuário'}
                    </div>
                    <div className="text-text-tertiary text-xs">
                      {user?.email}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Logout Button - Collapsed */}
              <Tooltip side="right">
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-8 h-8 mx-auto text-text-secondary hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Sair
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-3">
              {/* User Info - Expanded */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50">
                <Avatar className="h-10 w-10 border-2 border-sidebar-border">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">
                    {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 
                     user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.user_metadata?.full_name || 'Usuário'}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Expanded */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-text-secondary hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="px-3 text-text-secondary hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}