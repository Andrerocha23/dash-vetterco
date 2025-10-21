// src/pages/ContasClienteWithDashboard.tsx
// VERSÃO ATUALIZADA: Clique na conta e veja dashboard completo com gráficos e métricas

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { metaAdsService } from "@/services/metaAdsService";
import { ModernAccountForm } from "@/components/forms/ModernAccountForm";
import { MetaPeriodFilter, type MetaPeriod } from "@/components/meta/MetaPeriodFilter";
import type { MetaAdsResponse, MetaCampaign, MetaAccountMetrics } from "@/types/meta";
import {
  Search, Plus, Users, Building2, RefreshCw, MoreVertical, Edit, Eye,
  Archive, BarChart3, Zap, Facebook, Chrome, Info, Filter, User, Pause,
  Play, X, TrendingUp, TrendingDown, Activity, ArrowLeft, ExternalLink,
  Target, DollarSign, MousePointer
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
         ResponsiveContainer } from 'recharts';

interface AccountData {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  telefone: string;
  email: string | null;
  cliente_id: string;
  canais: string[];
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  usa_meta_ads?: boolean;
  meta_account_id?: string;
  saldo_meta?: number;
  budget_mensal_meta?: number;
  usa_google_ads?: boolean;
  google_ads_id?: string;
  budget_mensal_google?: number;
  link_drive?: string;
  canal_relatorio?: string;
  horario_relatorio?: string;
  gestor_name?: string;
  cliente_nome?: string;
  total_budget?: number;
  leads_mes?: number;
  conversoes_mes?: number;
}

interface StatsData {
  total: number;
  ativos: number;
  pausados: number;
  arquivados: number;
  metaAds: number;
  googleAds: number;
  saldoTotal: number;
}

export default function ContasClienteWithDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados principais
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    total: 0, ativos: 0, pausados: 0, arquivados: 0,
    metaAds: 0, googleAds: 0, saldoTotal: 0,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos os Status");
  const [filterGestor, setFilterGestor] = useState("Todos os Gestores");
  const [filterCliente, setFilterCliente] = useState("Todos os Clientes");

  // Modal de formulário
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  // Dashboard Modal
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<MetaPeriod>("last_7d");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [metaData, setMetaData] = useState<MetaAdsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetaAccountMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);

  useEffect(() => {
    loadAccountsData();
  }, []);

  const loadAccountsData = async () => {
    try {
      setLoading(true);

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select(`*, gestor:profiles!gestor_id(id, name)`)
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;

      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (clientesError) console.warn("Clientes não encontrados:", clientesError);

      const processedAccounts: AccountData[] = (accountsData || []).map((account) => {
        const cliente = clientesData?.find((c) => c.id === account.cliente_id);
        return {
          ...account,
          gestor_name: account.gestor?.name || "-",
          cliente_nome: cliente?.nome || "-",
          total_budget: (account.budget_mensal_meta || 0) + (account.budget_mensal_google || 0),
        };
      });

      setAccounts(processedAccounts);
      setClientes(clientesData || []);

      // Calcular stats
      const newStats: StatsData = {
        total: processedAccounts.length,
        ativos: processedAccounts.filter((a) => a.status === "Ativo").length,
        pausados: processedAccounts.filter((a) => a.status === "Pausado").length,
        arquivados: processedAccounts.filter((a) => a.status === "Arquivado").length,
        metaAds: processedAccounts.filter((a) => a.usa_meta_ads).length,
        googleAds: processedAccounts.filter((a) => a.usa_google_ads).length,
        saldoTotal: processedAccounts.reduce((sum, a) => sum + (a.saldo_meta || 0), 0),
      };
      setStats(newStats);

    } catch (error: any) {
      console.error("Erro ao carregar contas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir dashboard da conta
  const handleViewDashboard = async (account: AccountData) => {
    setSelectedAccount(account);
    setShowDashboard(true);
    
    if (account.meta_account_id) {
      loadMetaData(account.meta_account_id);
    }
  };

  const loadMetaData = async (metaAccountId: string) => {
    setDashboardLoading(true);
    try {
      const data = await metaAdsService.fetchMetaCampaigns(metaAccountId, dashboardPeriod);
      
      if (data?.success) {
        setMetaData(data);
        setMetrics(data.account_metrics || null);
        setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      }
    } catch (error: any) {
      console.error("Erro ao carregar Meta:", error);
      toast({
        title: "Erro ao buscar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  // Recarregar quando mudar período
  useEffect(() => {
    if (showDashboard && selectedAccount?.meta_account_id) {
      loadMetaData(selectedAccount.meta_account_id);
    }
  }, [dashboardPeriod]);

  // KPIs calculados
  const kpis = useMemo(() => {
    if (!metrics) return null;

    const totalSpend = metrics.total_spend || 0;
    const totalConversions = metrics.total_conversions || 0;
    const totalClicks = metrics.total_clicks || 0;
    const totalImpressions = metrics.total_impressions || 0;
    
    const cpl = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      investment: { value: totalSpend, label: "Investimento" },
      impressions: { value: totalImpressions, label: "Impressões" },
      clicks: { value: totalClicks, label: "Cliques" },
      conversions: { value: totalConversions, label: "Conversões" },
      cpl: { value: cpl, label: "CPL" },
      ctr: { value: ctr, label: "CTR" },
      cpc: { value: metrics.avg_cpc || 0, label: "CPC" },
      cpm: { value: metrics.avg_cpm || 0, label: "CPM" },
    };
  }, [metrics]);

  // Gráfico de performance
  const performanceData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    return campaigns.slice(0, 7).map((camp, idx) => ({
      date: `Dia ${idx + 1}`,
      impressions: camp.insights?.impressions || 0,
      clicks: camp.insights?.clicks || 0,
      spend: camp.insights?.spend || 0,
    }));
  }, [campaigns]);

  // Top campanhas
  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => (b.insights?.conversions || 0) - (a.insights?.conversions || 0))
      .slice(0, 5);
  }, [campaigns]);

  // Distribuição de budget
  const budgetDistribution = useMemo(() => {
    const total = campaigns.reduce((sum, c) => sum + (c.insights?.spend || 0), 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return topCampaigns.map((camp, idx) => {
      const spend = camp.insights?.spend || 0;
      return {
        name: camp.name.substring(0, 20) + '...',
        value: total > 0 ? Math.round((spend / total) * 100) : 0,
        spend: spend,
        color: colors[idx] || '#6b7280'
      };
    });
  }, [topCampaigns]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.round(value).toString();
  };

  // Filtros
  const filteredAccounts = accounts.filter((account) => {
    const matchSearch = 
      account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "Todos os Status" || account.status === filterStatus;
    const matchGestor = filterGestor === "Todos os Gestores" || account.gestor_name === filterGestor;
    const matchCliente = filterCliente === "Todos os Clientes" || account.cliente_nome === filterCliente;
    
    return matchSearch && matchStatus && matchGestor && matchCliente;
  });

  const handleEditAccount = (account: AccountData) => {
    setEditingAccount(account);
    setShowModernForm(true);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowModernForm(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contas de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as contas vinculadas às organizações
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadAccountsData} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleCreateAccount} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-500">{stats.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Pause className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pausados</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pausados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Archive className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Arquivados</p>
                  <p className="text-2xl font-bold text-slate-500">{stats.arquivados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Facebook className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Meta Ads</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.metaAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Chrome className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Google Ads</p>
                  <p className="text-2xl font-bold text-red-500">{stats.googleAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Total</p>
                  <p className="text-xl font-bold text-purple-500">
                    {formatCurrency(stats.saldoTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos os Gestores">Todos os Gestores</SelectItem>
                  {Array.from(new Set(accounts.map(a => a.gestor_name))).map(gestor => (
                    <SelectItem key={gestor} value={gestor}>{gestor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos os Clientes">Todos os Clientes</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.nome}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contas */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </>
          ) : filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Nenhuma conta encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-bold">
                          {account.nome_cliente.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{account.nome_cliente}</h3>
                          <Badge variant={account.status === 'Ativo' ? 'default' : 'secondary'}>
                            {account.status}
                          </Badge>
                          {account.usa_meta_ads && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Facebook className="h-4 w-4 text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>Meta Ads Ativo</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {account.usa_google_ads && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Chrome className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>Google Ads Ativo</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {account.nome_empresa}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Gestor: {account.gestor_name}
                          </div>
                          {account.saldo_meta && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Saldo: {formatCurrency(account.saldo_meta)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDashboard(account)}
                        className="gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/contas/${account.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {account.link_drive && (
                            <DropdownMenuItem onClick={() => window.open(account.link_drive, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Google Drive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal de Formulário */}
        {showModernForm && (
          <ModernAccountForm
            account={editingAccount}
            open={showModernForm}
            onClose={() => {
              setShowModernForm(false);
              setEditingAccount(null);
            }}
            onSuccess={() => {
              setShowModernForm(false);
              setEditingAccount(null);
              loadAccountsData();
            }}
          />
        )}

        {/* DASHBOARD MODAL */}
        <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" 
                    alt="Meta" 
                    className="h-6"
                  />
                  <DialogTitle className="text-2xl">
                    {selectedAccount?.nome_cliente}
                  </DialogTitle>
                  <Badge variant={selectedAccount?.status === 'Ativo' ? 'default' : 'secondary'}>
                    {selectedAccount?.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <MetaPeriodFilter value={dashboardPeriod} onChange={setDashboardPeriod} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => selectedAccount?.meta_account_id && loadMetaData(selectedAccount.meta_account_id)}
                    disabled={dashboardLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* KPIs */}
              {dashboardLoading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
                </div>
              ) : kpis ? (
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(kpis).slice(0, 4).map(([key, data]) => (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          {data.label}
                        </p>
                        <p className="text-2xl font-bold">
                          {key === 'investment' || key === 'cpl' || key === 'cpc' || key === 'cpm'
                            ? formatCurrency(data.value)
                            : key === 'ctr'
                            ? data.value.toFixed(2) + '%'
                            : formatNumber(data.value)
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Nenhum dado disponível para este período
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Gráficos */}
              <div className="grid grid-cols-12 gap-6">
                {/* Performance */}
                <Card className="col-span-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-primary" />
                      Desempenho no Período
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardLoading ? (
                      <Skeleton className="h-64" />
                    ) : performanceData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="impressions" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={3}
                              name="Impressões"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="clicks" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              name="Cliques"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top 5 Campanhas */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Top 5 Campanhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardLoading ? (
                      <Skeleton className="h-64" />
                    ) : budgetDistribution.length > 0 ? (
                      <>
                        <div className="h-48 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={budgetDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {budgetDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                            </RePieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          {budgetDistribution.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-semibold">{item.value}%</span>
                                <span className="text-muted-foreground text-xs">
                                  {formatCurrency(item.spend)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Campanhas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Todas as Campanhas ({campaigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : campaigns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-sm">Campanha</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Impressões</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Cliques</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Gasto</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Conversões</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">CPL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map((campaign) => {
                            const spend = campaign.insights?.spend || 0;
                            const conversions = campaign.insights?.conversions || 0;
                            const cpl = conversions > 0 ? spend / conversions : 0;
                            
                            return (
                              <tr 
                                key={campaign.id} 
                                className="border-b border-border hover:bg-muted/50 transition-colors"
                              >
                                <td className="py-4 px-4 font-medium">{campaign.name}</td>
                                <td className="py-4 px-4 text-right">
                                  <Badge 
                                    variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {campaign.status}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {formatNumber(campaign.insights?.impressions || 0)}
                                </td>
                                <td className="py-4 px-4 text-right text-primary font-semibold">
                                  {formatNumber(campaign.insights?.clicks || 0)}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {formatCurrency(spend)}
                                </td>
                                <td className="py-4 px-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                  {conversions}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {formatCurrency(cpl)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma campanha encontrada no período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Conta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações da Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                      <p className="font-semibold">{selectedAccount?.nome_cliente}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                      <p className="font-semibold">{selectedAccount?.nome_empresa}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                      <p className="font-semibold">{selectedAccount?.telefone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-semibold">{selectedAccount?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gestor</p>
                      <p className="font-semibold">{selectedAccount?.gestor_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ID Meta Ads</p>
                      <p className="font-mono text-sm">{selectedAccount?.meta_account_id || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}