// src/pages/ClientDetail.tsx — Conta (Detalhes) — versão final ajustada
// - Campanhas como aba principal
// - Filtros de período: Hoje, Ontem, 7/15d, Este mês, Mês passado
// - KPIs a partir de insights (sem duplicidade)
// - Realce em vermelho para Ontem com 0 leads
// - Drive via accounts.link_drive
// - Service: metaAdsService.fetchMetaCampaigns(id, period)

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

// ===== Utils de período =====
function getDateRange(period: MetaPeriod): { since: string; until: string } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  let since: Date;
  let until: Date;

  switch (period) {
    case "today":
      since = startOfDay(now); until = endOfDay(now); break;
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      since = startOfDay(y); until = endOfDay(y); break;
    }
    case "last_7d": {
      until = endOfDay(now);
      since = new Date(now); since.setDate(since.getDate() - 6);
      since = startOfDay(since);
      break;
    }
    case "last_15d": {
      until = endOfDay(now);
      since = new Date(now); since.setDate(since.getDate() - 14);
      since = startOfDay(since);
      break;
    }
    case "this_month": {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
      until = endOfDay(now);
      break;
    }
    case "last_month": {
      const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastPrev = new Date(firstThis.getTime() - 1);
      since = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1);
      until = endOfDay(lastPrev);
      break;
    }
    default:
      since = startOfDay(now); until = endOfDay(now);
  }
  return { since: since.toISOString(), until: until.toISOString() };
}

// ===== Helpers =====
const safe = (n: number | null | undefined, fallback = 0) =>
  typeof n === "number" && !Number.isNaN(n) ? n : fallback;

// Leads a partir do insights.conversions
function getLeads(c: MetaCampaign): number {
  const conv = (c as any)?.insights?.conversions;
  return typeof conv === "number" && !Number.isNaN(conv) ? conv : 0;
}

export default function ClientDetailPage() {
  const { id } = useParams(); // account_id
  const navigate = useNavigate();
  const { toast } = useToast();

  const [period, setPeriod] = useState<MetaPeriod>("today");
  const [loading, setLoading] = useState(true);
  const [resp, setResp] = useState<MetaAdsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetaAccountMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [clientDriveUrl, setClientDriveUrl] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MetaCampaign | null>(null);

  // ===== Drive (accounts.link_drive) =====
  async function loadClientDriveLink(accountId: string) {
    const { data: acc, error: accErr } = await supabase
      .from("accounts")
      .select("id, link_drive")
      .eq("id", accountId)
      .single();

    if (accErr) {
      console.warn("accounts.link_drive not found", accErr);
    }
    if ((acc as any)?.link_drive) {
      setClientDriveUrl((acc as any).link_drive);
    }
  }

  // ===== Meta fetch =====
  async function fetchMeta() {
    if (!id) return;
    setLoading(true);
    try {
      // assinatura real do service usa apenas (id, period)
      const data = await metaAdsService.fetchMetaCampaigns(id, period);
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
    if (id) {
      loadClientDriveLink(id);
      fetchMeta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, period]);

  // Ordenação: ACTIVE > PAUSED > demais; dentro do grupo por maior gasto
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

  const currency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

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
            <Button variant="secondary" onClick={fetchMeta}>
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

                          // Realce quando período = Ontem e não teve lead
                          const highlightZeroYesterday = period === "yesterday" && leads === 0;

                          // Orçamento diário
                          const dailyBudget =
                            typeof c.daily_budget === "number" && c.daily_budget > 0 ? c.daily_budget : 0;

                          return (
                            <TableRow
                              key={c.id}
                              className={highlightZeroYesterday ? "bg-red-500/5 hover:bg-red-500/10" : ""}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{c.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <MetaStatusBadge status={c.status as any} />
                              </TableCell>
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
                                  <Button variant="ghost" size="icon" onClick={() => onOpenCampaign(c)}>
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
            <Card>
              <CardHeader>
                <CardTitle>KPIs da conta (período)</CardTitle>
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
