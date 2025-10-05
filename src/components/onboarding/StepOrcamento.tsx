import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";

export function StepOrcamento({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Orçamento & Preferências</h3>
      
      <FormField
        control={form.control}
        name="budget_mensal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Orçamento Mensal (R$) *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="500"
                step="100"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>Orçamento mínimo: R$ 500</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Acessos e Referências (opcional)</h4>
        
        <FormField
          control={form.control}
          name="crm_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do CRM</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_bm_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Business Manager (Meta)</FormLabel>
              <FormControl>
                <Input placeholder="123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="google_ads_cid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CID do Google Ads</FormLabel>
              <FormControl>
                <Input placeholder="123-456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Preferências de Contato</h4>
        
        <FormField
          control={form.control}
          name="contato_preferido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal Preferido</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <label htmlFor="email" className="cursor-pointer">E-mail</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telefone" id="telefone" />
                    <label htmlFor="telefone" className="cursor-pointer">Telefone</label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="horarios_contato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horários Preferidos</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Manhã (9h-12h), Tarde (14h-17h)" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
