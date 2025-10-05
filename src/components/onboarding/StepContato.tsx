import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

export function StepContato({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contato Principal</h3>
      
      <FormField
        control={form.control}
        name="responsavel_nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Responsável *</FormLabel>
            <FormControl>
              <Input placeholder="Nome completo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="responsavel_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="email@empresa.com.br" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="responsavel_whatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WhatsApp *</FormLabel>
            <FormControl>
              <Input placeholder="5511999999999" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="responsavel_cargo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cargo</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Diretor Comercial" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
