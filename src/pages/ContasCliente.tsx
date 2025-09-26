// src/pages/ContasCliente.tsx - DESIGN MODERNO E ELEGANTE

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
  ArchiveRestore,
  Facebook,
  Chrome,
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Pause,
  Phone,
  Calendar,
  TrendingDown,
  ArrowUp,
  ArrowDown
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
  canais: string[];
  status: string;
  observacoes: string | null;
  cliente_id: string;
  created_at: string;
  updated_at: string;
  
  // Campos adicionais
  usa_meta_ads?: boolean;
  meta_account_id?: string;
  saldo_meta?: number;
  usa_google_ads?: boolean;
  google_ads_id?: string;
  budget_mensal_meta?: number;
  budget_mensal_google?: number;
  
  gestor_name?: string;
  cliente_nome?: string;
  
  // Métricas de performance (mock data por enquanto)
  stats?: {
    total_leads: number;
    conversoes: number;
    gasto_total: number;
    ctr?: number;
    cpl?: number;
  };
}

interface KPIData {
  total: number;
  ativos: number;
  pausados: number;
  meta: number;
  google: number;
  saldo_total: number;
}

const CANAIS_ICONS = {
  'Meta': { icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Google': { icon: Chrome, color: 'text-red-500', bg: 'bg-red-500/10' },
  'TikTok': { icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  'LinkedIn': { icon: Building2, color: 'text-blue-700', bg: 'bg-blue-700/10' },
};

export default function ContasCliente() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [filterCliente, setFilterCliente] = useState("all");
  
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  
  const [kpis, setKpis] = useState<KPIData>({
    total: 0,
    ativos: 0,
    pausados: 0,
    meta: 0,
    google: 0,
    saldo_total: 0
  });

  const { toast } = useToast();

  // Calcular KPIs
  const calculateKPIs = (accountsData: AccountData[]) => {
    const total = accountsData.length;
    const ativos = accountsData.filter(acc => acc.status === 'Ativo').length;
    const pausados = accountsData.filter(acc => acc.status === 'Pausado').length;
    const meta = accountsData.filter(acc => acc.canais?.includes('Meta')).length;
    const google = accountsData.filter(acc => acc.canais?.includes('Google')).length;
    const saldo_total = accountsData.reduce((sum, acc) => sum + (acc.saldo_meta || 0), 0);

    setKpis({ total, ativos, pausados, meta, google, saldo_total });
  };

  // Carregar dados
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      // Buscar contas
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

      if (managersError) console.warn('Managers not found:', managersError);

      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (clientesError) console.warn('Clientes not found:', clientesError);

      // Processar dados com stats mockados
      const processedAccounts: AccountData[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        const cliente = clientesData?.find(c => c.id === account.cliente_id);

        // Mock stats para demonstração
        const mockStats = {
          total_leads: Math.floor(Math.random() * 100),
          conversoes: Math.floor(Math.random() * 20),
          gasto_total: Math.floor(Math.random() * 5000),
          ctr: parseFloat((Math.random() * 5).toFixed(2)),
          cpl: parseFloat((Math.random() * 50).toFixed(2)),
        };

        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado',
          cliente_nome: cliente?.nome || 'Cliente não vinculado',
          stats: mockStats,
        };
      });

      setAccounts(processedAccounts);
      setManagers(managersData || []);
      setClientes(clientesData || []);
      calculateKPIs(processedAccounts);

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

  // Função para criar/editar conta
  const handleAccountSubmit = async (data: any) => {
    try {
      const accountData = {
        nome_cliente: data.nome_cliente,
        nome_empresa: data.nome_empresa,
        telefone: data.telefone,
        email: data.email || null,
        gestor_id: data.gestor_id,
        cliente_id: data.cliente_id,
        canais: data.canais,
        status: data.status,
        observacoes: data.observacoes || null,
        usa_meta_ads: data.usa_meta_ads,
        meta_account_id: data.meta_account_id || null,
        saldo_meta: data.saldo_meta || null,
        usa_google_ads: data.usa_google_ads,
        google_ads_id: data.google_ads_id || null,
        budget_mensal_meta: data.budget_mensal_meta || null,
        budget_mensal_google: data.budget_mensal_google || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingAccount) {
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
        const { error } = await supabase
          .from('accounts')
          .insert(accountData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
      }

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

  const handleEditAccount = (account: AccountData) => {
    const formData = {
      cliente_id: account.cliente_id,
      nome_cliente: account.nome_cliente,
      nome_empresa: account.nome_empresa,
      telefone: account.telefone,
      email: account.email || "",
      gestor_id: account.gestor_id,
      status: account.status as "Ativo" | "Pausado" | "Arquivado",
      observacoes: account.observacoes || "",
      canais: account.canais || [],
      usa_meta_ads: account.usa_meta_ads || false,
      meta_account_id: account.meta_account_id || "",
      saldo_meta: account.saldo_meta || 0,
      usa_google_ads: account.usa_google_ads || false,
      google_ads_id: account.google_ads_id || "",
      budget_mensal_meta: account.budget_mensal_meta || 0,
      budget_mensal_google: account.budget_mensal_google || 0,
    };

    setEditingAccount(account);
    setShowModernForm(true);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowModernForm(true);
  };

  const handleChangeStatus = async (accountId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      await loadAccountsData();

      toast({
        title: "Sucesso",
        description: `Status da conta alterado para ${newStatus}`,
      });

    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  const handleViewAccount = (accountId: string) => {
    navigate(`/contas/${accountId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
      case 'Pausado':
        return <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pausado</Badge>;
      case 'Arquivado':
        return <Badge variant="default" className="bg-gray-500/10 text-gray-600 border-gray-500/20">Arquivado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Filtros
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.gestor_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    const matchesManager = filterManager === "all" || account.gestor_id === filterManager;
    const matchesCliente = filterCliente === "all" || account.cliente_id === filterCliente;

    return matchesSearch && matchesStatus && matchesManager && matchesCliente;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Contas</h1>
            <p className="text-muted-foreground mt-1">
              Controle completo da sua carteira de contas de anúncio
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => loadAccountsData()}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleCreateAccount}>
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* KPI Cards - Igual ao seu print */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-600 font-semibold text-sm">Total</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{kpis.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-green-600 font-semibold text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{kpis.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Pause className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-yellow-600 font-semibold text-sm">Pausados</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{kpis.pausados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-600 font-semibold text-sm">Meta</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{kpis.meta}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-900 border-red-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Chrome className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-red-600 font-semibold text-sm">Google</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{kpis.google}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-600 font-semibold text-sm">Saldo Total</p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(kpis.saldo_total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa, telefone, email ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterManager} onValueChange={setFilterManager}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Todos os Gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gestores</SelectItem>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCliente} onValueChange={setFilterCliente}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Contas - Estilo do seu print */}
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Info da conta */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {account.nome_cliente.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {account.nome_cliente}
                        </h3>
                        {getStatusBadge(account.status)}
                        <Badge variant="outline" className="text-xs">
                          {account.cliente_nome || "Cliente não vinculado"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {account.nome_empresa}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {account.telefone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {account.gestor_name}
                        </div>
                        
                        {/* Canais */}
                        <div className="flex gap-1">
                          {account.canais?.map((canal) => {
                            const canalInfo = CANAIS_ICONS[canal as keyof typeof CANAIS_ICONS];
                            if (canalInfo) {
                              const Icon = canalInfo.icon;
                              return (
                                <div key={canal} className={`p-1 rounded ${canalInfo.bg}`}>
                                  <Icon className={`h-3 w-3 ${canalInfo.color}`} />
                                </div>
                              );
                            }
                            return (
                              <Badge key={canal} variant="outline" className="text-xs">
                                {canal}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance metrics */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {account.stats?.total_leads || 0} leads
                      </p>
                      <p className="text-xs text-muted-foreground">Performance</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-success">
                        {account.stats?.conversoes || 0} conversões
                      </p>
                      <p className="text-xs text-muted-foreground">Atualizado</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(account.stats?.gasto_total || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(account.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewAccount(account.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {account.status === 'Ativo' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Pausado')}>
                            <Archive className="mr-2 h-4 w-4" />
                            Pausar conta
                          </DropdownMenuItem>
                        )}
                        {account.status === 'Pausado' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(account.id, 'Ativo')}>
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Ativar conta
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAccounts.length === 0 && (
            <Card className="bg-card/30 backdrop-blur-sm border-border/50">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all" || filterManager !== "all" || filterCliente !== "all"
                    ? "Tente ajustar os filtros para encontrar as contas que procura."
                    : "Comece criando sua primeira conta de anúncio."
                  }
                </p>
                {!searchTerm && filterStatus === "all" && filterManager === "all" && filterCliente === "all" && (
                  <Button onClick={handleCreateAccount} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira conta
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Formulário moderno */}
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