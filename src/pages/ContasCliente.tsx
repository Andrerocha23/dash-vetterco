// src/pages/ContasCliente.tsx - UI/UX POLIDO + TOOLTIP DINÂMICO (FUNÇÕES INTACTAS)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ModernAccountForm } from "@/components/forms/ModernAccountForm";
import { 
  Search, 
  Plus, 
  Users, 
  Building2,
  RefreshCw,
  MoreVertical,
  Edit,
  Eye,
  Archive,
  BarChart3,
  Zap,
  Phone,
  Facebook,
  Chrome,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AccountData {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  telefone: string;
  email: string | null;
  gestor_id: string;
  cliente_id: string;
  canais: string[];
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;

  // Canais/IDs
  usa_meta_ads?: boolean;
  meta_account_id?: string;
  saldo_meta?: number;
  budget_mensal_meta?: number;
  usa_google_ads?: boolean;
  google_ads_id?: string;
  budget_mensal_google?: number;

  // Outros
  link_drive?: string;
  canal_relatorio?: string;
  horario_relatorio?: string;

  // Calculados
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

export default function ContasCliente() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    ativos: 0,
    pausados: 0,
    arquivados: 0,
    metaAds: 0,
    googleAds: 0,
    saldoTotal: 0
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos os Status");
  const [filterGestor, setFilterGestor] = useState("Todos os Gestores");
  const [filterCliente, setFilterCliente] = useState("Todos os Clientes");

  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  useEffect(() => {
    loadAccountsData();
  }, []);

  // === CARREGAMENTO (inalterado) ===
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (accountsError) throw accountsError;

      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('id, name')
        .eq('status', 'active');
      if (managersError) console.warn('Gestores não encontrados:', managersError);

      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      if (clientesError) console.warn('Clientes não encontrados:', clientesError);

      const processedAccounts: AccountData[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        const cliente = clientesData?.find(c => c.id === account.cliente_id);

        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado',
          cliente_nome: cliente?.nome || 'Cliente não vinculado',
          total_budget: (account.budget_mensal_meta || 0) + (account.budget_mensal_google || 0),
          leads_mes: Math.floor(Math.random() * 150) + 20,
          conversoes_mes: Math.floor(Math.random() * 30) + 5,
        };
      });

      const calculatedStats: StatsData = {
        total: processedAccounts.length,
        ativos: processedAccounts.filter(a => a.status === 'Ativo').length,
        pausados: processedAccounts.filter(a => a.status === 'Pausado').length,
        arquivados: processedAccounts.filter(a => a.status === 'Arquivado').length,
        metaAds: processedAccounts.filter(a => a.usa_meta_ads).length,
        googleAds: processedAccounts.filter(a => a.usa_google_ads).length,
        saldoTotal: processedAccounts.reduce((sum, a) => sum + (a.saldo_meta || 0), 0),
      };

      setAccounts(processedAccounts);
      setManagers(managersData || []);
      setClientes(clientesData || []);
      setStats(calculatedStats);

    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccountsData();
    setRefreshing(false);
  };

  // === FILTROS (inalterado) ===
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.telefone.includes(searchTerm) ||
      (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "Todos os Status" || account.status === filterStatus;
    const matchesGestor = filterGestor === "Todos os Gestores" || account.gestor_id === filterGestor;
    const matchesCliente = filterCliente === "Todos os Clientes" || account.cliente_id === filterCliente;
    return matchesSearch && matchesStatus && matchesGestor && matchesCliente;
  });

  // === AÇÕES (inalteradas) ===
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowModernForm(true);
  };

  const handleEditAccount = (account: AccountData) => {
    setEditingAccount(account);
    setShowModernForm(true);
  };

  const handleViewAccount = (accountId: string) => {
    navigate(`/contas/${accountId}`);
  };

  const handleAccountSubmit = async (data: any) => {
    try {
      const accountData = {
        nome_cliente: data.nome_cliente,
        nome_empresa: data.nome_empresa,
        telefone: data.telefone,
        email: data.email || null,
        gestor_id: data.gestor_id,
        cliente_id: data.cliente_id,
        status: data.status,
        observacoes: data.observacoes || null,
        canais: data.canais || [],
        canal_relatorio: data.canal_relatorio,
        horario_relatorio: data.horario_relatorio,
        // Meta
        usa_meta_ads: data.usa_meta_ads || false,
        meta_account_id: data.meta_account_id || null,
        budget_mensal_meta: data.budget_mensal_meta || 0,
        saldo_meta: data.saldo_meta || 0,
        // Google
        usa_google_ads: data.usa_google_ads || false,
        google_ads_id: data.google_ads_id || null,
        budget_mensal_google: data.budget_mensal_google || 0,
        // Outros
        link_drive: data.link_drive || null,
        updated_at: new Date().toISOString()
      };

      if (editingAccount) {
        const { error } = await supabase.from('accounts').update(accountData).eq('id', editingAccount.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Conta atualizada com sucesso" });
      } else {
        const { error } = await supabase.from('accounts').insert({
          ...accountData,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
        toast({ title: "Sucesso", description: "Conta criada com sucesso" });
      }

      await loadAccountsData();
      setShowModernForm(false);
      setEditingAccount(null);

    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: `Não foi possível salvar a conta: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // === Helpers (inalterados) ===
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando contas...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-12 h-32 bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />

          <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Gestão de Contas</h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  Controle a sua carteira de contas de anúncio com filtros rápidos, métricas claras e ações diretas.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Atualizar lista de contas"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button onClick={handleCreateAccount} className="gap-2" aria-label="Criar nova conta">
                  <Plus className="h-4 w-4" />
                  Nova Conta
                </Button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Total</p>
                      <p className="text-3xl md:text-4xl font-semibold tabular-nums text-foreground">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-success/10 ring-1 ring-success/20">
                      <Users className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Ativos</p>
                      <p className="text-3xl md:text-4xl font-semibold tabular-nums text-foreground">{stats.ativos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-warning/10 ring-1 ring-warning/20">
                      <Zap className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Pausados</p>
                      <p className="text-3xl md:text-4xl font-semibold tabular-nums text-foreground">{stats.pausados}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                      <BarChart3 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Meta</p>
                      <p className="text-3xl md:text-4xl font-semibold tabular-nums text-foreground">{stats.metaAds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                      <Chrome className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Google</p>
                      <p className="text-3xl md:text-4xl font-semibold tabular-nums text-foreground">{stats.googleAds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated group transition-transform hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
                      <Info className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">Saldo Total</p>
                      <p className="text-2xl md:text-3xl font-semibold tabular-nums text-foreground">
                        R$ {(stats.saldoTotal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FILTROS */}
            <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/60 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <Input
                    placeholder="Buscar por nome, empresa, telefone, e-mail ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    aria-label="Buscar contas"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48" aria-label="Filtrar por status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos os Status">Todos os Status</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                    <SelectItem value="Arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterGestor} onValueChange={setFilterGestor}>
                  <SelectTrigger className="w-48" aria-label="Filtrar por gestor">
                    <SelectValue placeholder="Gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos os Gestores">Todos os Gestores</SelectItem>
                    {managers.map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCliente} onValueChange={setFilterCliente}>
                  <SelectTrigger className="w-48" aria-label="Filtrar por cliente">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos os Clientes">Todos os Clientes</SelectItem>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* LISTA DE CONTAS */}
            <div className="space-y-3">
              {filteredAccounts.map((account) => {
                const statusColor =
                  account.status === 'Ativo' ? 'from-success/70 to-success/10' :
                  account.status === 'Pausado' ? 'from-warning/70 to-warning/10' :
                  'from-text-muted/70 to-text-muted/10';

                // --- NOVO: verificação por ID para considerar "configurado"
                const metaConfigured = !!(account.meta_account_id && account.meta_account_id.trim().length > 0);
                const googleConfigured = !!(account.google_ads_id && account.google_ads_id.trim().length > 0);

                // Exibir chip se usa o canal OU se já houver ID salvo (opcional; mantenho visível)
                const showMetaChip = account.usa_meta_ads || metaConfigured;
                const showGoogleChip = account.usa_google_ads || googleConfigured;

                return (
                  <Card
                    key={account.id}
                    className="surface-elevated relative overflow-hidden transition-all hover:ring-1 hover:ring-primary/30 hover:shadow-lg group cursor-pointer"
                    onClick={() => handleViewAccount(account.id)}
                  >
                    {/* faixa lateral de status */}
                    <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${statusColor}`} />
                    <CardContent className="p-4 md:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
                        {/* ESQUERDA */}
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar className="h-12 w-12 ring-1 ring-border/50 group-hover:ring-primary/40 transition">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                              {getInitials(account.nome_cliente)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground text-lg truncate">
                                {account.nome_cliente}
                              </h3>
                              <Badge
                                className={
                                  account.status === 'Ativo' ? 'bg-success text-white' :
                                  account.status === 'Pausado' ? 'bg-warning text-white' :
                                  'bg-text-muted text-white'
                                }
                              >
                                {account.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {account.cliente_nome !== 'Cliente não vinculado' ? account.cliente_nome : 'Cliente não vinculado'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{account.telefone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CANAIS / TOOLTIP DINÂMICO POR ID */}
                        <div className="text-right md:text-left">
                          <div className="text-xs text-text-tertiary font-medium mb-1">Canais</div>
                          <div className="flex items-center md:justify-start justify-end gap-2">
                            {showMetaChip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={[
                                      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border",
                                      metaConfigured
                                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                        : "border-border/40 bg-transparent text-text-muted"
                                    ].join(" ")}
                                  >
                                    <Facebook className="h-3.5 w-3.5" />
                                    Meta
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {metaConfigured ? "Meta Ads configurado" : "Meta Ads não configurado (adicione o ID da conta)."}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {showGoogleChip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={[
                                      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border",
                                      googleConfigured
                                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                                        : "border-border/40 bg-transparent text-text-muted"
                                    ].join(" ")}
                                  >
                                    <Chrome className="h-3.5 w-3.5" />
                                    Google
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {googleConfigured ? "Google Ads configurado" : "Google Ads não configurado (adicione o ID da conta)."}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {!showMetaChip && !showGoogleChip && (
                              <span className="text-text-muted text-sm">Não configurado</span>
                            )}
                          </div>
                        </div>

                        {/* ATUALIZADO */}
                        <div className="text-left md:text-right">
                          <div className="text-xs text-text-tertiary font-medium mb-1">Atualizado</div>
                          <div className="text-sm text-foreground font-medium">
                            {formatDate(account.updated_at)}
                          </div>
                        </div>

                        {/* AÇÕES */}
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:bg-transparent"
                                aria-label="Abrir ações"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAccount(account.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar conta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-warning">
                                <Archive className="h-4 w-4 mr-2" />
                                Arquivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* EMPTY STATE */}
            {filteredAccounts.length === 0 && !loading && (
              <Card className="surface-elevated">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                    <Search className="h-8 w-8 text-text-muted" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Nenhuma conta encontrada</h3>
                  <p className="text-text-secondary mb-6">
                    Ajuste os filtros ou verifique o termo digitado para localizar a conta desejada.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* FORMULÁRIO (inalterado) */}
            <ModernAccountForm
              open={showModernForm}
              onOpenChange={setShowModernForm}
              onSubmit={handleAccountSubmit}
              initialData={editingAccount ? {
                cliente_id: editingAccount.cliente_id,
                nome_cliente: editingAccount.nome_cliente,
                nome_empresa: editingAccount.nome_empresa,
                telefone: editingAccount.telefone,
                email: editingAccount.email || "",
                gestor_id: editingAccount.gestor_id,
                status: editingAccount.status as "Ativo" | "Pausado" | "Arquivado",
                observacoes: editingAccount.observacoes || "",
                canais: editingAccount.canais || [],
                canal_relatorio: (editingAccount.canal_relatorio as "WhatsApp" | "Email" | "Ambos") || "WhatsApp",
                horario_relatorio: editingAccount.horario_relatorio || "09:00",
                usa_meta_ads: editingAccount.usa_meta_ads || false,
                meta_account_id: editingAccount.meta_account_id || "",
                saldo_meta: editingAccount.saldo_meta || 0,
                usa_google_ads: editingAccount.usa_google_ads || false,
                google_ads_id: editingAccount.google_ads_id || "",
                budget_mensal_meta: editingAccount.budget_mensal_meta || 0,
                budget_mensal_google: editingAccount.budget_mensal_google || 0,
              } : undefined}
              isEdit={!!editingAccount}
            />
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
