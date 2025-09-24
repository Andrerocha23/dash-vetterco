import { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const getPageTitle = () => {
    const path = location.pathname;
    const currentItem = navigationItems.find(item => {
      if (item.url === "/dashboard") {
        return path === "/" || path === "/dashboard" || path === "/boards";
      }
      return path.startsWith(item.url);
    });
    
    return currentItem?.title || "Dashboard";
  };

  const getPageIcon = () => {
    const path = location.pathname;
    const currentItem = navigationItems.find(item => {
      if (item.url === "/dashboard") {
        return path === "/" || path === "/dashboard" || path === "/boards";
      }
      return path.startsWith(item.url);
    });
    
    return currentItem?.icon;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Handle search logic here
    console.log("Search query:", query);
  };

  const PageIcon = getPageIcon();

  return (
    <>
      {/* Desktop TopBar */}
      <div className="hidden lg:flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Page Title with Icon */}
          <div className="flex items-center gap-2">
            {PageIcon && <PageIcon className="h-5 w-5 text-gray-600" />}
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 w-64 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Period Selector */}
          <PeriodSelector />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm">Saldo baixo - Cliente ABC</div>
                  <div className="text-xs text-gray-500">Há 2 horas</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm">Novo lead - Imóveis XYZ</div>
                  <div className="text-xs text-gray-500">Há 4 horas</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm">Erro de sincronização</div>
                  <div className="text-xs text-gray-500">Há 6 horas</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile TopBar */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileDrawer onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page Title */}
          <div className="flex items-center gap-2">
            {PageIcon && <PageIcon className="h-5 w-5 text-gray-600" />}
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <MobileSearchDialog
            open={searchOpen}
            onOpenChange={setSearchOpen}
            onSearch={handleSearch}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Mobile Period Selector */}
          <MobilePeriodSelector />

          {/* Mobile Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm">Saldo baixo - Cliente ABC</div>
                  <div className="text-xs text-gray-500">Há 2 horas</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-sm">Novo lead - Imóveis XYZ</div>
                  <div className="text-xs text-gray-500">Há 4 horas</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}