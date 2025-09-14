import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Users,
  TrendingUp,
  Target,
  Award,
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { managersService, type ManagerWithStats } from "@/services/managersService";
import { ManagerFormModal } from "@/components/forms/ManagerFormModal";
import { pt } from "@/i18n/pt";

export default function Managers() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<ManagerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ManagerWithStats | null>(null);

  // Carregar gestores
  const loadManagers = async () => {
    try {
      setLoading(true);
      const data = await managersService.getManagers();
      setManagers(data);
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao carregar gestores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  // Filtrar gestores por busca
  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (manager.department && manager.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handlers
  const handleCreateManager = () => {
    setSelectedManager(null);
    setShowCreateModal(true);
  };

  const handleEditManager = (manager: ManagerWithStats) => {
    setSelectedManager(manager);
    setShowEditModal(true);
  };

  const handleDeleteManager = (manager: ManagerWithStats) => {
    setManagerToDelete(manager);
    setShowDeleteDialog(true);
  };

  const confirmDeleteManager = async () => {
    if (!managerToDelete) return;

    try {
      await managersService.deleteManager(managerToDelete.id);
      await loadManagers();
      setShowDeleteDialog(false);
      setManagerToDelete(null);
      
      toast({
        title: "✅ Sucesso",
        description: `Gestor ${managerToDelete.name} removido com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao remover gestor",
        variant: "destructive"
      });
    }
  };

  const handleModalSuccess = () => {
    loadManagers();
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedManager(null);
  };

  // Função para obter cor do badge de satisfação
  const getSatisfactionColor = (satisfaction: string) => {
    switch (satisfaction) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'average': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'poor': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Função para obter cor do departamento
  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'Meta Ads': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Google Ads': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Performance': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Social Media': return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
      case 'E-commerce': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Função para obter avatar ou iniciais
  const getAvatarContent = (manager: ManagerWithStats) => {
    if (manager.avatar_url) {
      return <AvatarImage src={manager.avatar_url} alt={manager.name} />;
    }
    return (
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
        {getInitials(manager.name)}
      </AvatarFallback>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
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
            <h1 className="text-3xl font-bold">{pt.managers.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.managers.subtitle}</p>
          </div>
          <Button onClick={handleCreateManager} className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Gestor
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar gestores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Gestores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {managers.filter(m => m.status === 'active').length} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Clientes Gerenciados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {managers.reduce((total, m) => total + m.clientsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total de clientes</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Satisfação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(managers.reduce((total, m) => total + m.satisfactionScore, 0) / managers.length || 0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Score de satisfação</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                CPL Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(managers.reduce((total, m) => total + m.avgCPL, 0) / managers.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Custo por lead médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Managers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManagers.map((manager) => (
            <Card key={manager.id} className="surface-elevated hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      {getAvatarContent(manager)}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {manager.name}
                      </h3>
                      <Badge className={getDepartmentColor(manager.department || '')} variant="outline">
                        <Building2 className="h-3 w-3 mr-1" />
                        {manager.department}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditManager(manager)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Gerenciar Clientes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteManager(manager)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{manager.email}</span>
                  </div>
                  {manager.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      {manager.phone}
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{manager.clientsCount}</div>
                    <div className="text-xs text-muted-foreground">Clientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{manager.totalLeads}</div>
                    <div className="text-xs text-muted-foreground">Leads</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{manager.avgCPL > 0 ? formatCurrency(manager.avgCPL) : "R$ 0,00"}</div>
                    <div className="text-xs text-muted-foreground">CPL Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{manager.avgCTR.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">CTR Médio</div>
                  </div>
                </div>

                {/* Satisfaction Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Satisfação:</span>
                  <Badge className={getSatisfactionColor(manager.satisfaction)}>
                    {manager.satisfactionScore}% - {pt.managers[manager.satisfaction]}
                  </Badge>
                </div>

                {/* Specialties */}
                {manager.specialties && manager.specialties.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Especialidades:</div>
                    <div className="flex flex-wrap gap-1">
                      {manager.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {manager.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{manager.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredManagers.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum gestor encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery 
                  ? "Nenhum gestor corresponde aos critérios de busca." 
                  : "Comece adicionando seu primeiro gestor."
                }
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Limpar Busca
                </Button>
              ) : (
                <Button onClick={handleCreateManager}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Gestor
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ManagerFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleModalSuccess}
      />

      <ManagerFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        manager={selectedManager}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o gestor <strong>{managerToDelete?.name}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                ⚠️ Atenção: Todos os clientes atribuídos a este gestor ficarão sem gestor responsável.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteManager}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );