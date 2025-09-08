import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsByChannel } from "@/mocks/impactDashboardService";

interface LeadsChannelChartProps {
  data: LeadsByChannel;
  isLoading?: boolean;
  onChannelClick?: (channel: string) => void;
}

export function LeadsChannelChart({ data, isLoading, onChannelClick }: LeadsChannelChartProps) {
  if (isLoading) {
    return (
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-base">Leads por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="w-32 h-32 bg-muted animate-pulse rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.meta + data.google + data.organico + data.outro;
  
  const chartData = [
    { name: 'Meta', value: data.meta, color: 'hsl(var(--primary))' },
    { name: 'Google', value: data.google, color: 'hsl(var(--secondary))' },
    { name: 'Orgânico', value: data.organico, color: 'hsl(var(--accent))' },
    { name: 'Outro', value: data.outro, color: 'hsl(var(--muted))' }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} leads ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (entry: any) => {
    onChannelClick?.(entry.name.toLowerCase());
  };

  return (
    <Card className="surface-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          Leads por Canal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              onClick={handlePieClick}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}