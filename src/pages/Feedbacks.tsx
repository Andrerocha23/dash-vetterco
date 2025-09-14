import { Construction, Clock, Zap, Target } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Feedbacks() {
  return (
    <AppLayout>
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-4 bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center">
              <Construction className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl mb-2">Sistema de Feedbacks</CardTitle>
            <Badge variant="secondary" className="mx-auto">
              Em Construção
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Estamos desenvolvendo um sistema incrível para gerenciar 
              feedback de campanhas e qualidade de leads.
            </p>
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Target className="h-4 w-4 text-blue-500" />
                <span>Sistema Kanban para organizar feedbacks</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Integração com APIs de Meta e Google</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Métricas de performance em tempo real</span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                Disponível em breve! 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}