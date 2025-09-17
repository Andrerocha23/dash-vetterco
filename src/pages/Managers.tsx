import { AppLayout } from "@/components/layout/AppLayout";
import { ManagersSection } from "@/components/managers/ManagersSection";
import { pt } from "@/i18n/pt";

export default function Managers() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.managers.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.managers.subtitle}</p>
          </div>
        </div>

        {/* Seção de Gestores */}
        <ManagersSection />
      </div>
    </AppLayout>
  );
}