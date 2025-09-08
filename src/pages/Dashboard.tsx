import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PeriodSelector, Period } from "@/components/dashboard/PeriodSelector";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { LeadsCard } from "@/components/dashboard/LeadsCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { LeadsChannelChart } from "@/components/dashboard/LeadsChannelChart";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import { LeadsTrendChart } from "@/components/dashboard/LeadsTrendChart";
import { AlertsCenter } from "@/components/dashboard/AlertsCenter";
import { 
  impactDashboardService, 
  HealthScore, 
  LeadsMetrics, 
  AccountsWithLowBalance,
  AccountsWithoutLeads,
  PausedCampaigns,
  LeadsByChannel,
  HeatmapData,
  LeadsTrend,
  Alert
} from "@/mocks/impactDashboardService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("today");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [leadsMetrics, setLeadsMetrics] = useState<LeadsMetrics | null>(null);
  const [lowBalanceAccounts, setLowBalanceAccounts] = useState<AccountsWithLowBalance | null>(null);
  const [noLeadsAccounts, setNoLeadsAccounts] = useState<AccountsWithoutLeads | null>(null);
  const [pausedCampaigns, setPausedCampaigns] = useState<PausedCampaigns | null>(null);
  const [leadsByChannel, setLeadsByChannel] = useState<LeadsByChannel | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [leadsTrend, setLeadsTrend] = useState<LeadsTrend | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          healthData,
          leadsData,
          lowBalanceData,
          noLeadsData,
          pausedData,
          channelData,
          heatmapData,
          trendData,
          alertsData
        ] = await Promise.all([
          impactDashboardService.getHealthScore(),
          impactDashboardService.getLeadsMetrics(period),
          impactDashboardService.getAccountsWithLowBalance(),
          impactDashboardService.getAccountsWithoutLeads(),
          impactDashboardService.getPausedCampaigns(),
          impactDashboardService.getLeadsByChannel(period),
          impactDashboardService.getHeatmapData(),
          impactDashboardService.getLeadsTrend(period),
          impactDashboardService.getAlerts()
        ]);

        setHealthScore(healthData);
        setLeadsMetrics(leadsData);
        setLowBalanceAccounts(lowBalanceData);
        setNoLeadsAccounts(noLeadsData);
        setPausedCampaigns(pausedData);
        setLeadsByChannel(channelData);
        setHeatmapData(heatmapData);
        setLeadsTrend(trendData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [period, customRange]);

  const handlePeriodChange = (newPeriod: Period, customRange?: { from: Date; to: Date }) => {
    setPeriod(newPeriod);
    setCustomRange(customRange);
  };

  const handleChannelClick = (channel: string) => {
    navigate(`/feedbacks?channel=${channel}`);
  };

  const handleAlertClick = (alert: Alert) => {
    navigate(alert.actionUrl);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard de Impacto</h1>
            <p className="text-muted-foreground mt-1">
              Métricas que decidem o seu dia
            </p>
          </div>
          {/* Desktop period selector - hidden on mobile as it's in TopBar */}
          <div className="hidden sm:block">
            <PeriodSelector 
              value={period} 
              customRange={customRange}
              onValueChange={handlePeriodChange} 
            />
          </div>
        </div>

        {/* Linha 1 - KPIs que decidem o seu dia */}
        {/* Mobile KPI Carousel */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[280px] snap-start">
              <HealthScoreCard data={healthScore!} isLoading={isLoading} />
            </div>
            <div className="min-w-[280px] snap-start">
              <LeadsCard 
                data={leadsMetrics!} 
                period={period}
                isLoading={isLoading}
                onClick={() => navigate('/feedbacks')}
              />
            </div>
            <div className="min-w-[280px] snap-start">
              <AlertCard
                title="Contas com Saldo Baixo (Meta)"
                count={lowBalanceAccounts?.count || 0}
                subtitle="Meta com saldo abaixo do alvo"
                type="saldo_baixo"
                isLoading={isLoading}
                onClick={() => navigate('/relatorio-n8n?filter=saldo-baixo')}
              />
            </div>
            <div className="min-w-[280px] snap-start">
              <AlertCard
                title="Contas sem Leads nas últimas 48h"
                count={noLeadsAccounts?.count || 0}
                subtitle={`${noLeadsAccounts?.percentage.toFixed(1)}% das contas ativas`}
                type="sem_leads"
                isLoading={isLoading}
                onClick={() => navigate('/clientes?filter=sem-leads')}
              />
            </div>
            <div className="min-w-[280px] snap-start">
              <AlertCard
                title="Campanhas Pausadas/Inativas"
                count={pausedCampaigns?.count || 0}
                subtitle="Impacta geração de leads"
                type="campanhas_pausadas"
                isLoading={isLoading}
                onClick={() => navigate('/clientes?canal=meta&status=pausada')}
              />
            </div>
          </div>
        </div>

        {/* Desktop KPI Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <HealthScoreCard data={healthScore!} isLoading={isLoading} />
          
          <LeadsCard 
            data={leadsMetrics!} 
            period={period}
            isLoading={isLoading}
            onClick={() => navigate('/feedbacks')}
          />
          
          <AlertCard
            title="Contas com Saldo Baixo (Meta)"
            count={lowBalanceAccounts?.count || 0}
            subtitle="Meta com saldo abaixo do alvo"
            type="saldo_baixo"
            isLoading={isLoading}
            onClick={() => navigate('/relatorio-n8n?filter=saldo-baixo')}
          />
          
          <AlertCard
            title="Contas sem Leads nas últimas 48h"
            count={noLeadsAccounts?.count || 0}
            subtitle={`${noLeadsAccounts?.percentage.toFixed(1)}% das contas ativas`}
            type="sem_leads"
            isLoading={isLoading}
            onClick={() => navigate('/clientes?filter=sem-leads')}
          />
          
          <AlertCard
            title="Campanhas Pausadas/Inativas"
            count={pausedCampaigns?.count || 0}
            subtitle="Impacta geração de leads"
            type="campanhas_pausadas"
            isLoading={isLoading}
            onClick={() => navigate('/clientes?canal=meta&status=pausada')}
          />
        </div>

        {/* Linha 2 - Contexto rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1">
            <LeadsChannelChart 
              data={leadsByChannel!} 
              isLoading={isLoading}
              onChannelClick={handleChannelClick}
            />
          </div>
          
          <div className="lg:col-span-1">
            <HeatmapChart 
              data={heatmapData} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="lg:col-span-1">
            <LeadsTrendChart 
              data={leadsTrend!} 
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Linha 3 - Centro de Alertas */}
        <div className="grid grid-cols-1">
          <AlertsCenter 
            alerts={alerts}
            isLoading={isLoading}
            onAlertClick={handleAlertClick}
            onViewAll={() => navigate('/alerts')}
          />
        </div>
      </div>
    </AppLayout>
  );
}