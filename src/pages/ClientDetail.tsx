// src/pages/ClientDetail.tsx — Conta (Detalhes) — versão corrigida
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MetaPeriodFilter, type MetaPeriod } from "@/components/meta/MetaPeriodFilter";
import { MetaMetricsGrid } from "@/components/meta/MetaMetricsGrid";
import { MetaStatusBadge } from "@/components/meta/MetaStatusBadge";
import { MetaCampaignDetailDialog } from "@/components/meta/MetaCampaignDetailDialog";
import { metaAdsService } from "@/services/metaAdsService";
import type { MetaAdsResponse, MetaCampaign, MetaAccountMetrics } from "@/types/meta";
import { ArrowLeft, ExternalLink, RefreshCw, FolderOpen } from "lucide-react";

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
  const { id } = useParams(); // account_id (UUID do seu sistema)
  const navigate = useNavigate();
  const { toast } = useToast();

  const [period, setPeriod] = useState<MetaPeriod>("today");
  const [loading, setLoading] = useState(true);

  const [resp, setResp] = useState<MetaAdsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetaAccountMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);

  const [clientDriveUrl, setClientDriveUrl] = useState<string | null>(null);
  const [metaAccountId, setMetaAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MetaCampaign | null>(null);

  // Carrega dados completos da conta
  async function loadAccountBasics(accountId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select(`
        *,
        managers:gestor_id (
          name,
          email,
          phone,
          department
        )
      `)
      .eq("id", accountId)
      .single();

    if (error) {
      console.error("Erro buscando accounts:", error);
      toast({ title: "Erro", description: "Conta não encontrada.", variant: "destructive" });
      return;
    }

    setAccountData(data);
    setMetaAccountId((data as any)?.meta_account_id || null);
    setClientDriveUrl((data as any)?.link_drive || null);
  }

  // Busca Meta
  async function fetchMeta() {
    if (!metaAccountId) return;
    setLoading(true);
    try {
      // O service espera metaAccountId e period (não precisa since/until)
      const data = await metaAdsService.fetchMetaCampaigns(metaAccountId, period);
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar Meta Ads");
      setResp(data);
      setMetrics(data.account_metrics || null);
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível carregar os dados do Meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadAccountBasics(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (metaAccountId) fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaAccountId, period]);

  // Ordena: ACTIVE > PAUSED > demais; dentro do grupo por maior gasto
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

  // KPIs agregados a partir das campanhas
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
      <div className="px-2 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Detalhes da Conta</h1>
          </div>
          <div className="flex items-center gap-2">
            {clientDriveUrl && (
              <Button variant="outline" onClick={() => window.open(clientDriveUrl!, "_blank")}>
                <FolderOpen className="h-4 w-4 mr-2" /> Abrir Drive
              </Button>
            )}
            <Button variant="secondary" onClick={fetchMeta} disabled={!metaAccountId}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros principais */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <MetaPeriodFilter value={period} onChange={(p) => setPeriod(p)} />
          </div>
        </div>

        {/* Tabs — Campanhas primeiro */}
        <Tabs defaultValue="campanhas" className="w-full">
          <TabsList>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
          </TabsList>

          {/* CAMPANHAS */}
          <TabsContent value="campanhas" className="mt-4 space-y-4">
            {/* KPIs do período */}
            <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Campanhas do período</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Budget diário</TableHead>
                          <TableHead className="text-right">Impr.</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">CPL</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderedCampaigns.map((c) => {
                          const impr = safe(c.insights?.impressions);
                          const clicks = safe(c.insights?.clicks);
                          const spend = safe(c.insights?.spend);
                          const ctr = impr > 0 ? (clicks / impr) * 100 : 0;
                          const leads = getLeads(c);
                          const cpl = leads > 0 ? spend / leads : 0;
                          const highlightZeroYesterday = period === "yesterday" && leads === 0;

                          const dailyBudget =
                            typeof c.daily_budget === "number" && c.daily_budget > 0 ? c.daily_budget : 0;

                          return (
                            <TableRow
                              key={c.id}
                              className={highlightZeroYesterday ? "bg-red-500/5 hover:bg-red-500/10" : ""}
                            >
                              <TableCell className="font-medium">{c.name}</TableCell>
                              <TableCell><MetaStatusBadge status={c.status as any} /></TableCell>
                              <TableCell className="text-right">
                                {dailyBudget ? currency(dailyBudget) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-right">{impr.toLocaleString("pt-BR")}</TableCell>
                              <TableCell className="text-right">{clicks.toLocaleString("pt-BR")}</TableCell>
                              <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                              <TableCell className="text-right">{currency(spend)}</TableCell>
                              <TableCell className="text-right">{leads}</TableCell>
                              <TableCell className="text-right">
                                {leads > 0 ? currency(cpl) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => { setSelectedCampaign(c); setDialogOpen(true); }}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {orderedCampaigns.length === 0 && (
                      <div className="text-sm text-muted-foreground py-8 text-center">
                        Nenhuma campanha no período selecionado.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VISÃO GERAL */}
          <TabsContent value="visao" className="mt-4 space-y-4">
            {/* Informações da Conta */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nome do Cliente</p>
                      <p className="text-base font-semibold">{accountData?.nome_cliente || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                      <p className="text-base font-semibold">{accountData?.nome_empresa || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-base">{accountData?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                      <p className="text-base">{accountData?.telefone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p className="text-base">
                        <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                          accountData?.status === 'Ativo' 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {accountData?.status || '-'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gestor Responsável</p>
                      <p className="text-base font-semibold">{accountData?.managers?.name || '-'}</p>
                      {accountData?.managers?.email && (
                        <p className="text-sm text-muted-foreground">{accountData.managers.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Link Drive</p>
                      {clientDriveUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(clientDriveUrl, "_blank")}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" /> Abrir Drive
                        </Button>
                      ) : (
                        <p className="text-base text-muted-foreground">Não configurado</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ID do Grupo</p>
                      <p className="text-base font-mono text-sm">{accountData?.id_grupo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="text-sm">{accountData?.observacoes || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Meta Ads */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração Meta Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Meta Account ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.meta_account_id || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Meta Business ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.meta_business_id || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Meta Page ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.meta_page_id || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pixel Meta</p>
                      <p className="text-base font-mono text-sm">{accountData?.pixel_meta || 'Não configurado'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Budget Mensal Meta</p>
                      <p className="text-base font-semibold">
                        {accountData?.budget_mensal_meta ? currency(accountData.budget_mensal_meta) : 'Não definido'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Saldo Meta</p>
                      <p className="text-base font-semibold">
                        {accountData?.saldo_meta ? currency(accountData.saldo_meta) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Link Meta Ads Manager</p>
                      {accountData?.link_meta ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(accountData.link_meta, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" /> Abrir
                        </Button>
                      ) : (
                        <p className="text-base text-muted-foreground">Não configurado</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Webhook Meta</p>
                      <p className="text-xs font-mono break-all">{accountData?.webhook_meta || 'Não configurado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Google Ads */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração Google Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Google Ads ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.google_ads_id || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GA4 Stream ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.ga4_stream_id || 'Não configurado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GTM ID</p>
                      <p className="text-base font-mono text-sm">{accountData?.gtm_id || 'Não configurado'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Budget Mensal Google</p>
                      <p className="text-base font-semibold">
                        {accountData?.budget_mensal_google ? currency(accountData.budget_mensal_google) : 'Não definido'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Link Google Ads</p>
                      {accountData?.link_google ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(accountData.link_google, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" /> Abrir
                        </Button>
                      ) : (
                        <p className="text-base text-muted-foreground">Não configurado</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Webhook Google</p>
                      <p className="text-xs font-mono break-all">{accountData?.webhook_google || 'Não configurado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações e Preferências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Canais Ativos</p>
                    <div className="flex flex-wrap gap-1">
                      {accountData?.canais?.map((canal: string) => (
                        <span key={canal} className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {canal}
                        </span>
                      )) || <span className="text-sm">Nenhum</span>}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Notificações</p>
                    <div className="space-y-1 text-sm">
                      <p>Leads Diários: {accountData?.notificacao_leads_diarios ? '✅' : '❌'}</p>
                      <p>Saldo Baixo: {accountData?.notificacao_saldo_baixo ? '✅' : '❌'}</p>
                      <p>Erro Sync: {accountData?.notificacao_erro_sync ? '✅' : '❌'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Integrações</p>
                    <div className="space-y-1 text-sm">
                      <p>Meta Ads: {accountData?.usa_meta_ads ? '✅' : '❌'}</p>
                      <p>Google Ads: {accountData?.usa_google_ads ? '✅' : '❌'}</p>
                      <p>CRM Externo: {accountData?.usa_crm_externo ? '✅' : '❌'}</p>
                      <p>Typebot: {accountData?.typebot_ativo ? '✅' : '❌'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs do Período */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas do Período Selecionado</CardTitle>
              </CardHeader>
              <CardContent>
                <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalhes */}
      <MetaCampaignDetailDialog
        campaign={selectedCampaign}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
