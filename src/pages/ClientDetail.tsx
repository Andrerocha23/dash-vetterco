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
import { ModernAccountForm } from "@/components/forms/ModernAccountForm";
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
  Link2,
  TrendingUp,
  AlertCircle,
  Instagram,
  Globe,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Pencil,
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Auto-refresh for "today" period every 2 minutes
  useEffect(() => {
    if (period !== 'today' || !metaAccountId) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing Meta data for today period...');
      fetchMeta(false); // Silent refresh without clearing cache
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [period, metaAccountId]);

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

  const handleEditAccount = async (data: any) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      // Converter strings vazias em null para campos de data
      const cleanedData = {
        ...data,
        contrato_inicio: data.contrato_inicio === "" ? null : data.contrato_inicio,
        contrato_renovacao: data.contrato_renovacao === "" ? null : data.contrato_renovacao,
      };

      const { error } = await supabase
        .from("accounts")
        .update(cleanedData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso!",
      });

      setEditModalOpen(false);
      await loadAccountBasics(id);
    } catch (error: any) {
      console.error("Erro ao atualizar conta:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a conta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <Button variant="outline" onClick={() => setEditModalOpen(true)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <MetaPeriodFilter value={period} onChange={(p) => setPeriod(p)} />

            {lastFetchTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Atualizado há {Math.floor((Date.now() - lastFetchTime) / 1000 / 60)}min
              </div>
            )}

            {period === "today" && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 rounded-md border border-amber-300 dark:border-amber-800">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-medium">
                  Meta API tem delay de 2-4h para dados de hoje • Auto-refresh a cada 2min
                </span>
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
              {/* 📋 INFORMAÇÕES DO CLIENTE - DESIGN LIMPO */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 via-primary/10 to-purple-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5 text-primary" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Cliente */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Cliente
                      </div>
                      <p className="text-lg font-semibold">{accountData?.nome_cliente || "-"}</p>
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Empresa
                      </div>
                      <p className="text-lg font-semibold">{accountData?.nome_empresa || "-"}</p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <p className="text-base">{accountData?.email || "-"}</p>
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </div>
                      <p className="text-base font-medium">{accountData?.telefone || "-"}</p>
                    </div>

                    {/* Gestor */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Gestor
                      </div>
                      <p className="text-base font-semibold">{accountData?.gestor_name || "-"}</p>
                    </div>

                    {/* Documentos */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FolderOpen className="h-4 w-4" />
                        Documentos
                      </div>
                      {accountData?.link_drive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-fit gap-2"
                          onClick={() => window.open(accountData.link_drive, "_blank")}
                        >
                          Abrir Drive
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Não configurado</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ⚙️ CONFIGURAÇÕES & INTEGRAÇÕES - SUPER VISUAL */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5 text-primary" />
                    Configurações & Integrações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 📊 CANAIS ATIVOS */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <BarChart3 className="h-4 w-4" />
                        Canais Ativos
                      </h3>

                      <div className="space-y-3">
                        {/* Meta Ads */}
                        <div
                          className="flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md"
                          style={{
                            borderColor: accountData?.usa_meta_ads ? "rgb(59 130 246 / 0.5)" : "rgb(148 163 184 / 0.2)",
                            backgroundColor: accountData?.usa_meta_ads ? "rgb(59 130 246 / 0.05)" : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${accountData?.usa_meta_ads ? "bg-blue-500/20" : "bg-gray-500/10"}`}
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Meta Ads</p>
                              <p className="text-xs text-muted-foreground">Facebook & Instagram</p>
                            </div>
                          </div>
                          <Badge variant={accountData?.usa_meta_ads ? "default" : "secondary"} className="gap-1">
                            {accountData?.usa_meta_ads ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {accountData?.usa_meta_ads ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        {/* Google Ads */}
                        <div
                          className="flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md"
                          style={{
                            borderColor: accountData?.usa_google_ads
                              ? "rgb(234 179 8 / 0.5)"
                              : "rgb(148 163 184 / 0.2)",
                            backgroundColor: accountData?.usa_google_ads ? "rgb(234 179 8 / 0.05)" : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${accountData?.usa_google_ads ? "bg-yellow-500/20" : "bg-gray-500/10"}`}
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Google Ads</p>
                              <p className="text-xs text-muted-foreground">Pesquisa & Display</p>
                            </div>
                          </div>
                          <Badge variant={accountData?.usa_google_ads ? "default" : "secondary"} className="gap-1">
                            {accountData?.usa_google_ads ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {accountData?.usa_google_ads ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* 🔔 NOTIFICAÇÕES */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        Notificações
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-sm">Saldo Baixo</span>
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3 text-green-600" />
                            Ativo
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-sm">Erro de Sync</span>
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3 text-green-600" />
                            Ativo
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span className="text-sm">Leads Diários</span>
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3 text-green-600" />
                            Ativo
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* 🔗 INTEGRAÇÕES */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <Link2 className="h-4 w-4" />
                        Integrações
                      </h3>

                      <div className="space-y-3">
                        {/* Pixel Meta */}
                        <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Pixel Meta</span>
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" />
                              Não configurado
                            </Badge>
                          </div>
                        </div>

                        {/* GA4 */}
                        <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Google Analytics 4</span>
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" />
                              Não configurado
                            </Badge>
                          </div>
                        </div>

                        {/* Typebot */}
                        <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Typebot</span>
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" />
                              Não configurado
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IDS DE CONTAS - SE EXISTIREM */}
                  {(accountData?.meta_account_id || accountData?.google_ads_id) && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        <Target className="h-4 w-4" />
                        IDs das Contas
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {accountData?.meta_account_id && (
                          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Meta Account ID</p>
                            <p className="font-mono text-sm font-semibold">{accountData.meta_account_id}</p>
                          </div>
                        )}

                        {accountData?.google_ads_id && (
                          <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Google Ads ID</p>
                            <p className="font-mono text-sm font-semibold">{accountData.google_ads_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MetaCampaignDetailDialog campaign={selectedCampaign} open={dialogOpen} onOpenChange={setDialogOpen} />
      
      <ModernAccountForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={accountData}
        onSubmit={handleEditAccount}
        isEdit={true}
      />
    </AppLayout>
  );
}
