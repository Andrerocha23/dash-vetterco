import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Building2,
  Phone,
  Mail,
  Instagram,
  Globe,
  RefreshCw,
  MoreVertical,
  Edit,
  Eye,
  Trash2
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

interface Cliente {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  instagram_handle: string | null;
  site: string | null;
  created_at: string;
  updated_at: string;
  total_contas?: number;
}

export default function ClientesNew() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClienteData, setNewClienteData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    instagram_handle: '',
    site: ''
  });
  const { toast } = useToast();

  // Carregar clientes do banco
  const loadClientesData = async () => {
    try {
      setLoading(true);

      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (clientesError) throw clientesError;

      // Buscar quantos accounts cada cliente tem
      const { data: accountsCount, error: accountsError } = await supabase
        .from('accounts')
        .select('cliente_id')
        .not('cliente_id', 'is', null);

      if (accountsError) console.warn('Accounts count not available:', accountsError);

      // Processar dados combinados
      const processedClientes: Cliente[] = (clientesData || []).map(cliente => {
        const totalContas = accountsCount?.filter(a => a.cliente_id === cliente.id).length || 0;
        
        return {
          ...cliente,
          total_contas: totalContas
        };
      });

      setClientes(processedClientes);

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
  const handleCreateCliente = async () => {
    try {
      if (!newClienteData.nome || !newClienteData.telefone) {
        toast({
          title: "Erro",
          description: "Preencha nome e telefone",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .insert({
          ...newClienteData,
          cnpj: newClienteData.cnpj || null,
          email: newClienteData.email || null,
          instagram_handle: newClienteData.instagram_handle || null,
          site: newClienteData.site || null
        });

      if (error) throw error;

      await loadClientesData();
      setShowCreateModal(false);
      setNewClienteData({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        instagram_handle: '',
        site: ''
      });

      toast({
        title: "Sucesso",
        description: `Cliente ${newClienteData.nome} criado`,
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

  // Navegar para detalhes do cliente
  const handleViewCliente = (clienteId: string) => {
    navigate(`/clientes/${clienteId}`);
  };

  // Deletar cliente
  const handleDeleteCliente = async (clienteId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;

      await loadClientesData();

      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso",
      });

    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadClientesData();
  }, []);

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone?.includes(searchTerm) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.cnpj?.includes(searchTerm) ||
                         cliente.instagram_handle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando clientes...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-text-secondary mt-1">
              Gerencie suas organizações/empresas clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={loadClientesData}
            >
              <RefreshCw className="h-4 w-4" />
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total de Clientes</p>
                  <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Building2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total de Contas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clientes.reduce((sum, c) => sum + (c.total_contas || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Com Site</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clientes.filter(c => c.site).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                placeholder="Buscar por nome, telefone, email, CNPJ ou Instagram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        <div className="space-y-4">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Cliente Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-white font-bold">
                        {cliente.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {cliente.nome}
                        </h3>
                        {cliente.total_contas && cliente.total_contas > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {cliente.total_contas} conta{cliente.total_contas > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-text-secondary">
                        {cliente.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {cliente.telefone}
                          </span>
                        )}
                        {cliente.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {cliente.email}
                          </span>
                        )}
                        {cliente.instagram_handle && (
                          <span className="flex items-center gap-1">
                            <Instagram className="h-4 w-4" />
                            @{cliente.instagram_handle}
                          </span>
                        )}
                        {cliente.site && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            Site
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info and Actions */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-text-secondary mb-1">Atualizado</div>
                      <div className="text-sm text-foreground">
                        {formatDate(cliente.updated_at)}
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
                        <DropdownMenuItem onClick={() => handleViewCliente(cliente.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/clientes/${cliente.id}/editar`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCliente(cliente.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredClientes.length === 0 && (
            <Card className="surface-elevated">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-text-secondary mb-4">
                  {searchTerm
                    ? "Tente ajustar os termos de busca para encontrar os clientes que procura."
                    : "Comece criando seu primeiro cliente."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeiro cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Cliente Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova organização/empresa cliente
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">
                  Nome *
                </Label>
                <Input
                  id="nome"
                  value={newClienteData.nome}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, nome: e.target.value }))}
                  className="col-span-3"
                  placeholder="Nome da empresa/organização"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cnpj" className="text-right">
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  value={newClienteData.cnpj}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="col-span-3"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  value={newClienteData.telefone}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, telefone: e.target.value }))}
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
                  value={newClienteData.email}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instagram_handle" className="text-right">
                  Instagram
                </Label>
                <Input
                  id="instagram_handle"
                  value={newClienteData.instagram_handle}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, instagram_handle: e.target.value }))}
                  className="col-span-3"
                  placeholder="empresa"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="site" className="text-right">
                  Site
                </Label>
                <Input
                  id="site"
                  type="url"
                  value={newClienteData.site}
                  onChange={(e) => setNewClienteData(prev => ({ ...prev, site: e.target.value }))}
                  className="col-span-3"
                  placeholder="https://www.empresa.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateCliente}>
                Criar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}