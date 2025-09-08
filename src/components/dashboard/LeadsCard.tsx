import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsMetrics } from "@/mocks/impactDashboardService";

interface LeadsCardProps {
  data: LeadsMetrics;
  period: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export function LeadsCard({ data, period, isLoading, onClick }: LeadsCardProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.variation >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  const getPeriodText = () => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      default: return 'no Período';
    }
  };

  return (
    <Card className="surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Leads ({getPeriodText()})
          </CardTitle>
          <Target className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">
          {data.current.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Gerados {period === 'today' || period === 'yesterday' ? getPeriodText().toLowerCase() : 'no período selecionado'}
        </p>
        <div className="flex items-center gap-1">
          <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-success' : 'text-destructive'}`} />
          <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{data.variation.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs período anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}