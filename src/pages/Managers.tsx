import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Dados mockados simples por enquanto
const mockManagers = [
  { id: '1', name: 'Ana Silva Santos', email: 'ana.silva@metaflow.com', department: 'Meta Ads' },
  { id: '2', name: 'Carlos Eduardo Santos', email: 'carlos.santos@metaflow.com', department: 'Google Ads' },
  { id: '3', name: 'Mariana Costa Lima', email: 'mariana.costa@metaflow.com', department: 'Performance' }
];

export default function Managers() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestores</h1>
            <p className="text-muted-foreground mt-1">Performance e clientes por gestor</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Novo Gestor (Em breve)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockManagers.map((manager) => (
            <Card key={manager.id} className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {manager.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> {manager.email}</p>
                  <p><strong>Departamento:</strong> {manager.department}</p>
                  <p><strong>Status:</strong> Ativo</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}