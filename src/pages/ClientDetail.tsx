// src/pages/ClientDetail.tsx - VERSÃO REDESENHADA 🔥
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Check,
  X,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Instagram,
  Globe,
  Calendar,
  DollarSign,
  Target,
  Activity,
} from "lucide-react";

const safe = (n: number | null | undefined, fallback = 0) => (typeof n === "number" && !Number.isNaN(n) ? n : fallback);

const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

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

  async function loadAccountBasics(accountId: string) {
    const { data, error } = await supabase.from("accounts").select("*").eq("id", accountId).single();

    if (error) {
      console.error("Erro buscando accounts:", error);
      toast({ title: "Erro", description: "Conta não encontrada.", variant: "destructive" });
      return;
    }

    setAccountData(data);
    setMetaAccountId(data?.meta_account_id || null);
    setClientDriveUrl(data?.link_drive || null);
  }

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 🎨 HEADER HERO - CLEAN E MODERNO */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b">
            <div className="flex items-start gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0 hover:bg-primary/10 hover:text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl font-bold">
                    {accountData?.nome_cliente
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "CL"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold truncate">{accountData?.nome_cliente || "Carregando..."}</h1>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                    {accountData?.nome_empresa && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {accountData.nome_empresa}
                        </div>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      </>
                    )}

                    <Badge
                      variant="outline"
                      className={
                        accountData?.status === "Ativo"
                          ? "bg-green-500/10 text-green-600 border-green-500/30"
                          : "bg-red-500/10 text-red-600 border-red-500/30"
                      }
                    >
                      {accountData?.status === "Ativo" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {accountData?.status || "Status"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="flex flex-wrap items-center gap-2">
              {clientDriveUrl && (
                <Button variant="outline" onClick={() => window.open(clientDriveUrl!, "_blank")} className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Drive
                </Button>
              )}

              <Button onClick={() => fetchMeta(true)} disabled={!metaAccountId || refreshing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>

          {/* 📊 CARDS DE INFO RÁPIDA - COMPACTO E ELEGANTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                    <p className="text-sm font-semibold truncate">{accountData?.telefone || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                    <p className="text-sm font-semibold truncate">{accountData?.email || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Saldo Meta</p>
                    <p className="text-sm font-semibold">{currency(accountData?.saldo_meta || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Budget Mensal</p>
                    <p className="text-sm font-semibold">{currency(accountData?.budget_mensal_meta || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 🎯 FILTROS E INFORMAÇÕES */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <MetaPeriodFilter value={period} onChange={(p) => setPeriod(p)} />

            {lastFetchTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Atualizado {new Date(lastFetchTime).toLocaleTimeString("pt-BR")}
              </div>
            )}

            {period === "today" && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md">
                <AlertCircle className="h-3 w-3" />
                Dados de hoje podem ter delay
              </div>
            )}
          </div>

          {/* 📈 MÉTRICAS PRINCIPAIS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Performance do Período
              </CardTitle>
              <CardDescription>Métricas agregadas de todas as campanhas</CardDescription>
            </CardHeader>
            <CardContent>
              <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />
            </CardContent>
          </Card>

          {/* 🎪 TABS DE CONTEÚDO */}
          <Tabs defaultValue="campanhas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="campanhas" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Campanhas
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Detalhes da Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campanhas" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Campanhas Ativas</CardTitle>
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
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma campanha encontrada no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detalhes" className="mt-6 space-y-6">
              {/* INFORMAÇÕES DETALHADAS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium">{accountData?.telefone || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{accountData?.email || "-"}</p>
                      </div>
                    </div>

                    {accountData?.link_drive && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Documentos</p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-primary"
                            onClick={() => window.open(accountData.link_drive, "_blank")}
                          >
                            Abrir Drive <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Configurações de Campanha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Meta Ads</p>
                        <Badge variant={accountData?.usa_meta_ads ? "default" : "secondary"}>
                          {accountData?.usa_meta_ads ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {accountData?.usa_meta_ads ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Google Ads</p>
                        <Badge variant={accountData?.usa_google_ads ? "default" : "secondary"}>
                          {accountData?.usa_google_ads ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {accountData?.usa_google_ads ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>

                    {accountData?.meta_account_id && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Meta Account ID</p>
                        <p className="font-mono text-sm">{accountData.meta_account_id}</p>
                      </div>
                    )}

                    {accountData?.google_ads_id && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Google Ads ID</p>
                        <p className="font-mono text-sm">{accountData.google_ads_id}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MetaCampaignDetailDialog campaign={selectedCampaign} open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}
