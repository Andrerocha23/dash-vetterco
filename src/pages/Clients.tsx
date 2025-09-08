import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Archive, Edit } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientsService, Client } from "@/mocks/clientsService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
import { ClienteFormData } from "@/types/client";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        const data = await clientsService.getClients();
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [toast]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.manager.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && client.status === "Active") ||
      (statusFilter === "archived" && client.status === "Archived");

    return matchesSearch && matchesStatus;
  });

  const handleArchiveClient = async (clientId: string) => {
    try {
      await clientsService.archiveClient(clientId);
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, status: "Archived" as const }
          : client
      ));
      toast({
        title: "Cliente Arquivado",
        description: "Cliente foi arquivado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao arquivar cliente",
        variant: "destructive",
      });
    }
  };

  const handleSaveClient = async (clientData: ClienteFormData) => {
    try {
      if (editingClient) {
        await clientsService.update(editingClient.id, clientData);
        setClients(prev => prev.map(client => 
          client.id === editingClient.id 
            ? {
                ...client,
                name: clientData.nomeCliente,
                channels: clientData.canais as ('Meta' | 'Google')[],
                status: clientData.status === 'Ativo' ? 'Active' : 'Archived',
                metaBalance: (clientData.saldoMeta || 0) / 100,
              }
            : client
        ));
        setEditingClient(null);
        setShowEditModal(false);
      } else {
        const newClient = await clientsService.create(clientData);
        setClients(prev => [newClient, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleEditClient = (client: Client) => {
    const clientFormData: ClienteFormData = {
      id: client.id,
      nomeCliente: client.name,
      nomeEmpresa: client.name,
      telefone: "+55 (11) 99999-9999",
      email: "cliente@empresa.com",
      gestorId: "gest1",
      canais: client.channels,
      status: client.status === 'Active' ? 'Ativo' : 'Arquivado',
      usaMetaAds: client.channels.includes('Meta'),
      usaGoogleAds: client.channels.includes('Google'),
      traqueamentoAtivo: false,
      saldoMeta: client.metaBalance * 100,
    };
    
    setEditingClient(client);
    setShowEditModal(true);
  };

  const getChannelBadges = (channels: Client['channels']) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`
          ${channel === 'Meta' 
            ? 'border-primary text-primary bg-primary/10' 
            : 'border-muted-foreground text-muted-foreground bg-secondary/50'
          }
        `}
      >
        {channel}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e campanhas publicitárias
            </p>
          </div>
          <ClienteFormModal
            mode="create"
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSubmit={handleSaveClient}
            trigger={
              <Button variant="apple" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Novo Cliente</span>
              </Button>
            }
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/30 border-border h-11"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto sm:overflow-x-visible">
            {[
              { key: "active", label: "Ativos" },
              { key: "archived", label: "Arquivados" },
              { key: "all", label: "Todos" }
            ].map((status) => (
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
                  {searchQuery || statusFilter !== "all" 
                    ? "Tente ajustar sua busca ou filtros" 
                    : "Comece adicionando seu primeiro cliente"
                  }
                </p>
                {!searchQuery && statusFilter === "active" && (
                  <ClienteFormModal
                    mode="create" 
                    open={showCreateModal}
                    onOpenChange={setShowCreateModal}
                    onSubmit={handleSaveClient}
                    trigger={
                      <Button variant="apple" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Primeiro Cliente
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredClients.map((client) => (
                    <MobileTableCard
                      key={client.id}
                      title={client.name}
                      subtitle={`${client.activeCampaigns} campanhas ativas • ${client.manager.name} • ${new Date(client.createdOn).toLocaleDateString()}`}
                      badges={[
                        ...client.channels.map(channel => ({
                          label: channel,
                          variant: "outline" as const,
                          className: channel === 'Meta' 
                            ? 'border-primary text-primary bg-primary/10' 
                            : 'border-muted-foreground text-muted-foreground bg-secondary/50'
                        })),
                        {
                          label: client.status === "Active" ? "Ativo" : "Arquivado",
                          variant: client.status === "Active" ? "default" : "secondary" as const,
                          className: client.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/50" : ""
                        }
                      ]}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      actions={
                        <>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Canais</TableHead>
                        <TableHead>Gestor</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow 
                          key={client.id}
                          className="cursor-pointer hover:bg-secondary/30"
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
                            {new Date(client.createdOn).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={client.status === "Active" ? "default" : "secondary"}
                              className={client.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/50" : ""}
                            >
                              {client.status === "Active" ? "Ativo" : "Arquivado"}
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
                              <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clients/${client.id}`);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClient(client);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {client.status === "Active" && (
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveClient(client.id);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Arquivar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <ClienteFormModal
          mode="edit"
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setEditingClient(null);
          }}
          initialValues={{
            id: editingClient.id,
            nomeCliente: editingClient.name,
            nomeEmpresa: editingClient.name,
            telefone: "+55 (11) 99999-9999",
            email: "cliente@empresa.com",
            gestorId: "gest1",
            canais: editingClient.channels,
            status: editingClient.status === 'Active' ? 'Ativo' : 'Arquivado',
            usaMetaAds: editingClient.channels.includes('Meta'),
            usaGoogleAds: editingClient.channels.includes('Google'),
            traqueamentoAtivo: false,
            saldoMeta: editingClient.metaBalance * 100,
          }}
          onSubmit={handleSaveClient}
        />
      )}
    </AppLayout>
  );
}