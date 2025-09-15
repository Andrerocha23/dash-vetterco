import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Building } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateManagerData } from "@/services/managersService";

const managerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  department: z.string().optional(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

interface ManagerFormProps {
  manager?: CreateManagerData & { id?: string };
  onSubmit: (data: CreateManagerData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

const departments = [
  "Meta Ads",
  "Google Ads", 
  "Performance",
  "Social Media",
  "E-commerce",
  "Analytics",
  "Growth",
  "Customer Success"
];

export function ManagerForm({ 
  manager, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  isSubmitting = false 
}: ManagerFormProps) {
  const form = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      name: manager?.name || "",
      email: manager?.email || "",
      phone: manager?.phone || "",
      department: manager?.department || "",
      avatar_url: manager?.avatar_url || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof managerSchema>) => {
    onSubmit(data as CreateManagerData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4">
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
                  <Input placeholder="Ex: João Silva Santos" {...field} />
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
                  <Input type="email" placeholder="joao@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone/WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+55 (99) 99999-9999" {...field} />
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
                    <Building className="h-4 w-4" />
                    Departamento
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Avatar (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplo.com/foto.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="apple"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Atualizar Gestor" : "Criar Gestor"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}