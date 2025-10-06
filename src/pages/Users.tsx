// src/pages/Users.tsx
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Plus, 
  Users, 
  Shield,
  UserCheck,
  User,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  ChevronRight,
  Filter,
  Mail,
  Phone,
  Building2,
  Calendar,
  Lock,
  Unlock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Usuario {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'gestor' | 'usuario';
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
  telefone: string | null;
  departamento: string | null;
  
  // Relacionamentos
  clientes_atribuidos?: any[];
  clientes_acesso?: any[];
  total_clientes?: number;
}

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
}

interface ClienteAcesso {
  cliente_id: string;
  cliente_nome: string;
  nivel_acesso: 'visualizar' | 'editar' | 'total';
}

export default function Users() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  
  // Modals
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  
  // Estados do modal de clientes
  const [gestorClientes, setGestorClientes] = useState<string[]>([]);
  const [usuarioAcessos, setUsuarioAcessos] = useState<ClienteAcesso[]>([]);
  
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Carregar usuário atual
  useEffect(() => {
    loadCurrentUser();
    loadUsuarios();
    loadClientes();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser(profile);
      setIsAdmin(profile?.role === 'admin');
    }
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários
      const { data: usuariosData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar relacionamentos
      const { data: gestorClientesData } = await supabase
        .from('gestor_clientes')
        .select('gestor_id, cliente_id');

      const { data: usuarioClientesData } = await supabase
        .from('usuario_clientes')
        .select('usuario_id, cliente_id, nivel_acesso');

      // Processar dados
      const processedUsuarios = usuariosData?.map(user => {
        const clientesGestor = gestorClientesData?.filter(gc => gc.gestor_id === user.id) || [];
        const clientesUsuario = usuarioClientesData?.filter(uc => uc.usuario_id === user.id) || [];
        
        return {
          ...user,
          total_clientes: user.role === 'admin' 
            ? 999 // Admin tem acesso a todos
            : user.role === 'gestor'
            ? clientesGestor.length
            : clientesUsuario.length
        };
      }) || [];

      setUsuarios(processedUsuarios);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem alterar cargos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Cargo atualizado",
        description: "O cargo do usuário foi atualizado com sucesso",
      });

      loadUsuarios();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro ao atualizar cargo",
        description: "Não foi possível atualizar o cargo do usuário",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (userId: string, ativo: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem alterar status",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      });

      loadUsuarios();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do usuário",
        variant: "destructive"
      });
    }
  };

  const openClientesModal = async (user: Usuario) => {
    setSelectedUser(user);
    
    if (user.role === 'gestor') {
      // Carregar clientes atribuídos ao gestor
      const { data } = await supabase
        .from('gestor_clientes')
        .select('cliente_id')
        .eq('gestor_id', user.id);
      
      setGestorClientes(data?.map(gc => gc.cliente_id) || []);
    } else if (user.role === 'usuario') {
      // Carregar acessos do usuário
      const { data } = await supabase
        .from('usuario_clientes')
        .select('cliente_id, nivel_acesso')
        .eq('usuario_id', user.id);
      
      const acessos = await Promise.all(
        (data || []).map(async (uc) => {
          const cliente = clientes.find(c => c.id === uc.cliente_id);
          return {
            cliente_id: uc.cliente_id,
            cliente_nome: cliente?.nome || 'Cliente não encontrado',
            nivel_acesso: uc.nivel_acesso
          };
        })
      );
      
      setUsuarioAcessos(acessos);
    }
    
    setShowClientesModal(true);
  };

  const toggleClienteGestor = (clienteId: string) => {
    if (gestorClientes.includes(clienteId)) {
      setGestorClientes(gestorClientes.filter(id => id !== clienteId));
    } else {
      setGestorClientes([...gestorClientes, clienteId]);
    }
  };

  const saveClientesChanges = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === 'gestor') {
        // Buscar atribuições atuais
        const { data: currentAssignments } = await supabase
          .from('gestor_clientes')
          .select('cliente_id')
          .eq('gestor_id', selectedUser.id);

        const currentClienteIds = currentAssignments?.map(gc => gc.cliente_id) || [];
        
        // Determinar o que adicionar e remover
        const toAdd = gestorClientes.filter(id => !currentClienteIds.includes(id));
        const toRemove = currentClienteIds.filter(id => !gestorClientes.includes(id));

        // Adicionar novos
        if (toAdd.length > 0) {
          const { error } = await supabase
            .from('gestor_clientes')
            .insert(
              toAdd.map(cliente_id => ({
                gestor_id: selectedUser.id,
                cliente_id,
                atribuido_por: currentUser.id
              }))
            );
          if (error) throw error;
        }

        // Remover desvinculados
        if (toRemove.length > 0) {
          const { error } = await supabase
            .from('gestor_clientes')
            .delete()
            .eq('gestor_id', selectedUser.id)
            .in('cliente_id', toRemove);
          if (error) throw error;
        }
      }

      toast({
        title: "Alterações salvas",
        description: "Os clientes foram atualizados com sucesso",
      });

      setShowClientesModal(false);
      loadUsuarios();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (user: Usuario) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso",
      });

      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsuarios();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o usuário",
        variant: "destructive"
      });
    }
  };

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter(user => {
    const matchSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = filterRole === 'todos' || user.role === filterRole;
    const matchStatus = filterStatus === 'todos' || 
      (filterStatus === 'ativo' && user.ativo) ||
      (filterStatus === 'inativo' && !user.ativo);
    
    return matchSearch && matchRole && matchStatus;
  });

  // Estatísticas
  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    gestores: usuarios.filter(u => u.role === 'gestor').length,
    usuarios: usuarios.filter(u => u.role === 'usuario').length,
    ativos: usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length,
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500 text-white">Admin</Badge>;
      case 'gestor':
        return <Badge className="bg-blue-500 text-white">Gestor</Badge>;
      default:
        return <Badge>Usuário</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca acessou';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Usuários</h1>
          </div>
          <div className="text-center py-8">
            Carregando usuários...
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
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os usuários e suas permissões
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gestores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.gestores}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usuarios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os cargos</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {usuario.name ? usuario.name[0].toUpperCase() : usuario.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{usuario.name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{usuario.email}</p>
                          {usuario.telefone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {usuario.telefone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {isAdmin ? (
                        <Select 
                          value={usuario.role}
                          onValueChange={(value) => updateRole(usuario.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="usuario">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(usuario.role)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {usuario.departamento || '-'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      {usuario.role === 'admin' ? (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Acesso Total
                        </Badge>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openClientesModal(usuario)}
                          disabled={!isAdmin}
                        >
                          <Building2 className="mr-1 h-3 w-3" />
                          {usuario.total_clientes || 0} clientes
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Switch
                            checked={usuario.ativo}
                            onCheckedChange={(checked) => toggleStatus(usuario.id, checked)}
                          />
                        ) : (
                          usuario.ativo ? (
                            <Badge variant="outline" className="text-green-600 gap-1">
                              <Unlock className="h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 gap-1">
                              <Lock className="h-3 w-3" />
                              Inativo
                            </Badge>
                          )
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(usuario.ultimo_acesso)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteUser(usuario)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredUsuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Clientes */}
        <Dialog open={showClientesModal} onOpenChange={setShowClientesModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Gerenciar Clientes - {selectedUser?.name || selectedUser?.email}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.role === 'gestor' 
                  ? 'Selecione os clientes que este gestor pode gerenciar'
                  : 'Configure o acesso deste usuário aos clientes'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedUser?.role === 'gestor' && (
                <div>
                  <Label className="mb-3 block">Clientes Atribuídos</Label>
                  <div className="space-y-2">
                    {clientes.map(cliente => (
                      <div key={cliente.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={gestorClientes.includes(cliente.id)}
                          onCheckedChange={() => toggleClienteGestor(cliente.id)}
                        />
                        <Label className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-sm text-muted-foreground">{cliente.email}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedUser?.role === 'usuario' && (
                <div>
                  <Label className="mb-3 block">Clientes com Acesso</Label>
                  <div className="space-y-3">
                    {usuarioAcessos.map(item => (
                      <div key={item.cliente_id} className="flex items-center justify-between border rounded p-3">
                        <span className="font-medium">{item.cliente_nome}</span>
                        <Select
                          value={item.nivel_acesso}
                          onValueChange={(value) => {
                            // Atualizar nivel de acesso
                            const newAcessos = usuarioAcessos.map(a => 
                              a.cliente_id === item.cliente_id 
                                ? { ...a, nivel_acesso: value as any }
                                : a
                            );
                            setUsuarioAcessos(newAcessos);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visualizar">Visualizar</SelectItem>
                            <SelectItem value="editar">Editar</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => {
                      // Adicionar novo cliente
                      toast({
                        title: "Em desenvolvimento",
                        description: "Funcionalidade em desenvolvimento",
                      });
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                  </Button>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientesModal(false)}>
                Cancelar
              </Button>
              <Button onClick={saveClientesChanges}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o usuário {selectedUser?.name || selectedUser?.email}?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Remover Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Criação (placeholder) */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Funcionalidade em desenvolvimento
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}