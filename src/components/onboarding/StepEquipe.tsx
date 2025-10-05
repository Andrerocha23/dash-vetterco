import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";

export function StepEquipe({ form }: { form: UseFormReturn<any> }) {
  const temCorretorFuncionario = form.watch("tem_corretor_funcionario");
  const temSDR = form.watch("tem_sdr");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Informações da Equipe</h3>
      
      <FormField
        control={form.control}
        name="tem_corretor_funcionario"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="font-medium">Possui Corretores/Funcionários?</FormLabel>
          </FormItem>
        )}
      />

      {temCorretorFuncionario && (
        <div className="space-y-4 pl-8 border-l-2">
          <FormField
            control={form.control}
            name="qtd_corretores"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de Corretores</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="qtd_funcionarios"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de Funcionários</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="tem_sdr"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="font-medium">Possui SDR (Pré-vendas)?</FormLabel>
          </FormItem>
        )}
      />

      {temSDR && (
        <div className="pl-8 border-l-2">
          <FormField
            control={form.control}
            name="qtd_sdr_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Total de SDRs</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
