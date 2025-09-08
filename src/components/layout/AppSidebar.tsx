import { 
  Settings, 
  LogOut,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigationItems } from "./navigationConfig";
import { pt } from "@/i18n/pt";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard" || currentPath === "/boards";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={`hidden lg:flex ${isCollapsed ? "w-16" : "w-64"} transition-all duration-300 bg-gray-900 border-r border-gray-800`}>
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-xl text-white truncate">MetaFlow</span>
          )}
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup className="px-3 py-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-400 mb-3 px-3">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="p-0">
                        <NavLink
                          to={item.url}
                          className={({ isActive: linkActive }) => {
                            const active = isActive(item.url) || linkActive;
                            return `
                              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                              transition-all duration-200 group w-full relative overflow-hidden
                              ${active
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-gray-300 hover:text-white hover:bg-gray-800"
                              }
                              ${isCollapsed ? "justify-center" : ""}
                            `;
                          }}
                        >
                          {({ isActive: linkActive }) => {
                            const active = isActive(item.url) || linkActive;
                            return (
                              <>
                                {/* Indicador de ativo no lado esquerdo */}
                                {active && !isCollapsed && (
                                  <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-full" />
                                )}
                                
                                {/* Ícone */}
                                <div className={`flex items-center justify-center ${isCollapsed ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`}>
                                  <item.icon className={`
                                    w-full h-full transition-all duration-200
                                    ${active
                                      ? "text-white"
                                      : "text-gray-400 group-hover:text-white"
                                    }
                                  `} />
                                </div>
                                
                                {/* Texto */}
                                {!isCollapsed && (
                                  <span className="transition-colors duration-200 truncate">
                                    {item.title}
                                  </span>
                                )}
                              </>
                            );
                          }}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="ml-2">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-gray-800">
        <div className="space-y-3">
          {/* Configurações */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className={`
                  w-full transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-800
                  ${isCollapsed ? "h-10 px-0 justify-center" : "justify-start px-3 h-10"}
                `}
                asChild
              >
                <NavLink to="/configuracao">
                  <Settings className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                  {!isCollapsed && <span className="ml-2 text-sm">{pt.nav.settings}</span>}
                </NavLink>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="ml-2">
                <p>{pt.nav.settings}</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className={`
                  w-full transition-all duration-200 text-gray-300 hover:text-red-400 hover:bg-red-500/10
                  ${isCollapsed ? "h-10 px-0 justify-center" : "justify-start px-3 h-10"}
                `}
                onClick={() => {
                  console.log("Logout clicked");
                }}
              >
                <LogOut className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                {!isCollapsed && <span className="ml-2 text-sm">Sair</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="ml-2">
                <p>Sair</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}