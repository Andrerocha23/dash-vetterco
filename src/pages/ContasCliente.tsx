// src/pages/ContasCliente.tsx

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
// ✅ IMPORTAR O NOVO FORMULÁRIO
import { ModernAccountForm } from "@/components/forms/ModernAccountForm";
import { 
  Search, 
  Plus, 
  Users, 
  Building2,
  UserCheck,
  Calendar,
  RefreshCw,
  MoreVertical,
  Edit,
  Eye,
  Archive,
  ArchiveRestore,
  Phone,
  Mail,
  Target,
  BarChart3,
  DollarSign,
  Activity,
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
  gestor_name?: string;
  cliente_nome?: string;
  stats?: {
    total_leads: number;
    conversoes: number;
    gasto_total: number;
  };
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
  const [filterManager, setFilterManager] = useState("all");
  const [filterCliente, setFilterCliente] = useState("all");
  
  // ✅ NOVO ESTADO PARA O FORMULÁRIO MODERNO
  const [showModernForm, setShowModernForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  const { toast } = useToast();

  // Carregar contas, gestores e clientes do banco
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

  // ✅ FUNÇÃO PARA CRIAR/EDITAR CONTA COM NOVO FORMULÁRIO
  const handleAccountSubmit = async (data: any) => {
    try {
      if (editingAccount) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('accounts')
          .update({
            nome_cliente: data.nome_conta,
            cliente_id: data.cliente_id,
            canais: data.plataformas,
            gestor_id: data.gestor_id,
            status: data.status,
            observacoes: data.observacoes,
            updated_at: new Date().toISOString()
          })
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
            nome_cliente: data.nome_conta,
            nome_empresa: data.nome_conta,
            telefone: "000000000", // Campo obrigatório, pode ser preenchido depois
            cliente_id: data.cliente_id,
            canais: data.plataformas,
            gestor_id: data.gestor_id,
            status: data.status,
            observacoes: data.observacoes,
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
        description: "Não foi possível salvar a conta",
        variant: "destructive",
      });
    }
  };

  // Alterar status da conta
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

  // ✅ ABRIR FORMULÁRIO PARA EDIÇÃO
  const handleEditAccount = (account: AccountData) => {
    setEditingAccount(account);
    setShowModernForm(true);
  };

  // ✅ ABRIR FORMULÁRIO PARA CRIAÇÃO
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowModernForm(true);
  };

  // Navegar para detalhes da conta
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
            {/* ✅ BOTÃO PARA NOVO FORMULÁRIO */}
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
                      {/* ✅ EDITAR COM NOVO FORMULÁRIO */}
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
                  {searchTerm || filterStatus !== "all" || filterManager !== "all" || filterCliente !== "all"
                    ? "Tente ajustar os filtros para encontrar as contas que procura."
                    : "Comece criando sua primeira conta de anúncio."
                  }
                </p>
                {!searchTerm && filterStatus === "all" && filterManager === "all" && filterCliente === "all" && (
                  <Button onClick={handleCreateAccount}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira conta
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ✅ NOVO FORMULÁRIO MODERNO */}
        <ModernAccountForm
          open={showModernForm}
          onOpenChange={setShowModernForm}
          onSubmit={handleAccountSubmit}
          initialData={editingAccount ? {
            cliente_id: editingAccount.cliente_id,
            nome_conta: editingAccount.nome_cliente,
            cidade: "", // Extrair da nome_conta se necessário
            segmento: "", // Extrair da nome_conta se necessário
            plataformas: editingAccount.canais || [],
            orcamento_mensal: 1000, // Valor padrão
            gestor_id: editingAccount.gestor_id,
            status: editingAccount.status as "Ativo" | "Pausado" | "Arquivado",
            observacoes: editingAccount.observacoes || "",
          } : undefined}
          isEdit={!!editingAccount}
        />
      </div>
    </AppLayout>
  );
}