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
import { 
  Search, 
  Plus, 
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
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  usa_meta_ads: boolean;
  usa_google_ads: boolean;
  traqueamento_ativo: boolean;
  saldo_meta: number | null;
  meta_account_id: string | null;
  google_ads_id: string | null;
  cliente_id: string | null;
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

interface Cliente {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  instagram_handle: string | null;
  site: string | null;
}

const STATUS_OPTIONS = [
  { value: 'Ativo', label: 'Ativo', color: 'bg-success', textColor: 'text-success' },
  { value: 'Pausado', label: 'Pausado', color: 'bg-warning', textColor: 'text-warning' },
  { value: 'Arquivado', label: 'Arquivado', color: 'bg-text-muted', textColor: 'text-text-muted' }
];

const CANAIS_OPTIONS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Orgânico'];

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [filterCliente, setFilterCliente] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    nome_cliente: '',
    nome_empresa: '',
    telefone: '',
    email: '',
    gestor_id: '',
    cliente_id: '',
    canais: [] as string[],
    status: 'Ativo'
  });
  const { toast } = useToast();

  // Carregar contas, gestores e clientes do banco
  const loadAccountsData = async () => {
    try {
      setLoading(true);

      // Buscar contas (renomeada de clients)
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

      // Buscar stats de leads (se disponível)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_stats')
        .select('client_id, total_leads, leads_convertidos, valor_total_conversoes');

      if (leadsError) console.warn('Leads stats not available:', leadsError);

      // Processar dados combinados
      const processedAccounts: AccountData[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        const cliente = clientesData?.find(c => c.id === account.cliente_id);
        const stats = leadsData?.find(s => s.client_id === account.id);

        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado',
          cliente_nome: cliente?.nome || 'Cliente não vinculado',
          stats: stats ? {
            total_leads: stats.total_leads || 0,
            conversoes: stats.leads_convertidos || 0,
            gasto_total: stats.valor_total_conversoes || 0
          } : undefined
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

  // Criar nova conta
  const handleCreateAccount = async () => {
    try {
      if (!newAccountData.nome_cliente || !newAccountData.telefone || !newAccountData.cliente_id) {
        toast({
          title: "Erro",
          description: "Preencha nome, telefone e selecione um cliente",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('accounts')
        .insert({
          ...newAccountData,
          email: newAccountData.email || null
        });

      if (error) throw error;

      await loadAccountsData();
      setShowCreateModal(false);
      setNewAccountData({
        nome_cliente: '',
        nome_empresa: '',
        telefone: '',
        email: '',
        gestor_id: '',
        cliente_id: '',
        canais: [],
        status: 'Ativo'
      });

      toast({
        title: "Sucesso",
        description: `Conta ${newAccountData.nome_cliente} criada`,
      });

    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta",
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

  // Navegar para detalhes da conta
  const handleViewAccount = (accountId: string) => {
    navigate(`/contas/${accountId}`);
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.telefone.includes(searchTerm) ||
                         account.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    const matchesManager = filterManager === "all" || account.gestor_id === filterManager;
    const matchesCliente = filterCliente === "all" || account.cliente_id === filterCliente;
    
    return matchesSearch && matchesStatus && matchesManager && matchesCliente;
  });

  // Stats gerais
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(c => c.status === 'Ativo').length;
  const pausedAccounts = accounts.filter(c => c.status === 'Pausado').length;
  const metaAccounts = accounts.filter(c => c.usa_meta_ads || c.canais.includes('Meta')).length;
  const googleAccounts = accounts.filter(c => c.usa_google_ads || c.canais.includes('Google')).length;
  const totalBalance = accounts.reduce((sum, c) => sum + ((c.saldo_meta || 0) / 100), 0);

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge className={`text-xs text-white ${statusInfo.color}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`text-xs ${
          channel === 'Meta' ? 'border-primary text-primary' : 
          channel === 'Google' ? 'border-warning text-warning' :
          'border-accent text-accent'
        }`}
      >
        {channel}
      </Badge>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              onClick={loadAccountsData}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              className="gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total</p>
                  <p className="text-2xl font-bold text-foreground">{totalAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{activeAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Pausados</p>
                  <p className="text-2xl font-bold text-foreground">{pausedAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Meta</p>
                  <p className="text-2xl font-bold text-foreground">{metaAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Target className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Google</p>
                  <p className="text-2xl font-bold text-foreground">{googleAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Saldo Total</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por gestor" />
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
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por cliente" />
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
          </CardContent>
        </Card>

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Account Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-white font-bold">
                        {account.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {account.nome_cliente}
                        </h3>
                        {getStatusBadge(account.status)}
                        {account.cliente_nome && (
                          <Badge variant="secondary" className="text-xs">
                            {account.cliente_nome}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {account.nome_empresa}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {account.telefone}
                        </span>
                        {account.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {account.email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {getChannelBadges(account.canais)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6">
                    {account.stats && (
                      <div className="text-right">
                        <div className="text-sm text-text-secondary mb-1">Performance</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-foreground font-medium">
                            {account.stats.total_leads} leads
                          </span>
                          <span className="text-success font-medium">
                            {account.stats.conversoes} conversões
                          </span>
                          <span className="text-text-secondary">
                            {formatCurrency(account.stats.gasto_total)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-sm text-text-secondary mb-1">Atualizado</div>
                      <div className="text-sm text-foreground">
                        {formatDate(account.updated_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewAccount(account.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/contas/${account.id}/editar`)}>
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
                        {account.status !== 'Arquivado' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(account.id, 'Arquivado')}
                            className="text-destructive"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arquivar conta
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
            <Card className="surface-elevated">
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
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira conta
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Account Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Conta</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova conta de anúncio
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cliente_id" className="text-right">
                  Cliente *
                </Label>
                <Select 
                  value={newAccountData.cliente_id} 
                  onValueChange={(value) => setNewAccountData(prev => ({ ...prev, cliente_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome_cliente" className="text-right">
                  Nome da Conta *
                </Label>
                <Input
                  id="nome_cliente"
                  value={newAccountData.nome_cliente}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, nome_cliente: e.target.value }))}
                  className="col-span-3"
                  placeholder="Nome da conta de anúncio"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome_empresa" className="text-right">
                  Empresa
                </Label>
                <Input
                  id="nome_empresa"
                  value={newAccountData.nome_empresa}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, nome_empresa: e.target.value }))}
                  className="col-span-3"
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  value={newAccountData.telefone}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, telefone: e.target.value }))}
                  className="col-span-3"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newAccountData.email}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gestor_id" className="text-right">
                  Gestor
                </Label>
                <Select 
                  value={newAccountData.gestor_id} 
                  onValueChange={(value) => setNewAccountData(prev => ({ ...prev, gestor_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateAccount}>
                Criar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}