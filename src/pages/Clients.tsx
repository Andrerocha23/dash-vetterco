import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Eye, Edit, Archive, ArchiveRestore } from "lucide-react";
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

// Dados dos gestores
const gestores = {
  'gest1': { id: 'gest1', name: 'Carlos Silva', avatar: '👨‍💼' },
  'gest2': { id: 'gest2', name: 'Ana Costa', avatar: '👩‍💼' },
  'gest3': { id: 'gest3', name: 'João Santos', avatar: '🧑‍💼' },
};

// Interface simples para o cliente
interface ClientDisplay {
  id: string;
  name: string;
  manager: { name: string; avatar: string };
  channels: ('Meta' | 'Google')[];
  status: 'Active' | 'Paused' | 'Archived';
  activeCampaigns: number;
  metaBalance: number;
  createdOn: string;
}

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Carregar clientes do banco
  const loadClients = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar dados simples
      const transformedClients: ClientDisplay[] = (data || []).map(client => ({
        id: client.id,
        name: client.nome_cliente,
        manager: gestores[client.gestor_id as keyof typeof gestores] || gestores['gest1'],
        channels: client.canais as ('Meta' | 'Google')[],
        status: client.status === 'Ativo' ? 'Active' : 
               client.status === 'Pausado' ? 'Paused' : 'Archived',
        activeCampaigns: Math.floor(Math.random() * 5) + 1, // Temporário
        metaBalance: (client.saldo_meta || 0) / 100,
        createdOn: client.created_at,
      }));

      setClients(transformedClients);
      
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

  useEffect(() => {
    loadClients();
  }, []);

  // Salvar cliente
  const handleSaveClient = async (clientData: ClienteFormData) => {
    try {
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
      };

      const { error } = await supabase
        .from('clients')
        .insert(supabaseData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cliente criado com sucesso",
      });

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

  // Filtros simples
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && client.status === "Active") ||
      (statusFilter === "archived" && client.status === "Archived");
    
    return matchesSearch && matchesStatus;
  });

  // Badges dos canais
  const getChannelBadges = (channels: string[]) => {
    return channels.map((channel) => (
      <Badge
        key={channel}
        variant="outline"
        className={
          channel === 'Meta'
            ? 'border-primary text-primary bg-primary/10'
            : 'border-muted-foreground text-muted-foreground bg-secondary/50'
        }
      >
        {channel}
      </Badge>
    ));
  };

  const statusFilters = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
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
        {/* Header simples */}
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
              <Button variant="apple" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            }
          />
        </div>

        {/* Filtros limpos */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
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

        {/* Tabela simples */}
        <Card className="surface-elevated">
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
                    variant="apple" 
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
                    <TableHead>Criado em</TableHead>
                    <TableHead>Status</TableHead>
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
                            {client.activeCampaigns} campanhas ativas
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
                        {new Date(client.createdOn).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.status === "Active" ? "default" : "secondary"}
                          className={client.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/50" : ""}
                        >
                          {client.status === "Active" ? "Ativo" : client.status === "Paused" ? "Pausado" : "Arquivado"}
                        </Badge>
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
                              // TODO: Implementar arquivar
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