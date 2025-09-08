import { AlertTriangle, CreditCard, Users, Pause, Eye, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertCardProps {
  title: string;
  count: number;
  subtitle: string;
  type: 'saldo_baixo' | 'sem_leads' | 'campanhas_pausadas' | 'sem_rastreamento';
  isLoading?: boolean;
  onClick?: () => void;
}

export function AlertCard({ title, count, subtitle, type, isLoading, onClick }: AlertCardProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-28 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const getIcon = () => {
    switch (type) {
      case 'saldo_baixo': return CreditCard;
      case 'sem_leads': return Users;
      case 'campanhas_pausadas': return Pause;
      case 'sem_rastreamento': return Eye;
      default: return AlertTriangle;
    }
  };

  const getColor = () => {
    if (count === 0) return "text-success";
    if (count <= 2) return "text-warning";
    return "text-destructive";
  };

  const IconComponent = getIcon();

  return (
    <Card className="surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            {title}
          </CardTitle>
          <IconComponent className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-1 ${getColor()}`}>
          {count}
        </div>
        <p className="text-xs text-muted-foreground">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}