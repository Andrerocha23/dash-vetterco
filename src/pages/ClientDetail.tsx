// src/pages/ClientDetail.tsx — Conta (Detalhes)
// Melhorias: campanhas primeiro, filtro de período (Hoje, Ontem, 7/15d, Este mês, Mês passado),
// botão do Drive, KPIs sem duplicidade, realce em vermelho p/ 0 leads no período (especialmente "Ontem"),
// ordenação: Ativas no topo, Pausadas abaixo, Arquivadas por último; indicador de budget diário.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  FolderOpen,
} from "lucide-react";

// Util — monta intervalo de datas a partir do período
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
      until = endOfDay(now); since = new Date(now); since.setDate(since.getDate() - 6); since = startOfDay(since); break;
    }
    case "last_15d": {
      until = endOfDay(now); since = new Date(now); since.setDate(since.getDate() - 14); since = startOfDay(since); break;
    }
    case "this_month": {
      since = new Date(now.getFullYear(), now.getMonth(), 1); until = endOfDay(now); break;
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

  // Retorna como ISO sem timezone (Supabase espera ISO)
  const toIso = (d: Date) => d.toISOString();
  return { since: toIso(since), until: toIso(until) };
}

// Normaliza (evita valores undefined)
const safe = (n: number | null | undefined, fallback = 0) => (typeof n === "number" && !Number.isNaN(n) ? n : fallback);

// Evita duplicidade em leads somando distintos tipos de conversão
function computeLeadsDistinct(c: MetaCampaign): number {
  // Se o backend já envia total_conversions, usa ele.
  if (typeof c.total_conversions === "number") return safe(c.total_conversions);
  // Fallback: se houver campos separados (ex.: leads_form, leads_whatsapp etc.), some com cuidado
  // Aqui mantemos compatível com tipos existentes
  // @ts-ignore - propriedades opcionais
  const parts = [c.conversions, c.conversions_form, c.conversions_whatsapp, c.conversions_site];
  // Remove nulos e soma
  return parts.filter((v) => typeof v === "number").reduce((acc, v) => acc + (v as number), 0);
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

  // Puxa dados do cliente (Drive) — tabela clientes ou accounts
  async function loadClientDriveLink(accountId: string) {
    // Tenta em "accounts" primeiro
    const { data: acc, error: accErr } = await supabase
      .from("accounts")
      .select("id, drive_url, drive_folder_url, cliente_id")
      .eq("id", accountId)
      .single();

    if (accErr) {
      console.warn("accounts drive_url not found", accErr);
    }

    if (acc?.drive_url || acc?.drive_folder_url) {
      setClientDriveUrl(acc.drive_url || acc.drive_folder_url);
      return;
    }

    // Se não houver na account, tenta buscar na tabela clientes
    if (acc?.cliente_id) {
      const { data: cli } = await supabase
        .from("clientes")
        .select("id, drive_url, drive_folder_url")
        .eq("id", acc.cliente_id)
        .maybeSingle();
      if (cli?.drive_url || cli?.drive_folder_url) {
        setClientDriveUrl(cli.drive_url || cli.drive_folder_url);
      }
    }
  }

  async function fetchMeta() {
    if (!id) return;
    setLoading(true);
    try {
      const { since, until } = getDateRange(period);
      const data = await metaAdsService.getAccountMeta(id, period, { since, until });
      if (!data?.success) throw new Error(data?.error || "Falha ao buscar Meta Ads");
      setResp(data);
      setMetrics(data.account_metrics || null);
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e?.message || "Não foi possível carregar os dados do Meta", variant: "destructive" });
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

  // Ordena campanhas: ACTIVE > PAUSED > demais; dentro de cada grupo, maior gasto desc
  const orderedCampaigns = useMemo(() => {
    const orderMap: Record<string, number> = { ACTIVE: 0, PAUSED: 1 };
    const copy = [...campaigns];
    copy.sort((a, b) => {
      const oa = orderMap[a.status] ?? 2;
      const ob = orderMap[b.status] ?? 2;
      if (oa !== ob) return oa - ob;
      const sa = safe(a.insights?.spend);
      const sb = safe(b.insights?.spend);
      return sb - sa; // desc por gasto
    });
    return copy;
  }, [campaigns]);

  // KPIs agregados sem duplicidade
  const kpis = useMemo(() => {
    const totalSpend = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.spend), 0);
    const totalClicks = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.clicks), 0);
    const totalImpr = orderedCampaigns.reduce((acc, c) => acc + safe(c.insights?.impressions), 0);
    const totalLeads = orderedCampaigns.reduce((acc, c) => acc + computeLeadsDistinct(c), 0);
    const ctr = totalImpr > 0 ? (totalClicks / totalImpr) : 0;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    const accountMetrics: MetaAccountMetrics = {
      total_spend: totalSpend,
      total_clicks: totalClicks,
      total_impressions: totalImpr,
      total_conversions: totalLeads,
      avg_ctr: ctr,
      avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avg_cpm: totalImpr > 0 ? (totalSpend / totalImpr) * 1000 : 0,
    };
    return accountMetrics;
  }, [orderedCampaigns]);

  const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

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
          {/* Futuro: filtros extra (gestor, status, busca) */}
        </div>

        {/* Tabs — Campanhas primeiro */}
        <Tabs defaultValue="campanhas" className="w-full">
          <TabsList>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
          </TabsList>

          {/* CAMPANHAS */}
          <TabsContent value="campanhas" className="mt-4 space-y-4">
            {/* KPIs compactos (sem duplicidade) */}
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
                          const leads = computeLeadsDistinct(c);
                          const cpl = leads > 0 ? spend / leads : 0;

                          // Realce: se período = ontem e leads = 0 => linha avermelhada suave
                          const highlightZeroYesterday = period === "yesterday" && leads === 0;

                          // Budget diário (se não houver, tenta avg spend/days)
                          const dailyBudget = typeof c.daily_budget === "number" && c.daily_budget > 0
                            ? c.daily_budget
                            : safe(c.avg_daily_budget);

                          return (
                            <TableRow key={c.id} className={highlightZeroYesterday ? "bg-red-500/5 hover:bg-red-500/10" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{c.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <MetaStatusBadge status={c.status as any} />
                              </TableCell>
                              <TableCell className="text-right">{dailyBudget ? currency(dailyBudget) : <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-right">{impr.toLocaleString("pt-BR")}</TableCell>
                              <TableCell className="text-right">{clicks.toLocaleString("pt-BR")}</TableCell>
                              <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                              <TableCell className="text-right">{currency(spend)}</TableCell>
                              <TableCell className="text-right">{leads}</TableCell>
                              <TableCell className="text-right">{leads > 0 ? currency(cpl) : <span className="text-muted-foreground">—</span>}</TableCell>
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
                      <div className="text-sm text-muted-foreground py-8 text-center">Nenhuma campanha no período selecionado.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VISÃO GERAL (opcional) */}
          <TabsContent value="visao" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KPIs da conta (período)</CardTitle>
              </CardHeader>
              <CardContent>
                <MetaMetricsGrid metrics={metrics ?? kpis} loading={loading} />
              </CardContent>
            </Card>

            {/* Outras seções gerais podem ser adicionadas aqui */}
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
