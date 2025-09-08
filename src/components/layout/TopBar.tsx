import { useState } from "react";
import { Search, Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { MobilePeriodSelector } from "@/components/ui/mobile-period-selector";
import { MobileSearchDialog } from "@/components/ui/mobile-search-dialog";
import { MobileDrawer } from "./MobileDrawer";
import { useLocation } from "react-router-dom";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard" || path === "/boards") return "Dashboard";
    if (path.startsWith("/clientes")) return "Clientes";
    if (path.startsWith("/feedbacks")) return "Feedbacks";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/templates")) return "Templates";
    if (path.startsWith("/capacitacao")) return "Capacitação";
    if (path.startsWith("/gestores")) return "Gestores";
    if (path.startsWith("/usuarios")) return "Usuários";
    if (path.startsWith("/relatorio-n8n")) return "Relatório N8N";
    if (path.startsWith("/configuracao")) return "Configurações";
    return "Dashboard";
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Handle search logic here
    console.log("Search:", query);
  };

  return (
    <>
      <header 
        className="h-16 border-b border-border bg-card/50 backdrop-blur-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* Mobile drawer */}
            <div className="lg:hidden">
              <MobileDrawer />
            </div>
            
            {/* Desktop sidebar trigger */}
            <div className="hidden lg:block">
              <SidebarTrigger />
            </div>
            
            <h1 className="text-lg sm:text-xl font-semibold truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop period selector */}
            <div className="hidden md:block">
              <PeriodSelector />
            </div>
            
            {/* Mobile period selector */}
            <MobilePeriodSelector />
            
            {/* Desktop search */}
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 lg:w-64 bg-secondary/50 border-border"
              />
            </div>

            {/* Mobile search trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile search dialog */}
      <MobileSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        placeholder="Buscar clientes, feedbacks..."
        onSearch={handleSearch}
      />
    </>
  );
}