import { AlertTriangle, CreditCard, Users, Pause, Eye, Zap, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Definindo o tipo Alert localmente
interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  count?: number;
  severity: string;
  action: string;
}

interface AlertsCenterProps {
  alerts: Alert[];
  isLoading?: boolean;
  onAlertClick?: (alert: Alert) => void;
  onViewAll?: () => void;
}

export function AlertsCenter({ alerts, isLoading, onAlertClick, onViewAll }: AlertsCenterProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'saldo_critico': return CreditCard;
      case 'zero_leads': return Users;
      case 'campanhas_pausadas': return Pause;
      case 'rastreamento_pendente': return Eye;
      case 'erro_sync': return Zap;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta': return 'bg-destructive text-destructive-foreground';
      case 'media': return 'bg-warning text-warning-foreground';
      case 'baixa': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'alta': return 'bg-destructive/20 text-destructive';
      case 'media': return 'bg-warning/20 text-warning';
      case 'baixa': return 'bg-muted/50 text-muted-foreground';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  const totalAlerts = alerts.reduce((sum, alert) => sum + (alert.count || 1), 0);

  return (
    <Card className="surface-elevated lg:col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Centro de Alertas
            {totalAlerts > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalAlerts}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver tudo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum alerta crítico no momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const IconComponent = getIcon(alert.type);
              
              return (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSeverityIcon(alert.severity)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity === 'alta' ? 'Crítico' : 
                           alert.severity === 'media' ? 'Atenção' : 'Baixo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {alert.action}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}