import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { BottomNavigation } from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <TopBar />
          
          <main 
            className="flex-1 p-4 sm:p-6 overflow-auto"
            style={{ 
              paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))'
            }}
          >
            <div className="max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      <BottomNavigation />
    </SidebarProvider>
  );
}