import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Plus, 
  Users, 
  Crown,
  TrendingUp,
  Target,
  BarChart3,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Building,
  Mail,
  Phone,
  Calendar,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ClientData {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  status: string;
  canais: string[];
  meta_account_id?: string;
  google_ads_id?: string;
  created_at: string;
}

interface ManagerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  clients: ClientData[];
  stats: {
    totalClients: number;
    activeClients: number;
    metaClients: number;
    googleClients: number;
    totalLeads: number;
    avgPerformance: number;
  };
}

export default function Managers() {
  const [managers, setManagers] = useState<ManagerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedManager, setExpandedManager] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar gestores e seus clientes do banco
  const loadManagersData = async () => {
    try {
      setLoading(true);

      // Buscar todos os gestores
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (managersError) throw managersError;

      // Buscar todos os clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, 
          nome_cliente, 
          nome_empresa, 
          gestor_id, 
          status, 
          canais,
          meta_account_id,
          google_ads_id,
          created_at
        `)
        .order('nome_cliente');

      if (clientsError) throw clientsError;

      // Buscar stats de leads (se disponível)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_stats')
        .select('client_id, total_leads');

      if (leadsError) console.warn('Leads stats not available:', leadsError);

      // Processar dados combinados
      const processedManagers: ManagerData[] = (managersData || []).map(manager => {
        // Filtrar clientes do gestor
        const managerClients = (clientsData || []).filter(client => 
          client.gestor_id === manager.id
        );

        // Calcular estatísticas
        const activeClients = managerClients.filter(c => c.status === 'Ativo').length;
        const metaClients = managerClients.filter(c => c.meta_account_id).length;
        const googleClients = managerClients.filter(c => c.google_ads_id).length;
        
        // Calcular total de leads do gestor
        const managerLeads = managerClients.reduce((total, client) => {
          const clientLeads = leadsData?.find(l => l.client_id === client.id);
          return total + (clientLeads?.total_leads || 0);
        }, 0);

        return {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          department: manager.department,
          status: manager.status,
          avatar_url: manager.avatar_url,
          created_at: manager.created_at,
          clients: managerClients,
          stats: {
            totalClients: managerClients.length,
            activeClients,
            metaClients,
            googleClients,
            totalLeads: managerLeads,
            avgPerformance: Math.round((activeClients / Math.max(managerClients.length, 1)) * 100)
          }
        };
      });

      setManagers(processedManagers);

    } catch (error) {
      console.error('Erro ao carregar gestores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos gestores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagersData();
  }, []);

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats gerais
  const totalManagers = managers.length;
  const totalClients = managers.reduce((sum, m) => sum + m.stats.totalClients, 0);
  const totalActiveClients = managers.reduce((sum, m) => sum + m.stats.activeClients, 0);
  const totalLeads = managers.reduce((sum, m) => sum + m.stats.totalLeads, 0);
  const avgClientsPerManager = Math.round(totalClients / Math.max(totalManagers, 1));

  const getStatusBadge = (status: string) => {
    const variants = {
      'Ativo': 'default',
      'Pausado': 'secondary',
      'Arquivado': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {status}
      </Badge>
    );
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`text-xs ${
          channel === 'Meta' 
            ? 'border-primary text-primary' 
            : 'border-warning text-warning'
        }`}
      >
        {channel}
      </Badge>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando gestores...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Gestão de Equipes</h1>
            <p className="text-text-secondary mt-1">
              Performance e clientes por gestor
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => loadManagersData()}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Gestor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Gestores</p>
                  <p className="text-2xl font-bold text-foreground">{totalManagers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Building className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total Clientes</p>
                  <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{totalActiveClients}</p>
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
                  <p className="text-text-secondary text-sm">Total Leads</p>
                  <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-text-muted/10">
                  <BarChart3 className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Média/Gestor</p>
                  <p className="text-2xl font-bold text-foreground">{avgClientsPerManager}</p>
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
                  placeholder="Buscar por nome, email ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Managers List */}
        <div className="space-y-4">
          {filteredManagers.map((manager) => (
            <Card key={manager.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-0">
                <Collapsible
                  open={expandedManager === manager.id}
                  onOpenChange={() => setExpandedManager(
                    expandedManager === manager.id ? null : manager.id
                  )}
                >
                  {/* Manager Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-primary text-white font-bold">
                            {manager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Manager Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground text-lg">
                              {manager.name}
                            </h3>
                            {manager.stats.totalClients > avgClientsPerManager && (
                              <Crown className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            {manager.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {manager.email}
                              </div>
                            )}
                            {manager.department && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {manager.department}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Desde {formatDate(manager.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats & Controls */}
                      <div className="flex items-center gap-6">
                        {/* Stats compactas */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-foreground">{manager.stats.totalClients}</p>
                            <p className="text-text-muted text-xs">Clientes</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-success">{manager.stats.activeClients}</p>
                            <p className="text-text-muted text-xs">Ativos</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-primary">{manager.stats.metaClients}</p>
                            <p className="text-text-muted text-xs">Meta</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-warning">{manager.stats.googleClients}</p>
                            <p className="text-text-muted text-xs">Google</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {expandedManager === manager.id ? (
                              <ChevronUp className="h-5 w-5 text-text-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-text-muted" />
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Eye className="h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Atribuir Cliente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Clients List (Expandable) */}
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/20 p-6">
                      <div className="mb-4">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Clientes ({manager.clients.length})
                        </h4>
                      </div>
                      
                      {manager.clients.length > 0 ? (
                        <div className="grid gap-3">
                          {manager.clients.map((client) => (
                            <div 
                              key={client.id}
                              className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                                  {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{client.nome_cliente}</p>
                                  <p className="text-text-tertiary text-xs">{client.nome_empresa}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {getStatusBadge(client.status)}
                                <div className="flex gap-1">
                                  {getChannelBadges(client.canais)}
                                </div>
                                <span className="text-xs text-text-muted ml-2">
                                  {formatDate(client.created_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-text-muted mx-auto mb-2" />
                          <p className="text-text-secondary">Nenhum cliente atribuído</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredManagers.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                <Users className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum gestor encontrado</h3>
              <p className="text-text-secondary">
                {searchTerm ? "Tente ajustar o termo de busca" : "Nenhum gestor cadastrado no sistema"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}