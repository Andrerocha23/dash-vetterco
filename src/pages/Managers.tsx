import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Users, Target, TrendingUp } from "lucide-react";
import { pt } from "@/i18n/pt";

export default function Managers() {
  const mockManagers = [
    { id: "1", name: "Ana Silva", clientsCount: 8, leads: 1250, cpl: 42.50, ctr: 3.8, satisfaction: "excellent" },
    { id: "2", name: "Carlos Santos", clientsCount: 6, leads: 890, cpl: 48.30, ctr: 3.2, satisfaction: "good" },
    { id: "3", name: "Mariana Costa", clientsCount: 5, leads: 720, cpl: 39.80, ctr: 4.1, satisfaction: "excellent" }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.managers.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.managers.subtitle}</p>
          </div>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            {pt.managers.assignClient}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockManagers.map((manager) => (
            <Card key={manager.id} className="surface-elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{manager.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{manager.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{manager.clientsCount} {pt.managers.clientsCount}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">Leads</span>
                    </div>
                    <span className="font-semibold">{manager.leads.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm">CTR</span>
                    </div>
                    <span className="font-semibold">{manager.ctr}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">{pt.managers.satisfaction}</span>
                    <Badge variant={manager.satisfaction === "excellent" ? "default" : "secondary"}>
                      {pt.managers[manager.satisfaction as keyof typeof pt.managers]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}