import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Plus, 
  Users, 
  Shield,
  UserCheck,
  UserX,
  Crown,
  Key,
  Mail,
  Calendar,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Settings,
  AlertTriangle
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

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login?: string;
  status: 'active' | 'inactive' | 'suspended';
  clients_count?: number;
  permissions: string[];
}

interface NewUserData {
  email: string;
  name: string;
  role: string;
  password: string;
  permissions: string[];
}

const ROLES = [
  { 
    value: 'admin', 
    label: 'Administrador',
    description: 'Acesso total ao sistema',
    color: 'bg-destructive'
  },
  { 
    value: 'manager', 
    label: 'Gestor',
    description: 'Gestão de equipe e clientes',
    color: 'bg-primary'
  },
  { 
    value: 'user', 
    label: 'Usuário',
    description: 'Acesso limitado aos recursos',
    color: 'bg-success'
  },
  { 
    value: 'viewer', 
    label: 'Visualizador',
    description: 'Apenas visualização de dados',
    color: 'bg-warning'
  }
];

const PERMISSIONS = [
  { id: 'clients.view', label: 'Ver Clientes' },
  { id: 'clients.create', label: 'Criar Clientes' },
  { id: 'clients.edit', label: 'Editar Clientes' },
  { id: 'clients.delete', label: 'Excluir Clientes' },
  { id: 'reports.view', label: 'Ver Relatórios' },
  { id: 'reports.create', label: 'Criar Relatórios' },
  { id: 'analytics.view', label: 'Ver Analytics' },
  { id: 'users.view', label: 'Ver Usuários' },
  { id: 'users.create', label: 'Criar Usuários' },
  { id: 'users.edit', label: 'Editar Usuários' },
  { id: 'users.delete', label: 'Excluir Usuários' },
  { id: 'settings.view', label: 'Ver Configurações' },
  { id: 'settings.edit', label: 'Editar Configurações' }
];

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUserData, setNewUserData] = useState<NewUserData>({
    email: '',
    name: '',
    role: 'user',
    password: '',
    permissions: []
  });
  const { toast } = useToast();

  // Carregar usuários do banco
  const loadUsersData = async () => {
    try {
      setLoading(true);

      // Buscar perfis de usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar informações adicionais dos usuários do auth
      const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) console.warn('Could not fetch auth users:', authError);

      // Processar dados combinados
      const processedUsers: UserProfile[] = (profilesData || []).map(profile => {
        const authUser = authUsersData?.data?.users?.find(u => u.id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || authUser?.email || null,
          name: profile.name,
          role: profile.role || 'user',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login: authUser?.last_sign_in_at || null,
          status: authUser?.email_confirmed_at ? 'active' : 'inactive',
          clients_count: 0, // TODO: Contar clientes atribuídos
          permissions: getPermissionsByRole(profile.role || 'user')
        };
      });

      setUsers(processedUsers);

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obter permissões baseadas no papel
  const getPermissionsByRole = (role: string): string[] => {
    const rolePermissions = {
      admin: PERMISSIONS.map(p => p.id),
      manager: ['clients.view', 'clients.create', 'clients.edit', 'reports.view', 'reports.create', 'analytics.view'],
      user: ['clients.view', 'reports.view'],
      viewer: ['clients.view', 'reports.view', 'analytics.view']
    };
    return rolePermissions[role as keyof typeof rolePermissions] || [];
  };

  // Criar novo usuário
  const handleCreateUser = async () => {
    try {
      if (!newUserData.email || !newUserData.name || !newUserData.password) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        email_confirm: true,
        user_metadata: {
          name: newUserData.name
        }
      });

      if (authError) throw authError;

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUserData.email,
          name: newUserData.name,
          role: newUserData.role
        });

      if (profileError) throw profileError;

      // Recarregar dados
      await loadUsersData();
      setShowCreateModal(false);
      setNewUserData({
        email: '',
        name: '',
        role: 'user',
        password: '',
        permissions: []
      });

      toast({
        title: "Sucesso",
        description: `Usuário ${newUserData.name} criado com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário",
        variant: "destructive",
      });
    }
  };

  // Editar usuário
  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Salvar edições do usuário
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editingUser.name,
          role: editingUser.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Recarregar dados
      await loadUsersData();
      setShowEditModal(false);
      setEditingUser(null);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    }
  };

  // Redefinir senha
  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Link para redefinição de senha enviado por email",
      });

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email de redefinição",
        variant: "destructive",
      });
    }
  };

  // Suspender/reativar usuário
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      // TODO: Implementar suspensão/reativação via Supabase Auth Admin
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Suspensão de usuários será implementada em breve",
      });

    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats gerais
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const recentUsers = users.filter(u => {
    if (!u.created_at) return false;
    const createdDate = new Date(u.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

  const getRoleInfo = (role: string) => {
    return ROLES.find(r => r.value === role) || ROLES[2]; // default to 'user'
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { variant: 'default' as const, label: 'Ativo' },
      'inactive': { variant: 'secondary' as const, label: 'Inativo' },
      'suspended': { variant: 'destructive' as const, label: 'Suspenso' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.inactive;
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              onClick={() => loadUsersData()}
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
                  <Users className="h-5 w-5 text-primary" />
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
                  <p className="text-text-secondary text-sm">Novos (7d)</p>
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleInfo(user.role || 'user');
            
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
                          <Badge 
                            className={`text-xs text-white ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </Badge>
                          {getStatusBadge(user.status)}
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
                          {user.last_login && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Último login: {formatDate(user.last_login)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
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
                            onClick={() => handleResetPassword(user.id, user.email || '')}
                            disabled={!user.email}
                          >
                            <Key className="h-4 w-4" />
                            Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                          >
                            {user.status === 'active' ? (
                              <>
                                <UserX className="h-4 w-4" />
                                Suspender
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Reativar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                <Users className="h-8 w-8 text-text-muted" />
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
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
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
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                          <div>
                            <p className="font-medium">{role.label}</p>
                            <p className="text-xs text-text-muted">{role.description}</p>
                          </div>
                        </div>
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
                Alterar informações do usuário {editingUser?.name}
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
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                            <div>
                              <p className="font-medium">{role.label}</p>
                              <p className="text-xs text-text-muted">{role.description}</p>
                            </div>
                          </div>
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