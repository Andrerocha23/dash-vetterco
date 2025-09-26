// src/pages/ContasCliente.tsx - VERSÃO SEGUINDO SEU DESIGN SYSTEM

import React, { useState, useEffect } from "react";
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
  ArchiveRestore,
  Facebook,
  Chrome,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  
  // Campos específicos
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
  
  // Dados calculados
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

const STATUS_CONFIG = {
  'Ativo': { 
    color: 'bg-success/10 text-success border-success/20', 
    icon: CheckCircle,
    dot: 'bg-success'
  },
  'Pausado': { 
    color: 'bg-warning/10 text-warning border-warning/20', 
    icon: Clock,
    dot: 'bg-warning'
  },
  'Arquivado': { 
    color: 'bg-text-muted/10 text-text-muted border-text-muted/20', 
    icon: Archive,
    dot: 'bg-text-muted'
  }
};

const CANAL_CONFIG = {
  'Meta': { icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Google': { icon: Chrome, color: 'text-red-500', bg: 'bg-red-500/10' },
  'TikTok': { icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  'LinkedIn': { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-600/10' },
};

export default function ContasCliente() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados principais
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

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCliente, setFilterCliente] = useState("all");
  const [filterGestor, setFilterGestor] = useState("all");

  // Estados do formulário
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadAccountsData();
  }, []);

  // ✅ FUNÇÃO PRINCIPAL DE CARREGAMENTO
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      // Buscar contas (principal)
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      // Buscar gestores
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('id, name')
        .eq('status', 'active');

      if (managersError) console.warn('Gestores não encontrados:', managersError);

      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (clientesError) console.warn('Clientes não encontrados:', clientesError);

      // Processar dados combinados
      const processedAccounts: AccountData[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        const cliente = clientesData?.find(c => c.id === account.cliente_id);

        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado',
          cliente_nome: cliente?.nome || 'Cliente não vinculado',
          total_budget: (account.budget_mensal_meta || 0) + (account.budget_mensal_google || 0),
          leads_mes: Math.floor(Math.random() * 150) + 20, // TODO: Dados reais
          conversoes_mes: Math.floor(Math.random() * 30) + 5, // TODO: Dados reais
        };
      });

      // Calcular estatísticas
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

    } catch (error) {
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

  // ✅ FUNÇÃO DE ATUALIZAÇÃO
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccountsData();
    setRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso",
    });
  };

  // ✅ FILTROS APLICADOS
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.telefone.includes(searchTerm) ||
      (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    const matchesCliente = filterCliente === "all" || account.cliente_id === filterCliente;
    const matchesGestor = filterGestor === "all" || account.gestor_id === filterGestor;

    return matchesSearch && matchesStatus && matchesCliente && matchesGestor;
  });

  // ✅ AÇÕES DAS CONTAS
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

  const handleChangeStatus = async (accountId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status alterado para ${newStatus}`,
      });

      await loadAccountsData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  // ✅ FUNÇÃO PARA SALVAR CONTA (CREATE/UPDATE)
  const handleAccountSubmit = async (data: any) => {
    try {
      const accountData = {
        // Dados básicos
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

        // Meta Ads
        usa_meta_ads: data.usa_meta_ads || false,
        meta_account_id: data.meta_account_id || null,
        budget_mensal_meta: data.budget_mensal_meta || 0,
        saldo_meta: data.saldo_meta || 0,

        // Google Ads
        usa_google_ads: data.usa_google_ads || false,
        google_ads_id: data.google_ads_id || null,
        budget_mensal_google: data.budget_mensal_google || 0,

        // Outros
        link_drive: data.link_drive || null,
        updated_at: new Date().toISOString()
      };

      if (editingAccount) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        });
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('accounts')
          .insert({
            ...accountData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
      }

      // Recarregar dados e fechar modal
      await loadAccountsData();
      setShowModernForm(false);
      setEditingAccount(null);

    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: `Não foi possível salvar a conta: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // ✅ OBTER INICIAIS PARA AVATAR
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contas de Anúncio</h1>
              <p className="text-text-secondary">Gerencie todas as contas de anúncio dos seus clientes</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="surface-elevated">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-text-secondary">Carregando contas...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* ✅ HEADER COM AÇÕES */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas de Anúncio</h1>
            <p className="text-text-secondary">
              {stats.total} {stats.total === 1 ? 'conta' : 'contas'} • {stats.ativos} ativas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            
            <Button onClick={handleCreateAccount} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* ✅ KPIs - SEGUINDO SEU DESIGN */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          
          {/* Total */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ativas */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Ativas</p>
                  <p className="text-2xl font-bold text-success">{stats.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pausadas */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Pausadas</p>
                  <p className="text-2xl font-bold text-warning">{stats.pausados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Ads */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Facebook className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Meta</p>
                  <p className="text-2xl font-bold text-foreground">{stats.metaAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Chrome className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Google</p>
                  <p className="text-2xl font-bold text-foreground">{stats.googleAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arquivadas */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-text-muted/10">
                  <Archive className="h-4 w-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Arquivadas</p>
                  <p className="text-2xl font-bold text-text-muted">{stats.arquivados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Total */}
          <Card className="surface-elevated surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-medium">Saldo</p>
                  <p className="text-lg font-bold text-foreground">
                    R$ {(stats.saldoTotal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ FILTROS */}
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Buscar por nome, empresa, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 input-professional"
                />
              </div>

              {/* Filtro Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Cliente */}
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro Gestor */}
              <Select value={filterGestor} onValueChange={setFilterGestor}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gestores</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        {/* ✅ LISTA DE CONTAS - LAYOUT GRID MODERNO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => {
            const StatusIcon = STATUS_CONFIG[account.status]?.icon || CheckCircle;
            
            return (
              <Card key={account.id} className="surface-elevated surface-hover group">
                <CardContent className="p-6">
                  
                  {/* Header da Conta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(account.nome_cliente)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {account.nome_cliente}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {account.nome_empresa}
                        </p>
                      </div>
                    </div>

                    {/* Menu de Ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {account.status === 'Ativo' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Pausado')}>
                            <Clock className="h-4 w-4 mr-2" />
                            Pausar
                          </DropdownMenuItem>
                        )}
                        {account.status === 'Pausado' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Ativo')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        {account.status !== 'Arquivado' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Arquivado')}>
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        )}
                        {account.status === 'Arquivado' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Ativo')}>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Desarquivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Informações da Conta */}
                  <div className="space-y-4">
                    
                    {/* Status e Cliente */}
                    <div className="flex items-center justify-between">
                      <Badge className={STATUS_CONFIG[account.status]?.color || 'bg-muted'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {account.status}
                      </Badge>
                      
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">Cliente</p>
                        <p className="text-sm font-medium text-foreground">
                          {account.cliente_nome}
                        </p>
                      </div>
                    </div>

                    {/* Canais */}
                    {account.canais && account.canais.length > 0 && (
                      <div>
                        <p className="text-xs text-text-secondary mb-2">Canais ativos</p>
                        <div className="flex flex-wrap gap-2">
                          {account.canais.map((canal) => {
                            const config = CANAL_CONFIG[canal];
                            if (!config) return null;
                            
                            const Icon = config.icon;
                            
                            return (
                              <div
                                key={canal}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md ${config.bg}`}
                              >
                                <Icon className={`h-3 w-3 ${config.color}`} />
                                <span className={`text-xs font-medium ${config.color}`}>
                                  {canal}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {account.leads_mes}
                        </p>
                        <p className="text-xs text-text-secondary">Leads/mês</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {account.conversoes_mes}
                        </p>
                        <p className="text-xs text-text-secondary">Conversões</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-success">
                          R$ {((account.saldo_meta || 0) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-text-secondary">Saldo</p>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="space-y-2 pt-3 border-t border-border">
                      
                      {/* Gestor */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Gestor:</span>
                        <span className="text-foreground font-medium">
                          {account.gestor_name}
                        </span>
                      </div>

                      {/* Horário de Relatório */}
                      {account.horario_relatorio && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Relatório:</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-text-secondary" />
                            <span className="text-foreground font-medium">
                              {account.horario_relatorio} • {account.canal_relatorio || 'WhatsApp'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Budget Mensal */}
                      {account.total_budget > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Budget/mês:</span>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-primary" />
                            <span className="text-foreground font-medium">
                              R$ {account.total_budget.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* IDs das Contas */}
                      <div className="pt-2 space-y-1">
                        {account.meta_account_id && (
                          <div className="flex items-center gap-2 text-xs">
                            <Facebook className="h-3 w-3 text-blue-500" />
                            <span className="text-text-secondary">Meta:</span>
                            <code className="bg-muted/50 px-1 py-0.5 rounded text-foreground">
                              {account.meta_account_id}
                            </code>
                          </div>
                        )}
                        
                        {account.google_ads_id && (
                          <div className="flex items-center gap-2 text-xs">
                            <Chrome className="h-3 w-3 text-red-500" />
                            <span className="text-text-secondary">Google:</span>
                            <code className="bg-muted/50 px-1 py-0.5 rounded text-foreground">
                              {account.google_ads_id}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ✅ EMPTY STATE */}
        {filteredAccounts.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                <Search className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma conta encontrada</h3>
              <p className="text-text-secondary mb-6">
                {searchTerm || filterStatus !== "all" || filterCliente !== "all" || filterGestor !== "all"
                  ? "Tente ajustar os filtros para encontrar as contas que procura."
                  : "Comece criando sua primeira conta de anúncio."
                }
              </p>
              {!searchTerm && filterStatus === "all" && filterCliente === "all" && filterGestor === "all" && (
                <Button onClick={handleCreateAccount} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar primeira conta
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ✅ FOOTER COM INFORMAÇÕES */}
        {filteredAccounts.length > 0 && (
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>
                  Mostrando {filteredAccounts.length} de {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ FORMULÁRIO MODERNO */}
        <ModernAccountForm
          open={showModernForm}
          onOpenChange={setShowModernForm}
          onSubmit={handleAccountSubmit}
          initialData={editingAccount ? {
            // Mapear dados corretamente para edição
            cliente_id: editingAccount.cliente_id,
            nome_cliente: editingAccount.nome_cliente,
            nome_empresa: editingAccount.nome_empresa,
            telefone: editingAccount.telefone,
            email: editingAccount.email || "",
            gestor_id: editingAccount.gestor_id,
            status: editingAccount.status as "Ativo" | "Pausado" | "Arquivado",
            observacoes: editingAccount.observacoes || "",
            canais: editingAccount.canais || [],
            canal_relatorio: editingAccount.canal_relatorio as "WhatsApp" | "Email" | "Ambos" || "WhatsApp",
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
    </AppLayout>
  );
}