// src/pages/ContasCliente.tsx - VERSÃO CORRIGIDA

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
  TrendingUp
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
  
  // Campos Meta Ads
  usa_meta_ads?: boolean;
  meta_account_id?: string;
  meta_business_id?: string;
  meta_page_id?: string;
  saldo_meta?: number;
  budget_mensal_meta?: number;
  webhook_meta?: string;
  
  // Campos Google Ads
  usa_google_ads?: boolean;
  google_ads_id?: string;
  budget_mensal_google?: number;
  webhook_google?: string;
  
  // Outros campos
  link_drive?: string;
  traqueamento_ativo?: boolean;
  pixel_meta?: string;
  ga4_stream_id?: string;
  canal_relatorio?: string;
  horario_relatorio?: string;
  
  gestor_name?: string;
  cliente_nome?: string;
}

const STATUS_OPTIONS = [
  { value: 'Ativo', label: 'Ativo', color: 'bg-success', textColor: 'text-success' },
  { value: 'Pausado', label: 'Pausado', color: 'bg-warning', textColor: 'text-warning' },
  { value: 'Arquivado', label: 'Arquivado', color: 'bg-text-muted', textColor: 'text-text-muted' }
];

const CANAIS_ICONS = {
  'Meta': { icon: Facebook, color: 'text-blue-600' },
  'Google': { icon: Chrome, color: 'text-red-600' },
  'TikTok': { icon: TrendingUp, color: 'text-pink-600' },
  'LinkedIn': { icon: Building2, color: 'text-blue-700' },
};

export default function ContasCliente() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCliente, setFilterCliente] = useState("all");
  
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  const { toast } = useToast();

  // Carregar contas, gestores e clientes do banco
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      // Buscar contas da tabela accounts (principal)
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

      // Processar dados combinados
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

  // ✅ FUNÇÃO PARA CRIAR/EDITAR CONTA COM MAPEAMENTO CORRETO
  const handleAccountSubmit = async (data: any) => {
    try {
      // Mapear dados do formulário para estrutura do banco
      const accountData = {
        // Dados básicos
        nome_cliente: data.nome_cliente,
        nome_empresa: data.nome_empresa,
        telefone: data.telefone,
        email: data.email || null,
        gestor_id: data.gestor_id,
        cliente_id: data.cliente_id,
        link_drive: data.link_drive || null,
        id_grupo: data.id_grupo || null,
        status: data.status,
        observacoes: data.observacoes || null,

        // Canais e comunicação
        canais: data.canais,
        canal_relatorio: data.canal_relatorio,
        horario_relatorio: data.horario_relatorio,
        templates_padrao: data.templates_padrao || [],
        notificacao_saldo_baixo: data.notificacao_saldo_baixo || false,
        notificacao_erro_sync: data.notificacao_erro_sync || false,
        notificacao_leads_diarios: data.notificacao_leads_diarios || false,

        // Meta Ads
        usa_meta_ads: data.usa_meta_ads,
        ativar_campanhas_meta: data.ativar_campanhas_meta || false,
        meta_account_id: data.meta_account_id || null,
        meta_business_id: data.meta_business_id || null,
        meta_page_id: data.meta_page_id || null,
        modo_saldo_meta: data.modo_saldo_meta || null,
        monitorar_saldo_meta: data.monitorar_saldo_meta || false,
        saldo_meta: data.saldo_meta || null,
        alerta_saldo_baixo: data.alerta_saldo_baixo || null,
        budget_mensal_meta: data.budget_mensal_meta || null,
        link_meta: data.link_meta || null,
        utm_padrao: data.utm_padrao || null,
        webhook_meta: data.webhook_meta || null,

        // Google Ads
        usa_google_ads: data.usa_google_ads,
        google_ads_id: data.google_ads_id || null,
        budget_mensal_google: data.budget_mensal_google || null,
        conversoes: data.conversoes || [],
        link_google: data.link_google || null,
        webhook_google: data.webhook_google || null,

        // Rastreamento
        traqueamento_ativo: data.traqueamento_ativo,
        pixel_meta: data.pixel_meta || null,
        ga4_stream_id: data.ga4_stream_id || null,
        gtm_id: data.gtm_id || null,
        typebot_ativo: data.typebot_ativo || false,
        typebot_url: data.typebot_url || null,

        // Financeiro
        budget_mensal_global: data.budget_mensal_global || null,
        forma_pagamento: data.forma_pagamento || null,
        centro_custo: data.centro_custo || null,
        contrato_inicio: data.contrato_inicio || null,
        contrato_renovacao: data.contrato_renovacao || null,

        // Permissões
        papel_padrao: data.papel_padrao || null,
        usuarios_vinculados: data.usuarios_vinculados || [],
        ocultar_ranking: data.ocultar_ranking || false,
        somar_metricas: data.somar_metricas || true,
        usa_crm_externo: data.usa_crm_externo || false,
        url_crm: data.url_crm || null,

        // Campos obrigatórios do sistema
        user_id: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingAccount) {
        // ✅ ATUALIZAR CONTA EXISTENTE
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
        // ✅ CRIAR NOVA CONTA
        const { error } = await supabase
          .from('accounts')
          .insert(accountData);

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

  // ✅ FUNÇÃO PARA CARREGAR DADOS NA EDIÇÃO
  const handleEditAccount = (account: AccountData) => {
    // Mapear dados da conta para formato do formulário
    const formData = {
      // Dados básicos
      cliente_id: account.cliente_id,
      nome_cliente: account.nome_cliente,
      nome_empresa: account.nome_empresa,
      telefone: account.telefone,
      email: account.email || "",
      gestor_id: account.gestor_id,
      link_drive: account.link_drive || "",
      id_grupo: account.id_grupo || "",
      status: account.status as "Ativo" | "Pausado" | "Arquivado",
      observacoes: account.observacoes || "",

      // Canais e comunicação
      canais: account.canais || [],
      canal_relatorio: (account.canal_relatorio as "WhatsApp" | "Email" | "Ambos") || "WhatsApp",
      horario_relatorio: account.horario_relatorio || "09:00",
      templates_padrao: account.templates_padrao || [],
      notificacao_saldo_baixo: account.notificacao_saldo_baixo || false,
      notificacao_erro_sync: account.notificacao_erro_sync || false,
      notificacao_leads_diarios: account.notificacao_leads_diarios || false,

      // Meta Ads
      usa_meta_ads: account.usa_meta_ads || false,
      ativar_campanhas_meta: account.ativar_campanhas_meta || false,
      meta_account_id: account.meta_account_id || "",
      meta_business_id: account.meta_business_id || "",
      meta_page_id: account.meta_page_id || "",
      modo_saldo_meta: (account.modo_saldo_meta as "Cartão" | "Pix" | "Pré-pago (crédito)") || "Pix",
      monitorar_saldo_meta: account.monitorar_saldo_meta || false,
      saldo_meta: account.saldo_meta || 0,
      alerta_saldo_baixo: account.alerta_saldo_baixo || 100,
      budget_mensal_meta: account.budget_mensal_meta || 0,
      link_meta: account.link_meta || "",
      utm_padrao: account.utm_padrao || "",
      webhook_meta: account.webhook_meta || "",

      // Google Ads
      usa_google_ads: account.usa_google_ads || false,
      google_ads_id: account.google_ads_id || "",
      budget_mensal_google: account.budget_mensal_google || 0,
      conversoes: account.conversoes || [],
      link_google: account.link_google || "",
      webhook_google: account.webhook_google || "",

      // Rastreamento
      traqueamento_ativo: account.traqueamento_ativo || false,
      pixel_meta: account.pixel_meta || "",
      ga4_stream_id: account.ga4_stream_id || "",
      gtm_id: account.gtm_id || "",
      typebot_ativo: account.typebot_ativo || false,
      typebot_url: account.typebot_url || "",

      // Financeiro
      budget_mensal_global: account.budget_mensal_global || 0,
      forma_pagamento: (account.forma_pagamento as "Cartão" | "Pix" | "Boleto" | "Misto") || "Pix",
      centro_custo: account.centro_custo || "",
      contrato_inicio: account.contrato_inicio || "",
      contrato_renovacao: account.contrato_renovacao || "",

      // Permissões
      papel_padrao: (account.papel_padrao as "Usuário padrão" | "Gestor" | "Administrador") || "Usuário padrão",
      usuarios_vinculados: account.usuarios_vinculados || [],
      ocultar_ranking: account.ocultar_ranking || false,
      somar_metricas: account.somar_metricas ?? true,
      usa_crm_externo: account.usa_crm_externo || false,
      url_crm: account.url_crm || "",
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

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Filtros
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.gestor_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    const matchesCliente = filterCliente === "all" || account.cliente_id === filterCliente;

    return matchesSearch && matchesStatus && matchesCliente;
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
            <h1 className="text-2xl sm:text-3xl font-bold">Contas dos Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as contas e campanhas de cada cliente
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
            <Button className="gap-2" onClick={handleCreateAccount}>
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCliente} onValueChange={setFilterCliente}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="surface-elevated hover:surface-hover transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-white font-bold">
                        {account.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg leading-tight">
                        {account.nome_cliente}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {account.cliente_nome}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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

                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Status</span>
                    <Badge variant={account.status === 'Ativo' ? 'success' : account.status === 'Pausado' ? 'warning' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>

                  {/* Canais */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Canais</span>
                    <div className="flex gap-1">
                      {account.canais?.map((canal) => {
                        const canalInfo = CANAIS_ICONS[canal as keyof typeof CANAIS_ICONS];
                        if (canalInfo) {
                          const Icon = canalInfo.icon;
                          return (
                            <div key={canal} className={`p-1 rounded ${canalInfo.color}`}>
                              <Icon className="h-3 w-3" />
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

                  {/* Gestor */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Gestor</span>
                    <span className="text-sm font-medium">{account.gestor_name}</span>
                  </div>

                  {/* Data de criação */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Criado em</span>
                    <span className="text-sm">
                      {new Date(account.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAccounts.length === 0 && (
            <Card className="surface-elevated col-span-full">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-text-secondary mb-4">
                  {searchTerm || filterStatus !== "all" || filterCliente !== "all"
                    ? "Tente ajustar os filtros para encontrar as contas que procura."
                    : "Comece criando sua primeira conta de anúncio."
                  }
                </p>
                {!searchTerm && filterStatus === "all" && filterCliente === "all" && (
                  <Button onClick={handleCreateAccount}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira conta
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ✅ FORMULÁRIO MODERNO COM DADOS MAPEADOS */}
        <ModernAccountForm
          open={showModernForm}
          onOpenChange={setShowModernForm}
          onSubmit={handleAccountSubmit}
          initialData={editingAccount ? {
            // Dados mapeados corretamente para edição
            cliente_id: editingAccount.cliente_id,
            nome_cliente: editingAccount.nome_cliente,
            nome_empresa: editingAccount.nome_empresa,
            telefone: editingAccount.telefone,
            email: editingAccount.email || "",
            gestor_id: editingAccount.gestor_id,
            link_drive: editingAccount.link_drive || "",
            id_grupo: editingAccount.id_grupo || "",
            status: editingAccount.status as "Ativo" | "Pausado" | "Arquivado",
            observacoes: editingAccount.observacoes || "",
            canais: editingAccount.canais || [],
            canal_relatorio: (editingAccount.canal_relatorio as "WhatsApp" | "Email" | "Ambos") || "WhatsApp",
            horario_relatorio: editingAccount.horario_relatorio || "09:00",
            usa_meta_ads: editingAccount.usa_meta_ads || false,
            meta_account_id: editingAccount.meta_account_id || "",
            usa_google_ads: editingAccount.usa_google_ads || false,
            google_ads_id: editingAccount.google_ads_id || "",
            traqueamento_ativo: editingAccount.traqueamento_ativo || false,
            budget_mensal_global: editingAccount.budget_mensal_global || 0,
          } : undefined}
          isEdit={!!editingAccount}
        />
      </div>
    </AppLayout>
  );
}