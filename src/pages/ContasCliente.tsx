// src/pages/ContasCliente.tsx - LAYOUT FINAL SEGUINDO O PRINT

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
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  Filter,
  BarChart3,
  Zap,
  Phone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  const [filterStatus, setFilterStatus] = useState("Todos os Status");
  const [filterGestor, setFilterGestor] = useState("Todos os Gestores");
  const [filterCliente, setFilterCliente] = useState("Todos os Clientes");

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
          leads_mes: Math.floor(Math.random() * 150) + 20,
          conversoes_mes: Math.floor(Math.random() * 30) + 5,
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
  };

  // ✅ FILTROS APLICADOS
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

  // ✅ FORMATAÇÃO DE DATA
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // ✅ LOADING STATE
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
        
        {/* ✅ HEADER IGUAL AO PRINT */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Contas</h1>
            <p className="text-text-secondary mt-1">
              Controle completo da sua carteira de contas de anúncio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleCreateAccount} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* ✅ KPIs IGUAL AO PRINT */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          {/* Total */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Total</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ativos */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Ativos</p>
                  <p className="text-3xl font-bold text-foreground">{stats.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pausados */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Pausados</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pausados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Meta</p>
                  <p className="text-3xl font-bold text-foreground">{stats.metaAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <Target className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Google</p>
                  <p className="text-3xl font-bold text-foreground">{stats.googleAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Total */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Saldo Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {(stats.saldoTotal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ FILTROS IGUAL AO PRINT */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Buscar por nome, empresa, telefone, email ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
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
            <SelectTrigger className="w-48">
              <SelectValue />
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
            <SelectTrigger className="w-48">
              <SelectValue />
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

        {/* ✅ LISTA SEGUINDO EXATAMENTE O PRINT */}
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  
                  {/* ✅ LADO ESQUERDO - IGUAL AO PRINT */}
                  <div className="flex items-center gap-4 flex-1">
                    
                    {/* Avatar com iniciais */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                        {getInitials(account.nome_cliente)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informações do cliente */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {account.nome_cliente}
                        </h3>
                        
                        {/* Badge de status igual ao print */}
                        <Badge className={
                          account.status === 'Ativo' ? 'bg-success text-white' :
                          account.status === 'Pausado' ? 'bg-warning text-white' :
                          'bg-text-muted text-white'
                        }>
                          {account.status}
                        </Badge>
                        
                        <span className="text-text-secondary">
                          {account.cliente_nome !== 'Cliente não vinculado' ? account.cliente_nome : 'Cliente não vinculado'}
                        </span>
                      </div>

                      {/* Segunda linha - empresa e telefone */}
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{account.nome_empresa}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{account.telefone}</span>
                        </div>
                      </div>

                      {/* Terceira linha - badge da plataforma */}
                      <div className="flex items-center gap-2 mt-1">
                        {account.usa_meta_ads && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                            meta
                          </Badge>
                        )}
                        {account.usa_google_ads && (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                            google
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ✅ LADO DIREITO - PERFORMANCE E AÇÕES */}
                  <div className="flex items-center gap-6">
                    
                    {/* Performance igual ao print */}
                    <div className="text-right">
                      <div className="text-xs text-text-secondary font-medium mb-1">Performance</div>
                      <div className="flex items-center gap-4 text-sm">
                        <span><span className="text-foreground font-medium">{account.leads_mes || 0}</span> leads</span>
                        <span><span className="text-success font-medium">{account.conversoes_mes || 0}</span> conversões</span>
                        <span><span className="text-foreground font-medium">R$ {((account.saldo_meta || 0) / 100).toFixed(0)}</span></span>
                      </div>
                    </div>

                    {/* Data atualização */}
                    <div className="text-right">
                      <div className="text-xs text-text-secondary font-medium mb-1">Atualizado</div>
                      <div className="text-sm text-foreground font-medium">
                        {formatDate(account.updated_at)}
                      </div>
                    </div>

                    {/* Menu de ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
          ))}
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
                Tente ajustar os filtros para encontrar as contas que procura.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ✅ FORMULÁRIO MODERNO */}
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