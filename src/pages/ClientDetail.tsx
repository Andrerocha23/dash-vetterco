// src/pages/ClientDetail.tsx — Conta (Detalhes) — versão moderna
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MetaPeriodFilter, type MetaPeriod } from "@/components/meta/MetaPeriodFilter";
import { MetaMetricsGrid } from "@/components/meta/MetaMetricsGrid";
import { MetaCampaignTable } from "@/components/meta/MetaCampaignTable";
import { MetaCampaignDetailDialog } from "@/components/meta/MetaCampaignDetailDialog";
import { metaAdsService } from "@/services/metaAdsService";
import type { MetaAdsResponse, MetaCampaign, MetaAccountMetrics } from "@/types/meta";
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCw, 
  FolderOpen, 
  Building2, 
  Mail, 
  Phone, 
  User,
  DollarSign,
  Bell,
  Link2,
  Check,
  X,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertCircle
} from "lucide-react";

// ===== Helpers =====
const safe = (n: number | null | undefined, fallback = 0) =>
  typeof n === "number" && !Number.isNaN(n) ? n : fallback;

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const getLeads = (c: MetaCampaign) => {
  const conv = (c as any)?.insights?.conversions;
  return typeof conv === "number" && !Number.isNaN(conv) ? conv : 0;
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [period, setPeriod] = useState<MetaPeriod>("today");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [resp, setResp] = useState<MetaAdsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetaAccountMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);

  const [clientDriveUrl, setClientDriveUrl] = useState<string | null>(null);
  const [metaAccountId, setMetaAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MetaCampaign | null>(null);

  // Carrega dados completos da conta
  async function loadAccountBasics(accountId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) {
      console.error("Erro buscando accounts:", error);
      toast({ title: "Erro", description: "Conta não encontrada.", variant: "destructive" });
      return;
    }

    // Não há mais gestor_id - foi substituído por user_id em clientes

    setAccountData(data);
    setMetaAccountId(data?.meta_account_id || null);
    setClientDriveUrl(data?.link_drive || null);
  }

  // Busca Meta
  async function fetchMeta(forceRefresh = false) {
    if (!metaAccountId) return;
    setLoading(true);
    if (forceRefresh) {
      setRefreshing(true);
      metaAdsService.clearCache(`${metaAccountId}_${period}`);
    }
    try {
      const data = await metaAdsService.fetchMetaCampaigns(metaAccountId, period);
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar Meta Ads");
      setResp(data);
      setMetrics(data.account_metrics || null);
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      setLastFetchTime(Date.now());
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível carregar os dados do Meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (id) loadAccountBasics(id);
  }, [id]);

  useEffect(() => {
    if (metaAccountId) fetchMeta();
  }, [metaAccountId, period]);

  // Ordena campanhas
  const orderedCampaigns = useMemo(() => {
    const orderMap: Record<string, number> = { ACTIVE: 0, PAUSED: 1 };
    const copy = [...campaigns];
    copy.sort((a, b) => {
      const oa = orderMap[a.status] ?? 2;
      const ob = orderMap[b.status] ?? 2;
      if (oa !== ob) return oa - ob;
      const sa = safe(a.insights?.spend);
      const sb = safe(b.insights?.spend);
      return sb - sa;
    });
    return copy;
  }, [campaigns]);

  // KPIs agregados
  const kpis = useMemo((): MetaAccountMetrics => {
    const totalSpend = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.spend), 0);
    const totalClicks = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.clicks), 0);
    const totalImpr = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.impressions), 0);
    const totalLeads = orderedCampaigns.reduce((acc, c) => acc + getLeads(c), 0);
    const ctr = totalImpr > 0 ? totalClicks / totalImpr : 0;

    return {
      total_spend: totalSpend,
      total_clicks: totalClicks,
      total_impressions: totalImpr,
      total_conversions: totalLeads,
      avg_ctr: ctr,
      avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avg_cpm: totalImpr > 0 ? (totalSpend / totalImpr) * 1000 : 0,
    };
  }, [orderedCampaigns]);

  const onOpenCampaign = (c: MetaCampaign) => {
    setSelectedCampaign(c);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">{/* Largura dinâmica sem max-width fixo */}
          {/* Header moderno */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Building2 className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {accountData?.nome_cliente || 'Detalhes da Conta'}
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  {accountData?.nome_empresa && (
                    <>
                      <span>{accountData.nome_empresa}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    </>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    accountData?.status === 'Ativo' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {accountData?.status === 'Ativo' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {accountData?.status || 'Status'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {clientDriveUrl && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(clientDriveUrl!, "_blank")}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" /> Drive
                  </Button>
                )}
                <Button 
                  onClick={() => fetchMeta(true)} 
                  disabled={!metaAccountId || refreshing}
                  className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> 
                  {refreshing ? 'Atualizando...' : 'Forçar Atualização'}
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <MetaPeriodFilter value={period} onChange={(p) => setPeriod(p)} />
            
            {lastFetchTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Atualizado {new Date(lastFetchTime).toLocaleTimeString('pt-BR')}
              </div>
            )}
            
            {period === 'today' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md">
                <AlertCircle className="h-3 w-3" />
                Dados de "hoje" podem ter delay de processamento
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="campanhas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger 
                value="campanhas" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Campanhas
              </TabsTrigger>
              <TabsTrigger 
                value="visao"
                className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
            </TabsList>

            {/* CAMPANHAS */}
            <TabsContent value="campanhas" className="mt-0 space-y-6">
              <div className="grid gap-4">
                <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />
              </div>

              {!loading && orderedCampaigns.length === 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          Nenhum dado disponível para o período selecionado
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                          Isso pode acontecer porque:
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside mb-3">
                          <li>Os dados de "hoje" podem levar algumas horas para serem processados pelo Meta</li>
                          <li>Não houve impressões ou gastos nas campanhas neste período</li>
                          <li>As campanhas estão pausadas ou arquivadas</li>
                        </ul>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPeriod('yesterday')}
                            className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
                          >
                            Ver dados de ontem
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPeriod('last_7d')}
                            className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
                          >
                            Ver últimos 7 dias
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Campanhas Ativas
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {orderedCampaigns.length} campanhas no período selecionado
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : orderedCampaigns.length > 0 ? (
                    <MetaCampaignTable campaigns={orderedCampaigns} loading={loading} />
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* VISÃO GERAL */}
            <TabsContent value="visao" className="mt-0 space-y-6">
              {/* Info Cliente */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="h-6 w-6 text-primary" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>Cliente</span>
                      </div>
                      <p className="text-lg font-semibold">{accountData?.nome_cliente || '-'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span>Empresa</span>
                      </div>
                      <p className="text-lg font-semibold">{accountData?.nome_empresa || '-'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <p className="text-base">{accountData?.email || '-'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-4 w-4" />
                        <span>Telefone</span>
                      </div>
                      <p className="text-base">{accountData?.telefone || '-'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>Gestor</span>
                      </div>
                      <p className="text-base font-semibold">{accountData?.managers?.name || '-'}</p>
                      {accountData?.managers?.email && (
                        <p className="text-sm text-muted-foreground">{accountData.managers.email}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>Documentos</span>
                      </div>
                      {clientDriveUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(clientDriveUrl, "_blank")}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" /> Abrir Drive
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Não configurado</p>
                      )}
                    </div>
                  </div>

                  {accountData?.observacoes && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                        <p className="text-sm leading-relaxed">{accountData.observacoes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Integrações */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Configurações & Integrações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Canais Ativos</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {accountData?.canais?.length > 0 ? (
                          accountData.canais.map((canal: string) => (
                            <Badge key={canal} variant="secondary" className="bg-primary/10 text-primary">
                              {canal}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Nenhum canal</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Notificações</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Leads Diários</span>
                          {accountData?.notificacao_leads_diarios ? 
                            <Check className="h-4 w-4 text-green-600" /> : 
                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Saldo Baixo</span>
                          {accountData?.notificacao_saldo_baixo ? 
                            <Check className="h-4 w-4 text-green-600" /> : 
                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Erro Sync</span>
                          {accountData?.notificacao_erro_sync ? 
                            <Check className="h-4 w-4 text-green-600" /> : 
                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Integrações</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Meta Ads</span>
                          {accountData?.usa_meta_ads ? 
                            <Check className="h-4 w-4 text-green-600" /> : 
                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Google Ads</span>
                          {accountData?.usa_google_ads ? 
                            <Check className="h-4 w-4 text-green-600" /> : 
                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-card">
                <CardHeader className="border-b bg-primary/5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Performance do Período
                  </CardTitle>
                  <CardDescription>Métricas agregadas do período selecionado</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MetaCampaignDetailDialog
        campaign={selectedCampaign}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
