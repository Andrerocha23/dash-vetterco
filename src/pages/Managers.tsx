import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { managersService, type ManagerWithStats } from "@/services/managersService";
import { pt } from "@/i18n/pt";

export default function Managers() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<ManagerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Carregar gestores com debug
  const loadManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting to load managers...');
      
      const data = await managersService.getManagers();
      
      console.log('✅ Managers loaded successfully:', data);
      
      setManagers(data);
      setDebugInfo({
        success: true,
        managersCount: data.length,
        loadTime: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Error loading managers:', error);
      
      const errorMessage = error?.message || 'Erro desconhecido ao carregar gestores';
      setError(errorMessage);
      setDebugInfo({
        success: false,
        error: errorMessage,
        errorDetails: error,
        loadTime: new Date().toISOString()
      });
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  // Função para testar conexão básica
  const testConnection = async () => {
    try {
      setLoading(true);
      
      // Teste simples de conectividade
      const { data, error } = await window.supabase
        .from('managers')
        .select('count')
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Conexão com banco funcionando!",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro de Conexão",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.managers.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.managers.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={testConnection}>
              Testar Conexão
            </Button>
            <Button onClick={loadManagers}>
              Recarregar
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Info:</strong>
              <pre className="mt-2 text-xs bg-muted p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error}
              <br />
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={loadManagers}
              >
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success - Show Managers */}
        {!error && managers.length > 0 && (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ {managers.length} gestores carregados com sucesso!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managers.map((manager) => (
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
                      <p><strong>Departamento:</strong> {manager.department || 'N/A'}</p>
                      <p><strong>Clientes:</strong> {manager.clientsCount}</p>
                      <p><strong>Status:</strong> {manager.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!error && managers.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum gestor encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Verifique se os gestores foram criados no banco de dados.
              </p>
              <Button onClick={loadManagers}>
                Recarregar Gestores
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}