import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAccountHealth, type AccountHealthStatus, type HealthCheckResult } from "@/lib/accounts-health";
import { Sparkline } from "@/components/charts/Sparkline";

// Exportamos o tipo para que o `accounts-health.ts` possa importá-lo
export interface AccountData {
  id: string;
  nome_cliente: string;
  nome_empresa?: string;
  telefone?: string;
  email?: string | null;
  gestor_id?: string;
  cliente_id?: string;
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
  leads_mes?: number;
  campanhas_ativas?: number;
  // Novos dados de performance e saúde
  daily_leads?: { date: string; leads: number }[];
  health?: HealthCheckResult;
}

interface Manager {
  id: string;
  name: string;
  avatar_url?: string;
}

export default function ContasCliente() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Ativo"); // Padrão para Ativo
  const [filterGestor, setFilterGestor] = useState("Todos os Gestores");
  const [filterHealth, setFilterHealth] = useState("all"); // ok, warning, danger

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (accountsError) throw accountsError;
      const { data: managersData } = await supabase.from("managers").select("id, name, avatar_url").order("name");
      const { data: clientesData } = await supabase.from("clientes").select("id, nome").order("nome");

      // Chamada da nossa "Super Função"
      const { data: perfData, error: perfError } = await supabase.rpc("get_accounts_performance_summary");
      if (perfError) throw perfError;

      const performanceMap = new Map((perfData || []).map((p: any) => [p.account_id, p]));

      const processed: AccountData[] = (accountsData || []).map((acc: any) => {
        const manager = (managersData || []).find((m: any) => m.id === acc.gestor_id);
        const cliente = (clientesData || []).find((c: any) => c.id === acc.cliente_id);
        const perf = performanceMap.get(acc.id);

        const accountWithPerf: AccountData = {
          ...acc,
          gestor_name: manager?.name || "—",
          cliente_nome: cliente?.nome || "—",
          total_budget: (acc.budget_mensal_meta || 0) + (acc.budget_mensal_google || 0),
          leads_mes: perf?.total_leads_30d || 0,
          campanhas_ativas: perf?.active_campaigns_count || 0,
          daily_leads: perf?.daily_leads || [],
        };

        // Camada de Inteligência: Calcula a saúde da conta
        accountWithPerf.health = getAccountHealth(accountWithPerf);
        return accountWithPerf;
      });

      setAccounts(processed);
      setManagers(managersData || []);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as contas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return accounts
      .filter((a) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q || a.nome_cliente?.toLowerCase().includes(q) || a.nome_empresa?.toLowerCase().includes(q);
        const matchesStatus = filterStatus === "Todos os Status" || a.status === filterStatus;
        const matchesGestor = filterGestor === "Todos os Gestores" || a.gestor_id === filterGestor;
        const matchesHealth = filterHealth === "all" || a.health?.status === filterHealth;
        return matchesSearch && matchesStatus && matchesGestor && matchesHealth;
      })
      .sort((a, b) => {
        // Ordena para mostrar problemas primeiro
        const order: Record<AccountHealthStatus, number> = { danger: 1, warning: 2, ok: 3, neutral: 4 };
        return order[a.health?.status || "neutral"] - order[b.health?.status || "neutral"];
      });
  }, [accounts, searchTerm, filterStatus, filterGestor, filterHealth]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const ativos = accounts.filter((a) => a.status === "Ativo").length;
    const comProblemas = accounts.filter((a) => a.health?.status === "danger" || a.health?.status === "warning").length;
    const leadsTotal = accounts.reduce((s, a) => s + (a.leads_mes || 0), 0);
    return { total, ativos, comProblemas, leadsTotal };
  }, [accounts]);

  const getInitials = (name?: string) =>
    (name || "??")
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const formatCurrency = (value: number | undefined | null) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value || 0) / 100);

  const HealthIndicator = ({ status, message }: { status?: AccountHealthStatus; message?: string }) => {
    const healthInfo = {
      ok: { icon: <CheckCircle className="h-6 w-6 text-success" />, color: "border-l-success" },
      warning: { icon: <AlertCircle className="h-6 w-6 text-warning" />, color: "border-l-warning" },
      danger: { icon: <XCircle className="h-6 w-6 text-destructive" />, color: "border-l-destructive" },
      neutral: { icon: <HelpCircle className="h-6 w-6 text-muted-foreground" />, color: "border-l-border" },
    }[status || "neutral"];
    return (
      <Tooltip>
        <TooltipTrigger className={`flex items-center justify-center p-4 h-full ${healthInfo.color} border-l-4`}>
          {healthInfo.icon}
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || "Status indefinido"}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <AppLayout>
      <TooltipProvider delayDuration={180}>
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 pb-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Carteira de Contas</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Painel de inteligência para identificar a saúde e performance de cada conta.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
              </Button>
              <Button onClick={() => navigate("/contas/nova")} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Conta
              </Button>
            </div>
          </div>

          {/* KPI ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contas Ativas</p>
                  <p className="text-2xl font-bold">{stats.ativos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Com Alertas</p>
                  <p className="text-2xl font-bold">{stats.comProblemas}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-teal-500/10">
                  <Target className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads (30d)</p>
                  <p className="text-2xl font-bold">{stats.leadsTotal}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-sky-500/10">
                  <DollarSign className="h-6 w-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11"
                placeholder="Buscar por conta ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterHealth} onValueChange={setFilterHealth}>
              <SelectTrigger className="w-full md:w-52 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda a Carteira</SelectItem>
                <SelectItem value="danger">Somente com Perigo</SelectItem>
                <SelectItem value="warning">Somente com Avisos</SelectItem>
                <SelectItem value="ok">Somente Contas OK</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 h-11">
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
              <SelectTrigger className="w-full md:w-48 h-11">
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
          </div>

          {/* Accounts list */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">Carregando contas...</CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-lg font-semibold mb-2">Nenhuma conta encontrada</p>
                  <p className="text-muted-foreground">Ajuste os filtros ou crie uma nova conta.</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((acc) => (
                <Card key={acc.id} className="surface-elevated hover:shadow-lg transition-shadow flex overflow-hidden">
                  <HealthIndicator status={acc.health?.status} message={acc.health?.message} />
                  <div className="flex-1">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {getInitials(acc.nome_cliente)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-semibold text-foreground text-lg truncate hover:underline cursor-pointer"
                                onClick={() => navigate(`/contas/${acc.id}`)}
                              >
                                {acc.nome_cliente}
                              </h3>
                              <Badge variant={acc.status === "Ativo" ? "success" : "secondary"}>{acc.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              Gestor: <strong className="text-foreground/80">{acc.gestor_name}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Ações">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/contas/${acc.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/contas/${acc.id}/editar`)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="rounded-lg border p-3 bg-background/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-center">
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Leads (30d)</p>
                              <p className="font-bold text-xl text-foreground">{acc.leads_mes || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
                              <p className="font-semibold">{acc.campanhas_ativas || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Saldo Meta</p>
                              <p className="font-semibold">{formatCurrency(acc.saldo_meta)}</p>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">Performance de Leads (30d)</p>
                            {acc.daily_leads && acc.daily_leads.length > 1 ? (
                              <Sparkline data={acc.daily_leads} />
                            ) : (
                              <div className="w-full h-[60px] rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                                {(acc.campanhas_ativas ?? 0) > 0
                                  ? "Aguardando dados de performance..."
                                  : "Sem campanhas ativas para gerar dados."}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
