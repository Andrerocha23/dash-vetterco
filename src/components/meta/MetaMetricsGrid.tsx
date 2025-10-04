import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Eye, MousePointerClick, Target, DollarSign, Users } from "lucide-react";
import type { MetaAccountMetrics } from "@/types/meta";

interface MetaMetricsGridProps {
  metrics: MetaAccountMetrics | null;
  loading: boolean;
}

export function MetaMetricsGrid({ metrics, loading }: MetaMetricsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const metricsData = [
    {
      title: 'Total Gasto',
      value: metrics ? formatCurrency(metrics.total_spend) : '-',
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Impressões',
      value: metrics ? formatNumber(metrics.total_impressions) : '-',
      icon: Eye,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Cliques',
      value: metrics ? formatNumber(metrics.total_clicks) : '-',
      icon: MousePointerClick,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'CTR Médio',
      value: metrics ? formatPercentage(metrics.avg_ctr) : '-',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'CPC Médio',
      value: metrics ? formatCurrency(metrics.avg_cpc) : '-',
      icon: DollarSign,
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      title: 'Conversões',
      value: metrics ? formatNumber(metrics.total_conversions) : '-',
      icon: Target,
      color: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="surface-elevated">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="surface-elevated hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
