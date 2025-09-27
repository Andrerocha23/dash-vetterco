import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Definindo o tipo HealthScore localmente
interface HealthScore {
  score: number;
}

interface HealthScoreCardProps {
  data: HealthScore;
  isLoading?: boolean;
}

export function HealthScoreCard({ data, isLoading }: HealthScoreCardProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, color: "bg-success text-success-foreground", icon: CheckCircle };
    if (score >= 60) return { variant: "secondary" as const, color: "bg-warning text-warning-foreground", icon: AlertTriangle };
    return { variant: "destructive" as const, color: "bg-destructive text-destructive-foreground", icon: AlertTriangle };
  };

  const badge = getScoreBadge(data.score);
  const IconComponent = badge.icon;

  return (
    <Card className="surface-elevated cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Saúde Geral
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={badge.variant} className="gap-1">
                  <IconComponent className="h-3 w-3" />
                  {data.score >= 80 ? "Boa" : data.score >= 60 ? "Atenção" : "Crítica"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-48">
                  Score calculado por saldo baixo, campanhas pausadas, 
                  clientes sem leads recentes e rastreamento
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-1 ${getScoreColor(data.score)}`}>
          {data.score}
        </div>
        <p className="text-xs text-muted-foreground">
          Score de saúde operacional
        </p>
      </CardContent>
    </Card>
  );
}