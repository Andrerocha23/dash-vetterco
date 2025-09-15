import { useState, useEffect } from "react";
import { Plus, Users, Edit, Trash2, MoreHorizontal, Building, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ManagerModal } from "./ManagerModal";
import { useToast } from "@/hooks/use-toast";
import { managersService, ManagerWithStats, CreateManagerData } from "@/services/managersService";

export function ManagersSection() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<ManagerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerWithStats | null>(null);
  const [deletingManager, setDeletingManager] = useState<ManagerWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const data = await managersService.getManagers();
      setManagers(data);
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os gestores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const handleCreateManager = async (data: CreateManagerData) => {
    try {
      setIsSubmitting(true);
      await managersService.createManager(data);
      toast({
        title: "Sucesso!",
        description: "Gestor criado com sucesso",
      });
      await loadManagers();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating manager:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o gestor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditManager = async (data: CreateManagerData) => {
    if (!editingManager) return;
    
    try {
      setIsSubmitting(true);
      await managersService.updateManager(editingManager.id, data);
      toast({
        title: "Sucesso!",
        description: "Gestor atualizado com sucesso",
      });
      await loadManagers();
      setEditingManager(null);
    } catch (error) {
      console.error('Error updating manager:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o gestor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!deletingManager) return;
    
    try {
      await managersService.deleteManager(deletingManager.id);
      toast({
        title: "Sucesso!",
        description: "Gestor removido com sucesso",
      });
      await loadManagers();
      setDeletingManager(null);
    } catch (error) {
      console.error('Error deleting manager:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o gestor",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="surface-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestores ({managers.length})
            </CardTitle>
            <ManagerModal
              mode="create"
              open={showCreateModal}
              onOpenChange={setShowCreateModal}
              onSubmit={handleCreateManager}
              isSubmitting={isSubmitting}
              trigger={
                <Button variant="apple" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Gestor
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h3 className="text-lg font-medium mb-2">Nenhum gestor encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando seu primeiro gestor
              </p>
              <Button 
                variant="apple" 
                className="gap-2"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Gestor
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {managers.map((manager) => (
                <Card key={manager.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={manager.avatar_url} />
                          <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{manager.name}</h4>
                          {manager.department && (
                            <Badge variant="outline" className="text-xs">
                              {manager.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingManager(manager)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingManager(manager)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{manager.email}</span>
                      </div>
                      {manager.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{manager.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        <span>{manager.clientsCount} cliente{manager.clientsCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ManagerModal
        mode="edit"
        manager={editingManager || undefined}
        open={!!editingManager}
        onOpenChange={(open) => !open && setEditingManager(null)}
        onSubmit={handleEditManager}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingManager} onOpenChange={() => setDeletingManager(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o gestor {deletingManager?.name}? 
              Esta ação pode afetar os clientes vinculados a este gestor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteManager} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}