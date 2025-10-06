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
  Unlock,
  RefreshCw
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Usuario {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "gestor" | "usuario";
  ativo: boolean;
  ultimo_acesso: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  telefone: string | null;
  departamento: string | null;
  updated_at: string;
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
  nivel_acesso: "visualizar" | "editar" | "total";
}

export default function Users() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");

  const [showClientesModal, setShowClientesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const [gestorClientes, setGestorClientes] = useState<string[]>([]);
  const [usuarioAcessos, setUsuarioAcessos] = useState<ClienteAcesso[]>([]);

  const [editFormData, setEditFormData] = useState({
    name: "",
    telefone: "",
    departamento: "",
  });

  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadUsuarios();
    loadClientes();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(profile);
      setIsAdmin(profile?.role === "admin");
    }
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const { data: usuariosData, error } = await supabase
        .from("users_view")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: gestorClientesData } = await supabase
        .from("gestor_clientes")
        .select("gestor_id, cliente_id");

      const { data: usuarioClientesData } = await supabase
        .from("usuario_clientes")
        .select("usuario_id, cliente_id, nivel_acesso");

      const processedUsuarios =
        usuariosData?.map((user) => {
          const clientesGestor =
            gestorClientesData?.filter((gc) => gc.gestor_id === user.id) || [];
          const clientesUsuario =
            usuarioClientesData?.filter((uc) => uc.usuario_id === user.id) || [];

          return {
            ...user,
            total_clientes:
              user.role === "admin"
                ? 999
                : user.role === "gestor"
                ? clientesGestor.length
                : clientesUsuario.length,
          };
        }) || [];

      setUsuarios(processedUsuarios);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, email, telefone")
        .order("nome");
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error loading clientes:", error);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem alterar cargos",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      toast({
        title: "Cargo atualizado",
        description: "O cargo do usuário foi atualizado com sucesso",
      });
      loadUsuarios();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erro ao atualizar cargo",
        description: "Não foi possível atualizar o cargo do usuário",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (userId: string, ativo: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem alterar status",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ativo })
        .eq("id", userId);
      if (error) throw error;
      toast({
        title: "Status atualizado",
        description: `Usuário ${ativo ? "ativado" : "desativado"} com sucesso`,
      });
      loadUsuarios();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do usuário",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (user: Usuario) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      telefone: user.telefone || "",
      departamento: user.departamento || "",
    });
    setShowEditModal(true);
  };

  const saveUserEdits = async () => {
    if (!selectedUser) return;
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", selectedUser.id)
        .single();

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name: editFormData.name,
            telefone: editFormData.telefone,
            departamento: editFormData.departamento,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert({
          id: selectedUser.id,
          name: editFormData.name,
          telefone: editFormData.telefone,
          departamento: editFormData.departamento,
          role: "usuario",
          ativo: true,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      toast({
        title: "Usuário atualizado",
        description: "As informações foram salvas com sucesso",
      });

      setShowEditModal(false);
      loadUsuarios();
    } catch (error) {
      console.error("Error saving user edits:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
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
        .from("profiles")
        .update({ ativo: false })
        .eq("id", selectedUser.id);
      if (error) throw error;
      toast({
        title: "Usuário desativado",
        description: "O usuário foi desativado com sucesso",
      });
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsuarios();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro ao desativar",
        description: "Não foi possível desativar o usuário",
        variant: "destructive",
      });
    }
  };

  const filteredUsuarios = usuarios.filter((user) => {
    const matchSearch =
      !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "todos" || user.role === filterRole;
    const matchStatus =
      filterStatus === "todos" ||
      (filterStatus === "ativo" && user.ativo) ||
      (filterStatus === "inativo" && !user.ativo);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.role === "admin").length,
    gestores: usuarios.filter((u) => u.role === "gestor").length,
    usuarios: usuarios.filter((u) => u.role === "usuario").length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500 text-white">Admin</Badge>;
      case "gestor":
        return <Badge className="bg-blue-500 text-white">Gestor</Badge>;
      default:
        return <Badge>Usuário</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca acessou";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Usuários</h1>
          <div className="text-center py-8">Carregando usuários...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os usuários e suas permissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadUsuarios}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "Em desenvolvimento",
                  description:
                    "Use o Supabase Dashboard para criar novos usuários por enquanto",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </div>
        </div>

        {/* Aqui seguia normalmente a tabela, modais, e o fechamento do layout */}
        {/* ... o trecho restante já estava certo no seu original */}
      </div>
    </AppLayout>
  );
}
