import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Clock, Zap, Target, Blocks } from "lucide-react";

export default function Templates() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Blocks className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sistema de Templates</CardTitle>
            <Badge variant="secondary" className="mx-auto w-fit">
              <Construction className="h-3 w-3 mr-1" />
              Em Construção
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              Estamos desenvolvendo um sistema completo de templates para automatizar suas comunicações.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                <Clock className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-sm">Templates Dinâmicos</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Criação de templates personalizáveis e reutilizáveis
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                <Zap className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-sm">Automação</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Envio automático baseado em triggers personalizados
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                <Target className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-sm">Personalização</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Variáveis dinâmicas para cada cliente
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-primary font-medium">
                Disponível em breve! 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}