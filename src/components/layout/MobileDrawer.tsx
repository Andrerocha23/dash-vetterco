import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navigationItems } from "./navigationConfig";
import { pt } from "@/i18n/pt";

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Persist drawer state
  useEffect(() => {
    const saved = localStorage.getItem('mobile-drawer-state');
    if (saved) {
      setOpen(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mobile-drawer-state', JSON.stringify(open));
  }, [open]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard" || location.pathname === "/boards";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden p-2 hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-72 p-0 bg-background border-r border-border"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <SheetTitle className="font-semibold text-xl text-foreground">
                MetaFlow
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 px-2">
                Navegação
              </div>
              <nav className="space-y-1">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className={({ isActive: linkActive }) => {
                      const active = isActive(item.url) || linkActive;
                      return `
                        flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium 
                        transition-all duration-200 group w-full
                        ${active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:text-primary hover:bg-secondary/50"
                        }
                      `;
                    }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-3 h-11 text-foreground hover:text-primary hover:bg-secondary/50"
              asChild
            >
              <NavLink to="/configuracao">
                <Settings className="h-5 w-5 mr-3" />
                <span>{pt.nav.settings}</span>
              </NavLink>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start px-3 h-11 text-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => console.log("Logout clicked")}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}