import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, 
  Facebook, 
  Chrome, 
  Megaphone,
  TrendingUp
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const accountSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  account_id: z.string().min(1, "ID da conta é obrigatório"),
  status: z.enum(["Ativo", "Pausado", "Arquivado"]),
  observacoes: z.string().optional(),
});

export interface AccountFormData {
  id?: string;
  tipo: string;
  account_id: string;
  status: "Ativo" | "Pausado" | "Arquivado";
  observacoes?: string;
}

interface AccountFormProps {
  account?: AccountFormData;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

const accountTypes = [
  { value: "Meta Ads", label: "Meta Ads", icon: Facebook, color: "text-blue-600" },
  { value: "Google Ads", label: "Google Ads", icon: Chrome, color: "text-red-600" },
  { value: "TikTok Ads", label: "TikTok Ads", icon: Megaphone, color: "text-pink-600" },
  { value: "LinkedIn Ads", label: "LinkedIn Ads", icon: Building2, color: "text-blue-700" },
  { value: "Twitter Ads", label: "Twitter Ads", icon: TrendingUp, color: "text-sky-600" },
];

export function AccountForm({ 
  account, 
  onSubmit, 
  onCancel, 
  isEdit = false, 
  isSubmitting = false 
}: AccountFormProps) {
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      tipo: account?.tipo || "",
      account_id: account?.account_id || "",
      status: account?.status || "Ativo",
      observacoes: account?.observacoes || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof accountSchema>) => {
    onSubmit({
      ...data,
      id: account?.id,
    } as AccountFormData);
  };

  const selectedType = accountTypes.find(type => type.value === form.watch("tipo"));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Conta *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de conta">
                        {selectedType && (
                          <div className="flex items-center gap-2">
                            <selectedType.icon className={`h-4 w-4 ${selectedType.color}`} />
                            <span>{selectedType.label}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID da Conta *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                    <SelectItem value="Arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Observações sobre esta conta..." 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}