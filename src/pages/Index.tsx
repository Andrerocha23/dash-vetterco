// src/pages/ContasCliente.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  RefreshCw,
  Search,
  Plus,
  Building2,
  Users,
  Zap,
  Target,
  DollarSign,
  CheckCircle,
  BarChart3,
  MoreVertical,
  Eye,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccountData {
  id: string;
  nome_cliente: string;
  nome_empresa?: string;
  telefone?: string;
  email?: string | null;
  gestor_id?: string;
  cliente_id?: string; // importante: cliente_id é a chave que usamos para agregar leads
  canais?: string[];
  status?: string;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  usa_meta_ads?: boolean;
  meta_account_id?: string | null;
  saldo_meta?: number | null;
  budget_mensal_meta?: number | null;
  usa_google_ads?: boolean;
  google_ads_id?: string | null;
  budget_mensal_google?: number | null;

  // calculados
  gestor_name?: string;
  cliente_nome?: string;
  total_budget?: number;
  leads_7d?: number;
  leads_30d?: number;
  campanhas_ativas?: number;
  last_lead_date?: string | null;
}

interface Manager {
  id: string;
  name: string;
  avatar_url?: string;
}

export default function ContasCliente() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // data
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // filters & ui
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos os Status");
  const [filterGestor, setFilterGestor] = useState("Todos os Gestores");
  const [onlyHasCampaigns, setOnlyHasCampaigns] = useState(false);

  // modal / edit
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      // 1) accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;

      // 2) managers
      const { data: managersData } = await supabase.from("managers").select("id, name, avatar_url").order("name");

      // 3) clientes
      const { data: clientesData } = await supabase.from("clientes").select("id, nome").order("nome");

      // 4) campanha/ leads — agregamos por cliente_id (IMPORTANTE: chave = cliente_id)
      let campaignAgg: Record<
        string,
        {
          leads_7d: number;
          leads_30d: number;
          campanhas_ativas: number;
          last_lead_date: string | null;
          daily: Record<string, number>;
        }
      > = {};

      try {
        // pegar muitas linhas para garantir dados "de hoje" — ajuste o limit conforme necessidade
        const { data: campaignRows } = await supabase
          .from("campaign_leads_daily")
          .select("client_id, leads_count, date, campaign_name")
          .order("date", { ascending: true }) // asc para facilitar sparkline
          .limit(20000);

        if (campaignRows) {
          const now = new Date();
          const cutoff30 = new Date(now);
          cutoff30.setDate(now.getDate() - 30);
          const cutoff7 = new Date(now);
          cutoff7.setDate(now.getDate() - 7);

          // temp map by client_id
          const map: Record<
            string,
            {
              leads_7d: number;
              leads_30d: number;
              campanhas: Set<string>;
              last_lead_ts: number | null;
              daily: Record<string, number>;
            }
          > = {};

          campaignRows.forEach((r: any) => {
            const clientId = r.client_id;
            if (!clientId) return; // sem client_id ignorar
            const date = new Date(r.date);
            if (!map[clientId])
              map[clientId] = { leads_7d: 0, leads_30d: 0, campanhas: new Set(), last_lead_ts: null, daily: {} };
            const leadsN = Number(r.leads_count || 0);

            // daily bucket (YYYY-MM-DD)
            const dayKey = date.toISOString().slice(0, 10);
            map[clientId].daily[dayKey] = (map[clientId].daily[dayKey] || 0) + leadsN;

            if (date >= cutoff30) {
              map[clientId].leads_30d += leadsN;
            }
            if (date >= cutoff7) {
              map[clientId].leads_7d += leadsN;
            }
            if (r.campaign_name) map[clientId].campanhas.add(r.campaign_name);

            // last lead ts
            const ts = date.getTime();
            if (!map[clientId].last_lead_ts || ts > map[clientId].last_lead_ts) map[clientId].last_lead_ts = ts;
          });

          // convert map -> campaignAgg
          Object.keys(map).forEach((k) => {
            campaignAgg[k] = {
              leads_7d: map[k].leads_7d,
              leads_30d: map[k].leads_30d,
              campanhas_ativas: map[k].campanhas.size,
              last_lead_date: map[k].last_lead_ts ? new Date(map[k].last_lead_ts).toISOString() : null,
              daily: map[k].daily,
            } as any;
          });
        }
      } catch (e) {
        console.debug("campaign_leads_daily missing or error", e);
      }

      // 5) process accounts: OBSERVE que usamos cliente_id para buscar aggregates
      const processed: AccountData[] = (accountsData || []).map((acc: any) => {
        const manager = (managersData || []).find((m: any) => m.id === acc.gestor_id);
        const cliente = (clientesData || []).find((c: any) => c.id === acc.cliente_id);
        const agg = campaignAgg[acc.cliente_id] || {
          leads_7d: 0,
          leads_30d: 0,
          campanhas_ativas: 0,
          last_lead_date: null,
          daily: {},
        };

        return {
          ...acc,
          gestor_name: manager?.name || "—",
          cliente_nome: cliente?.nome || "—",
          total_budget: (acc.budget_mensal_meta || 0) + (acc.budget_mensal_google || 0),
          leads_7d: agg.leads_7d || 0,
          leads_30d: agg.leads_30d || 0,
          campanhas_ativas: agg.campanhas_ativas || 0,
          last_lead_date: agg.last_lead_date,
        } as AccountData;
      });

      setAccounts(processed);
      setManagers(managersData || []);
      setClientes(clientesData || []);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Filters
  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.nome_cliente?.toLowerCase().includes(q) ||
        (a.nome_empresa || "").toLowerCase().includes(q) ||
        (a.cliente_nome || "").toLowerCase().includes(q);
      const matchesStatus = filterStatus === "Todos os Status" || a.status === filterStatus;
      const matchesGestor = filterGestor === "Todos os Gestores" || a.gestor_id === filterGestor;
      const matchesCampaigns = !onlyHasCampaigns || (a.campanhas_ativas && a.campanhas_ativas > 0);
      return matchesSearch && matchesStatus && matchesGestor && matchesCampaigns;
    });
  }, [accounts, searchTerm, filterStatus, filterGestor, onlyHasCampaigns]);

  // KPIs - richer
  const stats = useMemo(() => {
    const total = accounts.length;
    const ativos = accounts.filter((a) => a.status === "Ativo").length;
    const pausados = accounts.filter((a) => a.status === "Pausado").length;
    const arquivados = accounts.filter((a) => a.status === "Arquivado").length;
    const metaConfigured = accounts.filter(
      (a) => a.meta_account_id && String(a.meta_account_id).trim().length > 0,
    ).length;
    const googleConfigured = accounts.filter(
      (a) => a.google_ads_id && String(a.google_ads_id).trim().length > 0,
    ).length;
    const saldoTotal = accounts.reduce((s, a) => s + (a.saldo_meta || 0), 0);
    const leads30Total = accounts.reduce((s, a) => s + (a.leads_30d || 0), 0);
    return { total, ativos, pausados, arquivados, metaConfigured, googleConfigured, saldoTotal, leads30Total };
  }, [accounts]);

  // helpers
  const getInitials = (name?: string) =>
    (name || "??")
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatCurrency = (value: number | undefined | null) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(
      (value || 0) / 100,
    );

  const percentChange = (prev = 0, curr = 0) => {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  };

  // actions
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account: AccountData) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleView = (accountId: string) => {
    navigate(`/contas/${accountId}`);
  };

  // small inline sparkline generator from daily object (expects object { '2025-10-01': 4, ... })
  const InlineSparkline: React.FC<{ daily?: Record<string, number> }> = ({ daily = {} }) => {
    const days = 14; // últimos 14 dias
    const now = new Date();
    const arr: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push(daily[key] || 0);
    }
    const max = Math.max(...arr, 1);
    const points = arr.map((v, i) => `${(i * 100) / (days - 1)},${100 - (v / max) * 100}`).join(" ");
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-6">
        <polyline
          fill="none"
          strokeWidth={1.5}
          points={points}
          stroke="currentColor"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // UI render
  return (
    <AppLayout>
      <TooltipProvider delayDuration={180}>
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Carteira de Contas</h1>
              <p className="text-text-secondary mt-1 max-w-2xl">
                Visão centrada em campanhas — métricas por conta, configuração de plataformas e gestor responsável.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button onClick={handleCreateAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Conta
              </Button>
            </div>
          </div>

          {/* KPI ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Ativos</p>
                    <p className="text-2xl font-bold">{stats.ativos}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Pausados: {stats.pausados} • Arquivados: {stats.arquivados}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Meta Ads (config)</p>
                    <p className="text-2xl font-bold">{stats.metaConfigured}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <Target className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Google Ads (config)</p>
                    <p className="text-2xl font-bold">{stats.googleConfigured}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Saldo Total (Meta)</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.saldoTotal)}</p>
                      <p className="text-xs text-text-secondary mt-1">Leads (últimos 30d): {stats.leads30Total}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end text-sm text-text-secondary">
                    <span>Foco em campanhas — clique em qualquer conta para abrir detalhes</span>
                    <span className="mt-1">Filtros: Gestor • Status • Campanhas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                className="pl-9 h-12"
                placeholder="Buscar por conta, empresa ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar contas"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos os Status">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterGestor} onValueChange={setFilterGestor}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos os Gestores">Todos os Gestores</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={onlyHasCampaigns ? "secondary" : "outline"}
              onClick={() => setOnlyHasCampaigns((v) => !v)}
              className="h-12"
            >
              <Zap className="h-4 w-4 mr-2" /> Só com campanhas
            </Button>
          </div>

          {/* Accounts list - foco campanhas */}
          <div className="space-y-3">
            {loading ? (
              <Card className="surface-elevated p-6">
                <CardContent>
                  <p>Carregando contas...</p>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="surface-elevated">
                <CardContent className="p-12 text-center">
                  <p className="text-lg font-semibold mb-2">Nenhuma conta encontrada</p>
                  <p className="text-text-secondary">Ajuste filtros ou crie uma nova conta.</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((acc) => {
                const metaConfigured = !!(acc.meta_account_id && String(acc.meta_account_id).trim().length > 0);
                const googleConfigured = !!(acc.google_ads_id && String(acc.google_ads_id).trim().length > 0);

                // exibir se tem dado "hoje"
                const lastLeadToday =
                  acc.last_lead_date &&
                  new Date(acc.last_lead_date).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

                // percentual: comparamos 7d com média do resto do mês (exemplo simples)
                const leads7 = acc.leads_7d || 0;
                const leads30 = acc.leads_30d || 0;
                const prev7Approx = Math.max(0, leads30 - leads7); // aproximação
                const change7vsPrev = percentChange(prev7Approx / 3, leads7); // tentativa simples

                return (
                  <Card key={acc.id} className="surface-elevated hover:shadow-lg transition-all">
                    <CardHeader className="p-4 md:p-5">
                      <div className="flex items-start md:items-center justify-between gap-4">
                        {/* left */}
                        <div className="flex items-start gap-4 min-w-0">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {getInitials(acc.nome_cliente)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground text-lg truncate">{acc.nome_cliente}</h3>
                              <Badge
                                className={
                                  acc.status === "Ativo"
                                    ? "bg-success text-white"
                                    : acc.status === "Pausado"
                                      ? "bg-warning text-white"
                                      : "bg-text-muted text-white"
                                }
                              >
                                {acc.status || "—"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mt-1">
                              <span className="truncate">{acc.cliente_nome}</span>
                              <span>
                                • Gestor: <strong className="text-foreground">{acc.gestor_name}</strong>
                              </span>
                              <span>
                                • Campanhas ativas: <strong>{acc.campanhas_ativas || 0}</strong>
                              </span>
                              <span>
                                • Leads (30d): <strong>{acc.leads_30d || 0}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* right controls */}
                        <div className="flex items-center gap-3">
                          {/* budgets */}
                          <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs text-text-secondary">Budget (mensal)</span>
                            <div className="text-sm font-semibold">{formatCurrency(acc.total_budget)}</div>
                            <div className="text-xs text-text-secondary mt-1">
                              Meta: {acc.budget_mensal_meta ? formatCurrency(acc.budget_mensal_meta) : "—"} • Google:{" "}
                              {acc.budget_mensal_google ? formatCurrency(acc.budget_mensal_google) : "—"}
                            </div>
                          </div>

                          {/* platform badges with tooltip only if configured */}
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${metaConfigured ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-transparent border-border/40 text-text-muted"}`}
                                >
                                  <Building2 className="h-3.5 w-3.5" /> Meta
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {metaConfigured
                                  ? "Meta Ads configurado"
                                  : "Meta não configurado (adicione meta_account_id)"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${googleConfigured ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-transparent border-border/40 text-text-muted"}`}
                                >
                                  <Target className="h-3.5 w-3.5" /> Google
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {googleConfigured
                                  ? "Google Ads configurado"
                                  : "Google não configurado (adicione google_ads_id)"}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* actions */}
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Ações">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(acc.id)}>
                                  <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(acc)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* body: campanhas + observações */}
                    <CardContent className="pt-0 pb-4 px-4 md:px-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                          {/* Here we show a highlighted area with campaign summary */}
                          <div className="rounded-lg border p-3 bg-surface">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-text-secondary">Resumo de campanhas</p>
                                <p className="font-semibold text-foreground">
                                  {acc.campanhas_ativas || 0} campanhas ativas • {acc.leads_30d || 0} leads (30d)
                                </p>
                                <div className="flex items-center gap-3 text-sm text-text-secondary mt-2">
                                  <span>
                                    7d: <strong className="text-foreground">{acc.leads_7d || 0}</strong>
                                  </span>
                                  <span>
                                    Variação (7d vs prev): <strong>{change7vsPrev}%</strong>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {lastLeadToday ? <span className="text-green-600">● Hoje</span> : <span>● —</span>}
                                    <small className="text-text-secondary">
                                      Último lead:{" "}
                                      {acc.last_lead_date
                                        ? new Date(acc.last_lead_date).toLocaleDateString("pt-BR")
                                        : "—"}
                                    </small>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                {/* sparkline placeholder: if quiser puxar daily também, adaptar para expor daily na acc */}
                                <div className="inline-flex items-center gap-2">
                                  {/* Sparkline is only decorative: implement real data if daily foi incluído no acc */}
                                  <InlineSparkline daily={{}} />
                                </div>
                              </div>
                            </div>

                            {/* optional small sparkline placeholder */}
                            <div className="mt-3 w-full h-12 rounded-md bg-gradient-to-r from-primary/5 to-accent/5 flex items-center px-3 text-xs text-text-secondary">
                              Gráfico rápido: (se disponível, aqui ficarão os dados de desempenho por dia)
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="rounded-lg border p-3 h-full flex flex-col gap-3">
                            <div>
                              <p className="text-sm text-text-secondary">Saldo Meta</p>
                              <p className="font-semibold">{formatCurrency(acc.saldo_meta)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-text-secondary">Contato / Gestor</p>
                              <p className="font-semibold">{acc.gestor_name}</p>
                            </div>
                            {acc.observacoes && (
                              <div>
                                <p className="text-sm text-text-secondary">Observações</p>
                                <p className="text-sm text-muted-foreground truncate">{acc.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
