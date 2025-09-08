import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTrend } from "@/mocks/impactDashboardService";

interface LeadsTrendChartProps {
  data: LeadsTrend;
  isLoading?: boolean;
}

export function LeadsTrendChart({ data, isLoading }: LeadsTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.variation >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="surface-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Tendência de Leads
          </CardTitle>
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-success' : 'text-destructive'}`} />
            <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{data.variation.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={data.data}>
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}