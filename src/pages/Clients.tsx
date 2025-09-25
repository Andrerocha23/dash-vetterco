import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Archive, 
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  telefone: string;
  email?: string;
  status: string;
  canais: string[];
  gestor_id?: string;
  gestor_name?: string;
  created_at: string;
  updated_at: string;
  usa_meta_ads?: boolean;
  usa_google_ads?: boolean;
  saldo_meta?: number;
  stats?: {
    total_leads: number;
    conversoes: number;
    gasto_total: number;
  };
}

const STATUS_OPTIONS = [
  { value: 'Ativo', label: 'Ativo', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'Pausado', label: 'Pausado', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'Arquivado', label: 'Arquivado', color: 'bg-gray-500', textColor: 'text-gray-600' }
];

const CANAIS_OPTIONS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Orgânico'];

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nome_cliente: '',
    nome_empresa: '',
    telefone: '',
    email: '',
    gestor_id: '',
    canais: [] as string[],
    status: 'Ativo'
  });
  const { toast } = useToast();

  // Carregar clientes e gestores do banco
  const loadClientsData = async () => {
    try {
      setLoading(true);

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Buscar gestores (se a tabela existir)
      let managersData = [];
      try {
        const { data: managersResult, error: managersError } = await supabase
          .from('managers')
          .select('id, name')
          .eq('status', 'active');

        if (!managersError) {
          managersData = managersResult || [];
        }
      } catch (error) {
        console.warn('Managers table not found, using fallback');
        // Gestores mock de fallback
        managersData = [
          { id: 'gest1', name: 'João Silva' },
          { id: 'gest2', name: 'Maria Santos' },
          { id: 'gest3', name: 'Pedro Costa' },
        ];
      }

      // Buscar stats de leads (se a tabela existir)
      let leadsData = [];
      try {
        const { data: leadsResult, error: leadsError } = await supabase
          .from('leads_stats')
          .select('client_id, total_leads, leads_convertidos, valor_total_conversoes');

        if (!leadsError) {
          leadsData = leadsResult || [];
        }
      } catch (error) {
        console.warn('Leads stats table not found');
      }

      // Processar dados combinados
      const processedClients: ClientData[] = (clientsData || []).map(client => {
        const manager = managersData.find(m => m.id === client.gestor_id);
        const stats = leadsData.find(s => s.client_id === client.id);

        return {
          ...client,
          gestor_name: manager?.name || 'Sem gestor',
          stats: stats ? {
            total_leads: stats.total_leads || 0,
            conversoes: stats.leads_convertidos || 0,
            gasto_total: stats.valor_total_conversoes || 0
          } : undefined
        };
      });

      setClients(processedClients);
      setManagers(managersData);

    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo cliente
  const handleCreateClient = async () => {
    try {
      if (!newClientData.nome_cliente || !newClientData.telefone) {
        toast({
          title: "Erro",
          description: "Preencha nome e telefone",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clients')
        .insert({
          ...newClientData,
          email: newClientData.email || null,
          canais: newClientData.canais.length > 0 ? newClientData.canais : ['Meta']
        });

      if (error) throw error;

      await loadClientsData();
      setShowCreateModal(false);
      setNewClientData({
        nome_cliente: '',
        nome_empresa: '',
        telefone: '',
        email: '',
        gestor_id: '',
        canais: [],
        status: 'Ativo'
      });

      toast({
        title: "Sucesso",
        description: `Cliente ${newClientData.nome_cliente} criado`,
      });

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente",
        variant: "destructive",
      });
    }
  };

  // Alterar status do cliente
  const handleChangeStatus = async (clientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      await loadClientsData();

      toast({
        title: "Sucesso",
        description: `Status do cliente alterado para ${newStatus}`,
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

  // Navegar para detalhes do cliente
  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  // Editar cliente
  const handleEditClient = (clientId: string) => {
    navigate(`/clients/${clientId}/edit`);
  };

  useEffect(() => {
    loadClientsData();
  }, []);

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.telefone.includes(searchTerm) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    const matchesManager = filterManager === "all" || client.gestor_id === filterManager;
    
    return matchesSearch && matchesStatus && matchesManager;
  });

  // Calcular estatísticas
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'Ativo').length;
  const pausedClients = clients.filter(c => c.status === 'Pausado').length;
  const metaClients = clients.filter(c => c.usa_meta_ads || c.canais.includes('Meta')).length;
  const googleClients = clients.filter(c => c.usa_google_ads || c.canais.includes('Google')).length;
  const totalBalance = clients.reduce((sum, c) => sum + ((c.saldo_meta || 0) / 100), 0);

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge 
        variant="outline"
        className={`text-xs border ${
          status === 'Ativo' ? 'border-green-500 text-green-600 bg-green-50' : 
          status === 'Pausado' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
          'border-gray-500 text-gray-600 bg-gray-50'
        }`}
      >
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
          channel === 'Meta' ? 'border-blue-500 text-blue-600 bg-blue-50' : 
          channel === 'Google' ? 'border-red-500 text-red-600 bg-red-50' :
          'border-purple-500 text-purple-600 bg-purple-50'
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
            <p className="text-muted-foreground">Carregando clientes...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Gestão de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Controle completo da sua carteira de clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={loadClientsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              className="gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total</p>
                  <p className="text-2xl font-bold">{totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Archive className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Pausados</p>
                  <p className="text-2xl font-bold text-yellow-600">{pausedClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Meta</p>
                  <p className="text-2xl font-bold text-blue-600">{metaClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Building2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Google</p>
                  <p className="text-2xl font-bold text-red-600">{googleClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Saldo Total</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, empresa, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativos</SelectItem>
                  <SelectItem value="Pausado">Pausados</SelectItem>
                  <SelectItem value="Arquivado">Arquivados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterManager} onValueChange={setFilterManager}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Gestores</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Cliente Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{client.nome_cliente}</h3>
                        {getStatusBadge(client.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {client.nome_empresa}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.telefone}
                        </span>
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(client.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getChannelBadges(client.canais)}
                        <Badge variant="secondary" className="text-xs">
                          {client.gestor_name}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-6">
                    {/* Quick Stats */}
                    {client.stats && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{client.stats.total_leads}</p>
                          <p className="text-muted-foreground text-xs">Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{client.stats.conversoes}</p>
                          <p className="text-muted-foreground text-xs">Conversões</p>
                        </div>
                        {client.saldo_meta && (
                          <div className="text-center">
                            <p className="font-semibold text-blue-600">{formatCurrency((client.saldo_meta || 0) / 100)}</p>
                            <p className="text-muted-foreground text-xs">Saldo</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleViewClient(client.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleEditClient(client.id)}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.status === 'Ativo' ? (
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleChangeStatus(client.id, 'Pausado')}
                          >
                            <Archive className="h-4 w-4" />
                            Pausar
                          </DropdownMenuItem>
                        ) : client.status === 'Pausado' ? (
                          <>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleChangeStatus(client.id, 'Ativo')}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reativar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleChangeStatus(client.id, 'Arquivado')}
                            >
                              <Archive className="h-4 w-4" />
                              Arquivar
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleChangeStatus(client.id, 'Ativo')}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reativar
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

        {filteredClients.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterStatus !== "all" || filterManager !== "all"
                  ? "Nenhum cliente corresponde aos critérios de busca."
                  : "Você ainda não possui clientes cadastrados."
                }
              </p>
              {!searchTerm && filterStatus === "all" && filterManager === "all" && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal Criar Cliente */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações básicas do cliente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Cliente *</label>
                <Input
                  value={newClientData.nome_cliente}
                  onChange={(e) => setNewClientData({...newClientData, nome_cliente: e.target.value})}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nome da Empresa</label>
                <Input
                  value={newClientData.nome_empresa}
                  onChange={(e) => setNewClientData({...newClientData, nome_empresa: e.target.value})}
                  placeholder="Ex: Imobiliária Silva"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  value={newClientData.telefone}
                  onChange={(e) => setNewClientData({...newClientData, telefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Gestor</label>
                <Select 
                  value={newClientData.gestor_id} 
                  onValueChange={(value) => setNewClientData({...newClientData, gestor_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateClient}>
                Criar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}