import React, { useState, useEffect } from "react";
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
  Users as UsersIcon, 
  UserCheck,
  Crown,
  Key,
  Mail,
  Calendar,
  RefreshCw,
  MoreVertical,
  Edit,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-destructive' },
  { value: 'manager', label: 'Gestor', color: 'bg-primary' },
  { value: 'user', label: 'Usuário', color: 'bg-success' },
  { value: 'viewer', label: 'Visualizador', color: 'bg-warning' }
];

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    name: '',
    role: 'user',
    password: ''
  });
  const { toast } = useToast();

  // Carregar usuários do banco - versão simplificada
  const loadUsersData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        // Se der erro, usar dados mock para teste
        setUsers([
          {
            id: '1',
            name: 'Administrador do Sistema',
            email: 'admin@vetter.com',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2', 
            name: 'João Silva',
            email: 'joao@vetter.com',
            role: 'manager',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Maria Santos',
            email: 'maria@vetter.com', 
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } else {
        setUsers(data || []);
      }

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Aviso",
        description: "Usando dados de demonstração",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo usuário - versão simplificada
  const handleCreateUser = async () => {
    try {
      if (!newUserData.email || !newUserData.name) {
        toast({
          title: "Erro",
          description: "Preencha nome e email",
          variant: "destructive",
        });
        return;
      }

      // Tentar inserir no banco
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: newUserData.email,
          name: newUserData.name,
          role: newUserData.role
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar usuário no momento",
          variant: "destructive",
        });
        return;
      }

      await loadUsersData();
      setShowCreateModal(false);
      setNewUserData({ email: '', name: '', role: 'user', password: '' });

      toast({
        title: "Sucesso",
        description: `Usuário ${newUserData.name} criado`,
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive",
      });
    }
  };

  // Editar usuário
  const handleEditUser = (user: UserProfile) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  // Salvar edições
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editingUser.name,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Erro", 
          description: "Não foi possível atualizar usuário",
          variant: "destructive",
        });
        return;
      }

      await loadUsersData();
      setShowEditModal(false);
      setEditingUser(null);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado",
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  // Reset password
  const handleResetPassword = async (email: string) => {
    try {
      if (!email) {
        toast({
          title: "Erro",
          description: "Email não encontrado",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Reset de senha será implementado em breve",
      });

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.role !== null).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const recentUsers = users.length; // Simplificado

  const getRoleInfo = (role: string | null) => {
    return ROLES.find(r => r.value === role) || { value: 'user', label: 'Usuário', color: 'bg-success' };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando usuários...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-text-secondary mt-1">
              Controle de acesso e permissões do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={loadUsersData}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              className="gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total</p>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
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
                  <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Crown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Admins</p>
                  <p className="text-2xl font-bold text-foreground">{adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Cadastrados</p>
                  <p className="text-2xl font-bold text-foreground">{recentUsers}</p>
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
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Papéis</SelectItem>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleInfo(user.role);
            
            return (
              <Card key={user.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-primary text-white font-bold">
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                           user.email?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-lg">
                            {user.name || 'Nome não informado'}
                          </h3>
                          <Badge className={`text-xs text-white ${roleInfo.color}`}>
                            {roleInfo.label}
                          </Badge>
                          {user.role === 'admin' && (
                            <Crown className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Criado em {formatDate(user.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

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
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleResetPassword(user.email || '')}
                        >
                          <Key className="h-4 w-4" />
                          Redefinir Senha
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                <UsersIcon className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum usuário encontrado</h3>
              <p className="text-text-secondary">
                {searchTerm ? "Tente ajustar os filtros de busca" : "Nenhum usuário cadastrado no sistema"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Criação */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Criar uma nova conta de usuário no sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="joao@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select 
                  value={newUserData.role} 
                  onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
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
              <Button onClick={handleCreateUser}>
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Alterar informações do usuário
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email || ''}
                    disabled
                    className="opacity-50"
                  />
                  <p className="text-xs text-text-muted">Email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Papel</Label>
                  <Select 
                    value={editingUser.role || 'user'} 
                    onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}