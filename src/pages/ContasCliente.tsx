// src/pages/ContasCliente.tsx - VERSÃO CORRIGIDA SEM ERROS

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
  BarChart3
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
  const [filterStatus, setFilterStatus] = useState("Todos");

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

      // Toast informativo
      toast({
        title: "Dados carregados!",
        description: `${processedAccounts.length} contas encontradas`,
      });

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
      (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.meta_account_id && account.meta_account_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.google_ads_id && account.google_ads_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = filterStatus === "Todos" || account.status === filterStatus;

    return matchesSearch && matchesStatus;
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

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    try {
      let newStatus: string;
      
      // Se for arquivado, volta para ativo
      if (currentStatus === 'Arquivado') {
        newStatus = 'Ativo';
      } 
      // Se for ativo, vai para pausado
      else if (currentStatus === 'Ativo') {
        newStatus = 'Pausado';
      } 
      // Se for pausado, vai para ativo
      else {
        newStatus = 'Ativo';
      }
      
      const { error } = await supabase
        .from('accounts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Conta ${newStatus.toLowerCase()}`,
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

  const handleArchiveAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status: 'Arquivado', updated_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta arquivada",
      });

      await loadAccountsData();
    } catch (error) {
      console.error('Erro ao arquivar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível arquivar a conta",
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
        
        {/* ✅ HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Contas</h1>
            <p className="text-text-secondary mt-1">
              Gerencie todas as contas de anúncio dos seus clientes
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
          </div>
        </div>

        {/* ✅ KPIs HORIZONTAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Total */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Total</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ativas */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Ativos</p>
                  <p className="text-3xl font-bold text-foreground">{stats.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Ads */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Meta Ads</p>
                  <p className="text-3xl font-bold text-foreground">{stats.metaAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <Target className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">Google Ads</p>
                  <p className="text-3xl font-bold text-foreground">{stats.googleAds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ BUSCA E FILTROS */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Buscar por conta ou ID do grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-secondary" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ✅ LISTA HORIZONTAL COM COLUNAS ALINHADAS */}
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  
                  {/* ✅ LADO ESQUERDO - CLIENTE + INFORMAÇÕES */}
                  <div className="flex items-center gap-6 flex-1">
                    
                    {/* Avatar e Nome */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-surface-elevated text-foreground font-bold text-sm border border-border">
                          {getInitials(account.nome_cliente)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {account.nome_cliente}
                          </h3>
                          {/* Status visual */}
                          {account.status === 'Ativo' && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          {account.status === 'Pausado' && (
                            <Clock className="h-4 w-4 text-warning" />
                          )}
                          {account.status === 'Arquivado' && (
                            <Archive className="h-4 w-4 text-text-muted" />
                          )}
                        </div>
                        <div className="text-sm text-text-secondary">
                          ID: {account.meta_account_id || account.google_ads_id || 'Não configurado'}
                        </div>
                      </div>
                    </div>

                    {/* Informações organizadas horizontalmente */}
                    <div className="flex items-center gap-8">
                      
                      {/* Plataformas */}
                      <div className="flex flex-col">
                        <div className="text-xs text-text-secondary font-medium mb-1">Plataformas</div>
                        <div className="flex items-center gap-2">
                          {account.usa_meta_ads && account.meta_account_id ? (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                              <Facebook className="h-3 w-3 mr-1" />
                              Meta
                            </Badge>
                          ) : account.usa_meta_ads ? (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                              <Facebook className="h-3 w-3 mr-1" />
                              Meta (sem ID)
                            </Badge>
                          ) : null}
                          
                          {account.usa_google_ads && account.google_ads_id ? (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                              <Chrome className="h-3 w-3 mr-1" />
                              Google
                            </Badge>
                          ) : account.usa_google_ads ? (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                              <Chrome className="h-3 w-3 mr-1" />
                              Google (sem ID)
                            </Badge>
                          ) : null}
                          
                          {!account.usa_meta_ads && !account.usa_google_ads && (
                            <span className="text-text-muted text-xs">Não configurado</span>
                          )}
                        </div>
                      </div>

                      {/* Budget/mês */}
                      <div className="flex flex-col">
                        <div className="text-xs text-text-secondary font-medium mb-1">Budget/mês</div>
                        <div className="text-sm font-medium">
                          {account.total_budget && account.total_budget > 0 ? (
                            <span className="text-success">
                              R$ {account.total_budget.toLocaleString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-text-muted">Não definido</span>
                          )}
                        </div>
                      </div>

                      {/* Saldo Meta */}
                      <div className="flex flex-col">
                        <div className="text-xs text-text-secondary font-medium mb-1">Saldo Meta</div>
                        <div className="text-sm font-medium">
                          {account.usa_meta_ads ? (
                            account.saldo_meta && account.saldo_meta > 0 ? (
                              <span className="text-success">
                                R$ {(account.saldo_meta / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-warning">R$ 0,00</span>
                            )
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </div>
                      </div>

                      {/* Gestor */}
                      <div className="flex flex-col">
                        <div className="text-xs text-text-secondary font-medium mb-1">Gestor</div>
                        <div className="text-sm font-medium">
                          {account.gestor_name !== 'Gestor não encontrado' ? (
                            <span className="text-foreground">{account.gestor_name}</span>
                          ) : (
                            <span className="text-warning">Não atribuído</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ LADO DIREITO - STATUS E AÇÕES */}
                  <div className="flex items-center gap-4">
                    
                    {/* Status Badge */}
                    <Badge className={
                      account.status === 'Ativo' ? 'bg-success/10 text-success border-success/20' :
                      account.status === 'Pausado' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-text-muted/10 text-text-muted border-text-muted/20'
                    }>
                      {account.status}
                    </Badge>
                    
                    {/* Switch de ativo/pausado */}
                    <Switch 
                      checked={account.status === 'Ativo'}
                      onCheckedChange={() => handleToggleStatus(account.id, account.status)}
                      className="data-[state=checked]:bg-success"
                      disabled={account.status === 'Arquivado'}
                    />

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
                        {account.status !== 'Arquivado' ? (
                          <DropdownMenuItem 
                            onClick={() => handleArchiveAccount(account.id)}
                            className="text-warning"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(account.id, 'Arquivado')}
                            className="text-success"
                          >
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Desarquivar
                          </DropdownMenuItem>
                        )}
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
                {searchTerm || filterStatus !== "Todos"
                  ? "Tente ajustar os filtros para encontrar as contas que procura."
                  : "Comece criando sua primeira conta de anúncio."
                }
              </p>
              {!searchTerm && filterStatus === "Todos" && (
                <Button onClick={handleCreateAccount} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar primeira conta
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ✅ FOOTER */}
        {filteredAccounts.length > 0 && (
          <div className="flex items-center justify-between text-sm text-text-secondary bg-surface-elevated rounded-lg px-4 py-3">
            <span>Dados carregados!</span>
            <span>{filteredAccounts.length} contas encontradas</span>
          </div>
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