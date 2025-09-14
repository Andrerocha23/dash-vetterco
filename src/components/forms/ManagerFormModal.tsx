import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, User, Mail, Phone, Building2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { managersService, type ManagerWithStats, type CreateManagerData } from "@/services/managersService";

const managerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  department: z.string().optional(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormData = z.infer<typeof managerSchema>;

interface ManagerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager?: ManagerWithStats | null;
  onSuccess: () => void;
}

const departments = [
  "Meta Ads",
  "Google Ads", 
  "Performance",
  "Social Media",
  "E-commerce",
  "Criação",
  "Estratégia",
  "Atendimento"
];

const avatarUrls = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face"
];

export function ManagerFormModal({ open, onOpenChange, manager, onSuccess }: ManagerFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(manager?.avatar_url || "");

  const form = useForm<FormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      name: manager?.name || "",
      email: manager?.email || "",
      phone: manager?.phone || "",
      department: manager?.department || "",
      avatar_url: manager?.avatar_url || "",
    },
  });

  const isEditing = !!manager;

  // Função para obter iniciais
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const managerData: CreateManagerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        avatar_url: selectedAvatar || data.avatar_url,
      };

      if (isEditing) {
        await managersService.updateManager(manager.id, managerData);
        toast({
          title: "✅ Sucesso",
          description: "Gestor atualizado com sucesso!"
        });
      } else {
        await managersService.createManager(managerData);
        toast({
          title: "✅ Sucesso", 
          description: "Gestor criado com sucesso!"
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setSelectedAvatar("");
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message || (isEditing ? "Erro ao atualizar gestor" : "Erro ao criar gestor"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? "Editar Gestor" : "Novo Gestor"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Avatar Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Avatar
              </h3>
              
              {/* Current Avatar Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                  {selectedAvatar ? (
                    <img 
                      src={selectedAvatar} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                      {form.watch("name") ? getInitials(form.watch("name")) : "??"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Avatar Atual</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAvatar ? "Imagem selecionada" : "Iniciais do nome"}
                  </p>
                </div>
              </div>

              {/* Avatar Options */}
              <div className="grid grid-cols-4 gap-3">
                {avatarUrls.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === url 
                        ? "border-primary ring-2 ring-primary/20 scale-110" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Custom Avatar URL */}
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Personalizada (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/avatar.jpg" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value) {
                            setSelectedAvatar(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome Completo *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ana Silva Santos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="ana.silva@metaflow.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+55 11 99999-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Departamento
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Selecionar departamento</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : (isEditing ? "Atualizar" : "Criar Gestor")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
