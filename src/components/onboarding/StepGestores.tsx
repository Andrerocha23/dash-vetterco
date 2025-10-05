import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";

export function StepGestores({ form }: { form: UseFormReturn<any> }) {
  const temGestorMarketing = form.watch("tem_gestor_marketing");
  const temGestorComercial = form.watch("tem_gestor_comercial");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gestores</h3>
      
      {/* Gestor de Marketing */}
      <div className="space-y-4 border rounded-lg p-4">
        <FormField
          control={form.control}
          name="tem_gestor_marketing"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-medium">Possui Gestor de Marketing?</FormLabel>
            </FormItem>
          )}
        />

        {temGestorMarketing && (
          <>
            <FormField
              control={form.control}
              name="gestor_marketing_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Gestor de Marketing</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gestor_marketing_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gestor_marketing_whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="5511999999999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      {/* Gestor Comercial */}
      <div className="space-y-4 border rounded-lg p-4">
        <FormField
          control={form.control}
          name="tem_gestor_comercial"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-medium">Possui Gestor Comercial?</FormLabel>
            </FormItem>
          )}
        />

        {temGestorComercial && (
          <>
            <FormField
              control={form.control}
              name="gestor_comercial_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Gestor Comercial</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gestor_comercial_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gestor_comercial_whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="5511999999999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
