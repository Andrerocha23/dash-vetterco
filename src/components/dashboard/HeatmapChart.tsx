import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Definindo o tipo HeatmapData localmente
interface HeatmapData {
  hour: string;
  leads: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  isLoading?: boolean;
}

export function HeatmapChart({ data, isLoading }: HeatmapChartProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-base">Mapa de Calor — Horário x Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex gap-1">
                {[...Array(24)].map((_, j) => (
                  <div key={j} className="w-3 h-3 bg-muted animate-pulse rounded-sm" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxLeads = Math.max(...data.map(d => d.leads));
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (leads: number) => {
    if (leads === 0) return 0;
    return Math.ceil((leads / maxLeads) * 4);
  };

  const getColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-muted';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/60';
      case 4: return 'bg-primary/80';
      default: return 'bg-primary';
    }
  };

  return (
    <Card className="surface-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          Mapa de Calor — Horário x Dia
        </CardTitle>
        <p className="text-xs text-muted-foreground">Últimos 14 dias no período</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header com horas */}
          <div className="flex gap-1 ml-10">
            {[0, 6, 12, 18].map(hour => (
              <div key={hour} className="text-xs text-muted-foreground w-12 text-center">
                {hour}h
              </div>
            ))}
          </div>
          
          {/* Grid do heatmap */}
          <TooltipProvider>
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <div className="text-xs text-muted-foreground w-8">{day}</div>
                <div className="flex gap-1">
                  {hours.map(hour => {
                    const cellData = data.find(d => d.hour === `${hour}:00`);
                    const leads = cellData?.leads || 0;
                    const intensity = getIntensity(leads);
                    
                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger>
                          <div 
                            className={`w-3 h-3 rounded-sm ${getColor(intensity)} hover:ring-1 hover:ring-primary transition-all`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {day} às {hour}h: {leads} leads
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </TooltipProvider>
          
          {/* Legenda */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Menos</span>
            {[0, 1, 2, 3, 4].map(intensity => (
              <div key={intensity} className={`w-3 h-3 rounded-sm ${getColor(intensity)}`} />
            ))}
            <span className="text-xs text-muted-foreground">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}