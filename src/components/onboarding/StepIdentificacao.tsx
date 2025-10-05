import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

export function StepIdentificacao({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Identificação da Empresa</h3>
      
      <FormField
        control={form.control}
        name="razao_social"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Razão Social *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Imobiliária XYZ Ltda" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nome_fantasia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Fantasia</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Imóveis XYZ" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cnpj_cpf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ/CPF</FormLabel>
            <FormControl>
              <Input placeholder="00.000.000/0000-00" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="site_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Site</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://www.seusite.com.br" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instagram_handle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instagram</FormLabel>
            <FormControl>
              <Input placeholder="@imoveisxyz" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
