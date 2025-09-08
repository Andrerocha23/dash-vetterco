import { useState, useEffect } from "react";
import { LineChart, BarChart3, Users, TrendingUp, Settings2, CheckCircle, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { PeriodSelector, Period } from "@/components/dashboard/PeriodSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart as ReChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { analyticsService, AnalyticsKPI, VideoData, ToolAdoption, ImplementationQuality } from "@/mocks/analyticsService";
import { pt } from "@/i18n/pt";

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const [kpis, setKpis] = useState<AnalyticsKPI | null>(null);
  const [videosData, setVideosData] = useState<VideoData[]>([]);
  const [toolAdoption, setToolAdoption] = useState<ToolAdoption | null>(null);
  const [implementationQuality, setImplementationQuality] = useState<ImplementationQuality[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [kpisData, videos, tools, implementation] = await Promise.all([
          analyticsService.getAnalyticsKPIs(period),
          analyticsService.getVideosPerDay(period),
          analyticsService.getToolAdoption(),
          analyticsService.getImplementationQuality()
        ]);
        
        setKpis(kpisData);
        setVideosData(videos);
        setToolAdoption(tools);
        setImplementationQuality(implementation);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.analytics.title}</h1>
            <p className="text-muted-foreground mt-1">
              {pt.analytics.subtitle}
            </p>
          </div>
          <PeriodSelector value={period} onValueChange={setPeriod} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            kpis && (
              <>
                <KPICard
                  title={pt.analytics.totalActiveClients}
                  value={kpis.totalActiveClients}
                  icon={Users}
                  description="Total de clientes com campanhas ativas"
                />
                <KPICard
                  title={pt.analytics.trackingActive}
                  value={`${kpis.trackingActivePercent.toFixed(1)}%`}
                  icon={BarChart3}
                  description="Clientes com rastreamento configurado"
                />
                <KPICard
                  title={pt.analytics.typebotUsage}
                  value={`${kpis.typebotUsagePercent.toFixed(1)}%`}
                  icon={Settings2}
                  description="Clientes utilizando Typebot"
                />
                <KPICard
                  title={pt.analytics.totalLeads}
                  value={kpis.totalLeads.toLocaleString()}
                  icon={TrendingUp}
                  description={period === '30d' ? 'Este mês' : `Últimos ${period.replace('d', ' dias')}`}
                  trend={{ value: 8.2, isPositive: true }}
                />
              </>
            )
          )}
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i + 4} className="h-32" />
              ))}
            </>
          ) : (
            kpis && (
              <>
                <KPICard
                  title={pt.analytics.totalInvestment}
                  value={formatCurrency(kpis.totalInvestment)}
                  icon={LineChart}
                  description={period === '30d' ? 'Este mês' : `Últimos ${period.replace('d', ' dias')}`}
                  trend={{ value: 15.3, isPositive: true }}
                />
                <KPICard
                  title="CTR Médio Geral"
                  value={`${kpis.avgCTR.toFixed(2)}%`}
                  icon={TrendingUp}
                  description="Taxa de cliques média consolidada"
                  trend={{ value: 0.8, isPositive: true }}
                />
                <KPICard
                  title="CPL Médio Geral"
                  value={formatCurrency(kpis.avgCPL)}
                  icon={BarChart3}
                  description="Custo por lead médio consolidado"
                  trend={{ value: 2.1, isPositive: false }}
                />
              </>
            )
          )}
        </div>

        {/* Charts and Tool Adoption */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Videos Chart */}
          <Card className="surface-elevated lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {pt.analytics.videosPerDay}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ReChart data={videosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="videos" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </ReChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tool Adoption */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                {pt.analytics.toolAdoption}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                toolAdoption && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {toolAdoption.trackingActive}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rastreamento Ativo
                      </div>
                      <div className="text-xs text-muted-foreground">
                        de {toolAdoption.totalClients} clientes
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-2">
                        {toolAdoption.typebotActive}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Typebot Ativo
                      </div>
                      <div className="text-xs text-muted-foreground">
                        de {toolAdoption.totalClients} clientes
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Adoção</span>
                        <span className="font-medium">
                          {((toolAdoption.trackingActive / toolAdoption.totalClients) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Implementation Quality Table */}
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {pt.analytics.implementationQuality}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 font-medium">Cliente</th>
                      <th className="text-center py-3 font-medium">Rastreamento</th>
                      <th className="text-center py-3 font-medium">Typebot</th>
                      <th className="text-center py-3 font-medium">Pixel Meta</th>
                      <th className="text-center py-3 font-medium">GA4</th>
                      <th className="text-center py-3 font-medium">UTM Padrão</th>
                      <th className="text-center py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {implementationQuality.map((client) => (
                      <tr key={client.clientId} className="border-b border-border/50">
                        <td className="py-3 font-medium">{client.clientName}</td>
                        <td className="text-center py-3">
                          {client.tracking ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3">
                          {client.typebot ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3">
                          {client.metaPixel ? (
                            <Badge variant="secondary" className="text-xs">
                              {pt.analytics.configured}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {pt.analytics.missing}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {client.ga4 ? (
                            <Badge variant="secondary" className="text-xs">
                              {pt.analytics.configured}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {pt.analytics.missing}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {client.utmDefault ? (
                            <Badge variant="secondary" className="text-xs">
                              {pt.analytics.configured}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {pt.analytics.missing}
                            </Badge>
                          )}
                        </td>
                        <td className="text-center py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/clientes/${client.clientId}`}
                          >
                            {pt.actions.edit}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}