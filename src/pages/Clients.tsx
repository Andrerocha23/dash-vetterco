import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Eye, Edit, Archive, ArchiveRestore, DollarSign, Target, TrendingUp, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClienteFormData } from "@/types/client";

// Dados dos gestores (isso poderia vir do banco também)
const gestores = {
  'gest1': { id: 'gest1', name: 'Carlos Silva', avatar: '👨‍💼' },
  'gest2': { id: 'gest2', name: 'Ana Costa', avatar: '👩‍💼' },
  'gest3': { id: 'gest3', name: 'João Santos', avatar: '🧑‍💼' },
};

// Interface para o cliente como aparece na tabela
interface ClientDisplay {
  id: string;
  name: string;
  company: string;
  manager: { name: string; avatar: string };
  channels: ('Meta' | 'Google')[];
  status: 'Active' | 'Paused' | 'Archived';
  metaBalance: number;
  totalLeads: number;
  totalSpend: number;
  lastActivity: string;
  createdOn: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalBalance: number;
  totalLeads: number;
}

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    totalBalance: 0,
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "archived">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Função para carregar clientes do banco
  const loadClients = async () => {
    try {
      setLoading(true);
      
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Buscar campanhas para estatísticas
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_leads_daily')
        .select('client_id, leads_count, spend');

      if (campaignsError) throw campaignsError;

      // Transformar dados do banco para o formato da interface
      const transformedClients: ClientDisplay[] = (clientsData || []).map(client => {
        const clientCampaigns = (campaignsData || []).filter(c => c.client_id === client.id);
        const totalLeads = clientCampaigns.reduce((sum, c) => sum + c.leads_count, 0);
        const totalSpend = clientCampaigns.reduce((sum, c) => sum + c.spend, 0);

        return {
          id: client.id,
          name: client.nome_cliente,
          company: client.nome_empresa,
          manager: gestores[client.gestor_id as keyof typeof gestores] || gestores['gest1'],
          channels: client.canais as ('Meta' | 'Google')[],
          status: client.status === 'Ativo' ? 'Active' : 
                 client.status === 'Pausado' ? 'Paused' : 'Archived',
          metaBalance: (client.saldo_meta || 0) / 100,
          totalLeads,
          totalSpend,
          lastActivity: client.updated_at,
          createdOn: client.created_at,
        };
      });

      setClients(transformedClients);

      // Calcular estatísticas gerais
      const totalBalance = transformedClients.reduce((sum, c) => sum + c.metaBalance, 0);
      const totalLeads = transformedClients.reduce((sum, c) => sum + c.totalLeads, 0);
      const activeClients = transformedClients.filter(c => c.status === 'Active').length;

      setStats({
        totalClients: transformedClients.length,
        activeClients,
        totalBalance,
        totalLeads,
      });
      
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

  // Carregar clientes quando o componente montar
  useEffect(() => {
    loadClients();
  }, []);

  // Função para salvar cliente (criar ou editar)
  const handleSaveClient = async (clientData: ClienteFormData) => {
    try {
      // Preparar dados para o Supabase
      const supabaseData = {
        nome_cliente: clientData.nomeCliente,
        nome_empresa: clientData.nomeEmpresa,
        telefone: clientData.telefone,
        email: clientData.email || null,
        gestor_id: clientData.gestorId,
        canais: clientData.canais,
        status: clientData.status,
        observacoes: clientData.observacoes || null,
        usa_meta_ads: clientData.usaMetaAds,
        usa_google_ads: clientData.usaGoogleAds,
        traqueamento_ativo: clientData.traqueamentoAtivo,
        saldo_meta: clientData.saldoMeta ? clientData.saldoMeta * 100 : null,
        budget_mensal_meta: clientData.budgetMensalMeta || null,
        budget_mensal_google: clientData.budgetMensalGoogle || null,
        pixel_meta: clientData.pixelMeta || null,
        ga4_stream_id: clientData.ga4StreamId || null,
        gtm_id: clientData.gtmId || null,
        typebot_ativo: clientData.typebotAtivo || false,
        typebot_url: clientData.typebotUrl || null,
      };

      const { error } = await supabase
        .from('clients')
        .insert(supabaseData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cliente criado com sucesso",
      });

      // Recarregar a lista de clientes
      await loadClients();
      setShowCreateModal(false);

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente",
        variant: "destructive",
      });
    }
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && client.status === "Active") ||
      (statusFilter === "paused" && client.status === "Paused") ||
      (statusFilter === "archived" && client.status === "Archived");
    
    return matchesSearch && matchesStatus;
  });

  // Função para obter badges dos canais
  const getChannelBadges = (channels: string[]) => {
    return channels.map((channel) => (
      <Badge
        key={channel}
        variant="outline"
        className={
          channel === 'Meta'
            ? 'border-blue-500 text-blue-600 bg-blue-50'
            : 'border-red-500 text-red-600 bg-red-50'
        }
      >
        {channel}
      </Badge>
    ));
  };

  // Função para formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filtros de status
  const statusFilters = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "paused", label: "Pausados" },
    { key: "archived", label: "Arquivados" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando clientes...</p>
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
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e campanhas
            </p>
          </div>
          <ClienteFormModal
            mode="create"
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSubmit={handleSaveClient}
            trigger={
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes ou empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {statusFilters.map((status) => (
              <Button
                key={status.key}
                variant={statusFilter === status.key ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setStatusFilter(status.key as typeof statusFilter)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredClients.length} Cliente{filteredClients.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== "active" 
                    ? "Tente ajustar sua busca ou filtros" 
                    : "Comece adicionando seu primeiro cliente"
                  }
                </p>
                {!searchQuery && statusFilter === "active" && (
                  <Button 
                    variant="default" 
                    className="gap-2"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Primeiro Cliente
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {client.company}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {getChannelBadges(client.channels)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{client.manager.avatar}</span>
                          <span className="font-medium">{client.manager.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.totalLeads}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(client.metaBalance)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.status === "Active" ? "default" : "secondary"}
                          className={
                            client.status === "Active" 
                              ? "bg-green-500/20 text-green-600 border-green-500/50" 
                              : client.status === "Paused"
                              ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/50"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/50"
                          }
                        >
                          {client.status === "Active" ? "Ativo" : 
                           client.status === "Paused" ? "Pausado" : "Arquivado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(client.createdOn).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implementar edição
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implementar arquivar/desarquivar
                            }}>
                              {client.status === "Active" ? (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Arquivar
                                </>
                              ) : (
                                <>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Desarquivar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}