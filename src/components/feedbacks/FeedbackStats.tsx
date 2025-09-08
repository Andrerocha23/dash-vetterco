import { Card } from "@/components/ui/card";

interface FeedbackStatsProps {
  stats: {
    total: number;
    qualificados: number;
    desqualificados: number;
    convertidos: number;
    pendentes: number;
  };
}

export function FeedbackStats({ stats }: FeedbackStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Total Leads</div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Qualificados</div>
        <div className="text-2xl font-bold text-success">{stats.qualificados}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Desqualificados</div>
        <div className="text-2xl font-bold text-destructive">{stats.desqualificados}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Convertidos</div>
        <div className="text-2xl font-bold text-primary">{stats.convertidos}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Pendentes</div>
        <div className="text-2xl font-bold text-warning">{stats.pendentes}</div>
      </Card>
    </div>
  );
}