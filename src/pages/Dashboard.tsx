import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, Target, BarChart3, Zap, Activity } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { PeriodSelector, Period } from "@/components/dashboard/PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

// Interfaces para os dados reais
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
}

interface Alert {
  id: string;
  type: 'saldo_baixo' | 'sem_rastreamento' | 'pausado';
  title: string;
  description: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar estatísticas reais do banco
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Buscar todos os clientes
      const { data: clients, error } = await supabase
        .from('accounts')
        .select('*');

      if (error) throw error;

      // Buscar estatísticas de leads
      const { data: leadsStats, error: leadsError } = await supabase
        .from('leads_stats')
        .select('*');

      if (leadsError) throw leadsError;

      // Buscar dados de criativos de campanhas (campaign_creatives existe)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign_creatives')
        .select('*')
        .gte('first_seen_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (campaignError) console.warn('Campaign creatives error:', campaignError);

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
        });
        setAlerts([]);
        return;
      }

      // Calcular estatísticas
      const activeClients = clients.filter(c => c.status === 'Ativo');
      const pausedClients = clients.filter(c => c.status === 'Pausado');
      const archivedClients = clients.filter(c => c.status === 'Arquivado');
      
      const metaAdsClients = clients.filter(c => c.usa_meta_ads === true);
      const googleAdsClients = clients.filter(c => c.usa_google_ads === true);
      const bothChannelsClients = clients.filter(c => c.usa_meta_ads && c.usa_google_ads);
      
      const trackingActiveClients = clients.filter(c => c.traqueamento_ativo === true);
      
      // Calcular saldo total Meta (converter de centavos para reais)
      const totalMetaBalance = metaAdsClients.reduce((sum, client) => {
        return sum + ((client.saldo_meta || 0) / 100);
      }, 0);

      // Clientes com saldo baixo (menos de R$ 100 ou menos que o alerta configurado)
      const lowBalanceClients = metaAdsClients.filter(client => {
        const balance = (client.saldo_meta || 0) / 100;
        const threshold = (client.alerta_saldo_baixo || 10000) / 100; // Default 100 reais
        return balance < threshold;
      });

      // Calcular leads e conversões
      const totalLeads = leadsStats?.reduce((sum, s) => sum + (s.total_leads || 0), 0) || 0;
      const convertedLeads = leadsStats?.reduce((sum, s) => sum + (s.leads_convertidos || 0), 0) || 0;

      // Calcular métricas de campanhas dos últimos 30 dias usando campaign_creatives
      const totalSpend30d = campaignData?.reduce((sum, c) => sum + (Number(c.total_spend) || 0), 0) || 0;
      const totalImpressions = campaignData?.reduce((sum, c) => sum + (c.total_impressions || 0), 0) || 0;
      const totalClicks = campaignData?.reduce((sum, c) => sum + (c.total_clicks || 0), 0) || 0;
      const totalCampaignLeads = campaignData?.reduce((sum, c) => sum + (c.total_leads || 0), 0) || 0;
      
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCPL = totalCampaignLeads > 0 ? totalSpend30d / totalCampaignLeads : 0;
      const totalCampaigns = campaignData?.length || 0;

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
        totalLeads,
        convertedLeads,
        totalSpend30d,
        avgCTR,
        avgCPL,
        totalCampaigns,
      };

      setStats(dashboardStats);

      // Gerar alertas baseados nos dados reais
      const dashboardAlerts: Alert[] = [];

      // Alerta de saldo baixo
      if (lowBalanceClients.length > 0) {
        dashboardAlerts.push({
          id: 'saldo_baixo',
          type: 'saldo_baixo',
          title: 'Saldo Baixo',
          description: `${lowBalanceClients.length} cliente(s) com saldo abaixo do limite`,
          count: lowBalanceClients.length,
          severity: 'high',
          action: 'Verificar contas'
        });
      }

      // Alerta de rastreamento inativo
      const noTrackingClients = activeClients.filter(c => !c.traqueamento_ativo);
      if (noTrackingClients.length > 0) {
        dashboardAlerts.push({
          id: 'sem_rastreamento',
          type: 'sem_rastreamento',
          title: 'Rastreamento Inativo',
          description: `${noTrackingClients.length} cliente(s) sem rastreamento configurado`,
          count: noTrackingClients.length,
          severity: 'medium',
          action: 'Configurar tracking'
        });
      }

      // Alerta de clientes pausados
      if (pausedClients.length > 0) {
        dashboardAlerts.push({
          id: 'pausado',
          type: 'pausado',
          title: 'Clientes Pausados',
          description: `${pausedClients.length} cliente(s) com status pausado`,
          count: pausedClients.length,
          severity: 'medium',
          action: 'Revisar status'
        });
      }

      setAlerts(dashboardAlerts);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Visão geral do desempenho dos seus clientes
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral dos seus clientes e campanhas
            </p>
          </div>
          <div className="hidden sm:block">
            <PeriodSelector value={period} onValueChange={setPeriod} />
          </div>
        </div>

        {/* KPI Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Clientes"
            value={stats?.totalClients || 0}
            icon={Users}
            description="Clientes cadastrados no sistema"
          />
          
          <KPICard
            title="Clientes Ativos"
            value={stats?.activeClients || 0}
            icon={CheckCircle}
            description="Com campanhas em execução"
            trend={
              stats && stats.totalClients > 0 
                ? { 
                    value: Math.round((stats.activeClients / stats.totalClients) * 100), 
                    isPositive: true 
                  }
                : undefined
            }
          />
          
          <KPICard
            title="Saldo Meta Total"
            value={formatCurrency(stats?.totalMetaBalance || 0)}
            icon={DollarSign}
            description={`Em ${stats?.metaAdsClients || 0} contas Meta`}
          />
          
          <KPICard
            title="Com Rastreamento"
            value={stats?.trackingActiveClients || 0}
            icon={TrendingUp}
            description="Clientes com tracking ativo"
            trend={
              stats && stats.activeClients > 0 
                ? { 
                    value: Math.round((stats.trackingActiveClients / stats.activeClients) * 100), 
                    isPositive: stats.trackingActiveClients > stats.activeClients / 2 
                  }
                : undefined
            }
          />
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Leads"
            value={stats?.totalLeads || 0}
            icon={Target}
            description={`${stats?.convertedLeads || 0} convertidos`}
            trend={
              stats && stats.totalLeads > 0 && stats.convertedLeads > 0
                ? {
                    value: Math.round((stats.convertedLeads / stats.totalLeads) * 100),
                    isPositive: true
                  }
                : undefined
            }
          />
          
          <KPICard
            title="Gasto Total (30d)"
            value={formatCurrency(stats?.totalSpend30d || 0)}
            icon={BarChart3}
            description={`${stats?.totalCampaigns || 0} campanhas ativas`}
          />

          <KPICard
            title="CTR Médio"
            value={`${(stats?.avgCTR || 0).toFixed(2)}%`}
            icon={Zap}
            description="Taxa de cliques média"
            trend={
              stats && stats.avgCTR > 0
                ? {
                    value: stats.avgCTR,
                    isPositive: stats.avgCTR >= 1.0
                  }
                : undefined
            }
          />

          <KPICard
            title="CPL Médio"
            value={formatCurrency(stats?.avgCPL || 0)}
            icon={Activity}
            description="Custo por lead médio"
          />
        </div>

        {/* Segunda linha de KPIs - Canais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Apenas Meta"
            value={(stats?.metaAdsClients || 0) - (stats?.bothChannelsClients || 0)}
            icon={Users}
            description="Clientes usando só Meta Ads"
          />
          
          <KPICard
            title="Apenas Google"
            value={(stats?.googleAdsClients || 0) - (stats?.bothChannelsClients || 0)}
            icon={Users}
            description="Clientes usando só Google Ads"
          />
          
          <KPICard
            title="Ambos os Canais"
            value={stats?.bothChannelsClients || 0}
            icon={Users}
            description="Meta + Google Ads"
          />
        </div>

        {/* Alertas em tempo real */}
        {alerts.length > 0 && (
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.count}
                      </Badge>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navegar para a página de clientes com filtro
                        if (alert.type === 'saldo_baixo') {
                          navigate('/clients?filter=saldo-baixo');
                        } else if (alert.type === 'sem_rastreamento') {
                          navigate('/clients?filter=sem-tracking');
                        } else if (alert.type === 'pausado') {
                          navigate('/clients?status=pausado');
                        }
                      }}
                    >
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Status dos Clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Ativos
                </span>
                <span className="font-medium">{stats?.activeClients || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Pausados
                </span>
                <span className="font-medium">{stats?.pausedClients || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  Arquivados
                </span>
                <span className="font-medium">{stats?.archivedClients || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Canais de Publicidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Meta Ads
                </span>
                <span className="font-medium">{stats?.metaAdsClients || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Google Ads
                </span>
                <span className="font-medium">{stats?.googleAdsClients || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Ambos
                </span>
                <span className="font-medium">{stats?.bothChannelsClients || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/clients')}
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Todos os Clientes
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/clients?status=ativo')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Clientes Ativos
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/clients?filter=saldo-baixo')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Saldo Baixo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Dados atualizados em tempo real • 
            Último update: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}