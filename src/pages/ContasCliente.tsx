// src/pages/ContasCliente.tsx - SEGUINDO SEU DESIGN EXATO

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
  BarChart3,
  CheckCircle,
  Clock,
  Filter
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
  
  // Campos do banco real
  usa_meta_ads?: boolean;
  meta_account_id?: string;
  saldo_meta?: number;
  usa_google_ads?: boolean;
  google_ads_id?: string;
  budget_mensal_meta?: number;
  budget_mensal_google?: number;
  canal_relatorio?: string;
  horario_relatorio?: string;
  
  gestor_name?: string;
  cliente_nome?: string;
}

interface KPIData {
  total: number;
  ativos: number;
  meta: number;
  google: number;
}

export default function ContasCliente() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  
  const [kpis, setKpis] = useState<KPIData>({
    total: 0,
    ativos: 0,
    meta: 0,
    google: 0
  });

  const { toast } = useToast();

  // Calcular KPIs dos dados reais
  const calculateKPIs = (accountsData: AccountData[]) => {
    const total = accountsData.length;
    const ativos = accountsData.filter(acc => acc.status === 'Ativo').length;
    const meta = accountsData.filter(acc => acc.usa_meta_ads || acc.canais?.includes('Meta')).length;
    const google = accountsData.filter(acc => acc.usa_google_ads || acc.canais?.includes('Google')).length;

    setKpis({ total, ativos, meta, google });
  };

  // Carregar dados reais do banco
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      // Buscar contas reais
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

      // Processar dados reais (SEM MOCK)
      const processedAccounts: AccountData[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        const cliente = clientesData?.find(c => c.id === account.cliente_id);

        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado',
          cliente_nome: cliente?.nome || 'Cliente não vinculado',
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
        canal_relatorio: data.canal_relatorio || null,
        horario_relatorio: data.horario_relatorio || null,
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
      canal_relatorio: account.canal_relatorio as "WhatsApp" | "Email" | "Ambos" || "WhatsApp",
      horario_relatorio: account.horario_relatorio || "09:00",
    };

    setEditingAccount(account);
    setShowModernForm(true);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowModernForm(true);
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Pausado' : 'Ativo';
    
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
        description: `Conta ${newStatus.toLowerCase()}`,
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

  // Gerar iniciais para avatar
  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Gerar ID fake para exibição (como no seu print)
  const getDisplayId = (accountId: string) => {
    // Criar ID similar ao do print baseado no ID real
    const hash = accountId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `ID: 12036${Math.abs(hash).toString().slice(0, 8)}-group`;
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Filtros
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDisplayId(account.id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterValue === "all" || 
      (filterValue === "ativo" && account.status === 'Ativo') ||
      (filterValue === "pausado" && account.status === 'Pausado') ||
      (filterValue === "meta" && (account.usa_meta_ads || account.canais?.includes('Meta'))) ||
      (filterValue === "google" && (account.usa_google_ads || account.canais?.includes('Google')));

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando contas...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - igual ao seu print */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Relatórios N8N</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os disparos automáticos de relatórios para suas contas
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => loadAccountsData()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* KPI Cards - 4 cards horizontais igual ao print */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-400 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold text-white">{kpis.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 text-sm font-medium">Ativos</p>
                  <p className="text-3xl font-bold text-white">{kpis.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-600/10">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-blue-500 text-sm font-medium">Meta Ads</p>
                  <p className="text-3xl font-bold text-white">{kpis.meta}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Chrome className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-orange-400 text-sm font-medium">Google Ads</p>
                  <p className="text-3xl font-bold text-white">{kpis.google}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e filtro - em linha igual ao print */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por conta ou ID do grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800"
            />
          </div>
          
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-32 bg-gray-900/50 border-gray-800">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="pausado">Pausados</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de contas - igual ao seu print */}
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="bg-gray-900/30 border-gray-800 hover:bg-gray-900/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Info da conta - lado esquerdo */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                        {getInitials(account.nome_cliente)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-lg">
                          {account.nome_cliente}
                        </h3>
                        {account.status === 'Ativo' && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {getDisplayId(account.id)}
                      </p>
                    </div>
                  </div>

                  {/* Info da direita - igual ao print */}
                  <div className="flex items-center gap-8">
                    {/* Horário */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-white text-sm">
                        {account.horario_relatorio || '09:00'}
                      </span>
                    </div>

                    {/* Plataforma */}
                    <div className="flex items-center gap-2">
                      {(account.usa_meta_ads || account.canais?.includes('Meta')) && (
                        <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                          Meta
                        </Badge>
                      )}
                      {(account.usa_google_ads || account.canais?.includes('Google')) && (
                        <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Google
                        </Badge>
                      )}
                    </div>

                    {/* Status info */}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Último Envio</p>
                      <p className="text-xs text-gray-500">
                        {account.updated_at ? 'Nunca enviado' : 'Nunca enviado'}
                      </p>
                    </div>

                    {/* Toggle switch */}
                    <Switch 
                      checked={account.status === 'Ativo'}
                      onCheckedChange={() => handleToggleStatus(account.id, account.status)}
                      className="data-[state=checked]:bg-green-500"
                    />

                    {/* Menu actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem onClick={() => handleViewAccount(account.id)} className="text-white hover:bg-gray-800">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAccount(account)} className="text-white hover:bg-gray-800">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar configuração
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-800" />
                        <DropdownMenuItem onClick={handleCreateAccount} className="text-blue-400 hover:bg-gray-800">
                          <Plus className="mr-2 h-4 w-4" />
                          Nova conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAccounts.length === 0 && (
            <Card className="bg-gray-900/30 border-gray-800">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || filterValue !== "all"
                    ? "Tente ajustar os filtros para encontrar as contas que procura."
                    : "Comece criando sua primeira conta de relatório."
                  }
                </p>
                
                {/* Footer info igual ao print */}
                <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-white font-medium">Dados carregados!</span>
                    </div>
                    <span className="text-gray-400">{kpis.total} contas encontradas</span>
                  </div>
                </div>
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