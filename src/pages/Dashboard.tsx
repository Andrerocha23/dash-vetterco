import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Activity,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { PeriodSelector, Period } from "@/components/dashboard/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pausedClients: number;
  archivedClients: number;
  totalMetaBalance: number;
  lowBalanceClients: number;
  trackingActiveClients: number;
  metaAdsClients: number;
  googleAdsClients: number;
  bothChannelsClients: number;
  totalLeads: number;
  convertedLeads: number;
  totalSpend30d: number;
  avgCTR: number;
  avgCPL: number;
  totalCampaigns: number;
  leadsHoje: number;
  leadsOntem: number;
  variacaoLeads: number;
}

interface Alert {
  id: string;
  type: "saldo_baixo" | "sem_rastreamento" | "pausado" | "sem_leads";
  title: string;
  description: string;
  count: number;
  severity: "high" | "medium" | "low";
  action: string;
}

interface ContaSemLead {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
}

interface CampanhaSemLead {
  campaign_name: string;
  nome_conta: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contasSemLeads, setContasSemLeads] = useState<ContaSemLead[]>([]);
  const [campanhasSemLeads, setCampanhasSemLeads] = useState<CampanhaSemLead[]>([]);
  const [leadsPorDiaSemana, setLeadsPorDiaSemana] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const hoje = new Date().toISOString().split("T")[0];
      const ontem = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const data30DiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      // Buscar accounts
      const { data: clients, error: clientsError } = await supabase.from("accounts").select("*");

      if (clientsError) {
        console.error("Erro ao buscar accounts:", clientsError);
      }

      // Buscar leads de hoje
      const { data: leadsHojeData } = await supabase
        .from("campaign_leads_daily")
        .select("leads_count")
        .eq("date", hoje);

      const totalLeadsHoje = leadsHojeData?.reduce((sum, item) => sum + (item.leads_count || 0), 0) || 0;

      // Buscar leads de ontem
      const { data: leadsOntemData } = await supabase
        .from("campaign_leads_daily")
        .select("leads_count, client_id")
        .eq("date", ontem);

      const totalLeadsOntem = leadsOntemData?.reduce((sum, item) => sum + (item.leads_count || 0), 0) || 0;

      // Contas sem leads ontem
      const accountsComLeadsOntem = new Set(
        leadsOntemData?.filter((l) => l.leads_count > 0).map((l) => l.client_id) || [],
      );

      const semLeadsOntem = (clients || [])
        .filter((acc) => acc.status === "Ativo" && !accountsComLeadsOntem.has(acc.id))
        .map((acc) => ({
          id: acc.id,
          nome_cliente: acc.nome_cliente,
          nome_empresa: acc.nome_empresa,
        }));

      setContasSemLeads(semLeadsOntem);

      // Campanhas sem leads ontem
      const { data: campanhasOntem } = await supabase
        .from("campaign_leads_daily")
        .select("campaign_name, client_id, leads_count")
        .eq("date", ontem)
        .eq("leads_count", 0);

      const campanhasEnriquecidas = (campanhasOntem || []).map((camp) => {
        const account = clients?.find((a) => a.id === camp.client_id);
        return {
          campaign_name: camp.campaign_name,
          nome_conta: account?.nome_cliente || "Desconhecido",
        };
      });

      setCampanhasSemLeads(campanhasEnriquecidas);

      // Leads por dia da semana (últimos 30 dias)
      const { data: leads30d } = await supabase
        .from("campaign_leads_daily")
        .select("date, leads_count")
        .gte("date", data30DiasAtras)
        .lte("date", hoje);

      const leadsPorDia: Record<string, number> = {
        Domingo: 0,
        Segunda: 0,
        Terça: 0,
        Quarta: 0,
        Quinta: 0,
        Sexta: 0,
        Sábado: 0,
      };

      const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

      leads30d?.forEach((lead) => {
        const data = new Date(lead.date + "T00:00:00");
        const diaSemana = diasSemana[data.getDay()];
        leadsPorDia[diaSemana] += lead.leads_count || 0;
      });

      const dadosGrafico = Object.entries(leadsPorDia).map(([dia, total]) => ({
        dia,
        leads: total,
      }));

      setLeadsPorDiaSemana(dadosGrafico);

      // Buscar dados de campanhas
      const { data: campaignData } = await supabase
        .from("campaign_leads_daily")
        .select("*")
        .gte("date", data30DiasAtras);

      // Calcular estatísticas
      if (!clients || clients.length === 0) {
        setStats({
          totalClients: 0,
          activeClients: 0,
          pausedClients: 0,
          archivedClients: 0,
          totalMetaBalance: 0,
          lowBalanceClients: 0,
          trackingActiveClients: 0,
          metaAdsClients: 0,
          googleAdsClients: 0,
          bothChannelsClients: 0,
          totalLeads: 0,
          convertedLeads: 0,
          totalSpend30d: 0,
          avgCTR: 0,
          avgCPL: 0,
          totalCampaigns: 0,
          leadsHoje: totalLeadsHoje,
          leadsOntem: totalLeadsOntem,
          variacaoLeads: 0,
        });
        return;
      }

      const activeClients = clients.filter((c) => c.status === "Ativo");
      const pausedClients = clients.filter((c) => c.status === "Pausado");
      const archivedClients = clients.filter((c) => c.status === "Arquivado");

      const metaAdsClients = clients.filter((c) => c.usa_meta_ads === true);
      const googleAdsClients = clients.filter((c) => c.usa_google_ads === true);
      const bothChannelsClients = clients.filter((c) => c.usa_meta_ads && c.usa_google_ads);

      const trackingActiveClients = clients.filter((c) => c.traqueamento_ativo === true);

      const totalMetaBalance = metaAdsClients.reduce((sum, client) => {
        return sum + (client.saldo_meta || 0) / 100;
      }, 0);

      const lowBalanceClients = metaAdsClients.filter((client) => {
        const balance = (client.saldo_meta || 0) / 100;
        const threshold = (client.alerta_saldo_baixo || 10000) / 100;
        return balance < threshold;
      });

      const totalSpend30d = campaignData?.reduce((sum, c) => sum + (Number(c.spend) || 0), 0) || 0;
      const totalImpressions = campaignData?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
      const totalClicks = campaignData?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
      const totalCampaignLeads = campaignData?.reduce((sum, c) => sum + (c.leads_count || 0), 0) || 0;
      const convertedLeads = campaignData?.reduce((sum, c) => sum + (c.converted_leads || 0), 0) || 0;

      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCPL = totalCampaignLeads > 0 ? totalSpend30d / totalCampaignLeads : 0;
      const totalCampaigns = campaignData?.length || 0;

      const variacaoLeads = totalLeadsOntem > 0 ? ((totalLeadsHoje - totalLeadsOntem) / totalLeadsOntem) * 100 : 0;

      const dashboardStats: DashboardStats = {
        totalClients: clients.length,
        activeClients: activeClients.length,
        pausedClients: pausedClients.length,
        archivedClients: archivedClients.length,
        totalMetaBalance,
        lowBalanceClients: lowBalanceClients.length,
        trackingActiveClients: trackingActiveClients.length,
        metaAdsClients: metaAdsClients.length,
        googleAdsClients: googleAdsClients.length,
        bothChannelsClients: bothChannelsClients.length,
        totalLeads: totalCampaignLeads,
        convertedLeads,
        totalSpend30d,
        avgCTR,
        avgCPL,
        totalCampaigns,
        leadsHoje: totalLeadsHoje,
        leadsOntem: totalLeadsOntem,
        variacaoLeads,
      };

      setStats(dashboardStats);

      // Gerar alertas
      const dashboardAlerts: Alert[] = [];

      if (lowBalanceClients.length > 0) {
        dashboardAlerts.push({
          id: "saldo_baixo",
          type: "saldo_baixo",
          title: "Saldo Baixo",
          description: `${lowBalanceClients.length} cliente(s) com saldo abaixo do limite`,
          count: lowBalanceClients.length,
          severity: "high",
          action: "Verificar contas",
        });
      }

      if (semLeadsOntem.length > 0) {
        dashboardAlerts.push({
          id: "sem_leads",
          type: "sem_leads",
          title: "Contas Sem Leads",
          description: `${semLeadsOntem.length} conta(s) não geraram leads ontem`,
          count: semLeadsOntem.length,
          severity: "high",
          action: "Verificar campanhas",
        });
      }

      const noTrackingClients = activeClients.filter((c) => !c.traqueamento_ativo);
      if (noTrackingClients.length > 0) {
        dashboardAlerts.push({
          id: "sem_rastreamento",
          type: "sem_rastreamento",
          title: "Rastreamento Inativo",
          description: `${noTrackingClients.length} cliente(s) sem rastreamento`,
          count: noTrackingClients.length,
          severity: "medium",
          action: "Configurar tracking",
        });
      }

      if (pausedClients.length > 0) {
        dashboardAlerts.push({
          id: "pausado",
          type: "pausado",
          title: "Clientes Pausados",
          description: `${pausedClients.length} cliente(s) pausado(s)`,
          count: pausedClients.length,
          severity: "medium",
          action: "Revisar status",
        });
      }

      setAlerts(dashboardAlerts);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSeverityColor = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral completa de performance</p>
          </div>
          <Button onClick={loadDashboardData} variant="outline">
            Atualizar Dados
          </Button>
        </div>

        {/* KPIs de Leads */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Leads Hoje"
            value={stats?.leadsHoje || 0}
            icon={Target}
            description={`Ontem: ${stats?.leadsOntem || 0}`}
            trend={
              stats && stats.variacaoLeads !== 0
                ? {
                    value: Math.abs(stats.variacaoLeads),
                    isPositive: stats.variacaoLeads >= 0,
                  }
                : undefined
            }
          />

          <KPICard
            title="Contas Sem Leads"
            value={contasSemLeads.length}
            icon={TrendingDown}
            description="Não geraram leads ontem"
          />

          <KPICard
            title="Campanhas Sem Leads"
            value={campanhasSemLeads.length}
            icon={AlertTriangle}
            description="Campanhas zeradas ontem"
          />

          <KPICard
            title="Melhor Dia"
            value={
              leadsPorDiaSemana.length > 0
                ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).dia
                : "-"
            }
            icon={Calendar}
            description={`${leadsPorDiaSemana.length > 0 ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).leads : 0} leads`}
          />
        </div>

        {/* Gráfico Leads por Dia da Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Dia da Semana (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsPorDiaSemana}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Clientes"
            value={stats?.totalClients || 0}
            icon={Users}
            description="Clientes cadastrados"
          />

          <KPICard
            title="Clientes Ativos"
            value={stats?.activeClients || 0}
            icon={CheckCircle}
            description="Com campanhas rodando"
            trend={
              stats && stats.totalClients > 0
                ? {
                    value: Math.round((stats.activeClients / stats.totalClients) * 100),
                    isPositive: true,
                  }
                : undefined
            }
          />

          <KPICard
            title="Saldo Meta Total"
            value={formatCurrency(stats?.totalMetaBalance || 0)}
            icon={DollarSign}
            description={`Em ${stats?.metaAdsClients || 0} contas`}
          />

          <KPICard
            title="Com Rastreamento"
            value={stats?.trackingActiveClients || 0}
            icon={TrendingUp}
            description="Tracking ativo"
          />
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Leads (30d)"
            value={stats?.totalLeads || 0}
            icon={Target}
            description={`${stats?.convertedLeads || 0} convertidos`}
            trend={
              stats && stats.totalLeads > 0 && stats.convertedLeads > 0
                ? {
                    value: Math.round((stats.convertedLeads / stats.totalLeads) * 100),
                    isPositive: true,
                  }
                : undefined
            }
          />

          <KPICard
            title="Gasto Total (30d)"
            value={formatCurrency(stats?.totalSpend30d || 0)}
            icon={BarChart3}
            description={`${stats?.totalCampaigns || 0} campanhas`}
          />

          <KPICard
            title="CTR Médio"
            value={`${(stats?.avgCTR || 0).toFixed(2)}%`}
            icon={Zap}
            description="Taxa de cliques"
          />

          <KPICard
            title="CPL Médio"
            value={formatCurrency(stats?.avgCPL || 0)}
            icon={Activity}
            description="Custo por lead"
          />
        </div>

        {/* Tabelas de Contas e Campanhas Sem Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas Sem Leads Ontem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {contasSemLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Todas as contas geraram leads ontem!</p>
                ) : (
                  contasSemLeads.map((conta) => (
                    <div key={conta.id} className="flex justify-between items-center p-3 bg-card rounded-lg border">
                      <div>
                        <p className="font-medium">{conta.nome_cliente}</p>
                        <p className="text-sm text-muted-foreground">{conta.nome_empresa}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campanhas Sem Leads Ontem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {campanhasSemLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Todas as campanhas geraram leads ontem!</p>
                ) : (
                  campanhasSemLeads.slice(0, 10).map((campanha, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-card rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{campanha.campaign_name}</p>
                        <p className="text-xs text-muted-foreground">{campanha.nome_conta}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.count}</Badge>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
