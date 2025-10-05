import { FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";

export function StepRevisao({ form }: { form: UseFormReturn<any> }) {
  const formData = form.watch();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Revisão dos Dados</h3>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Empresa</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="font-medium text-muted-foreground">Razão Social:</dt><dd>{formData.razao_social}</dd></div>
            {formData.nome_fantasia && <div><dt className="font-medium text-muted-foreground">Nome Fantasia:</dt><dd>{formData.nome_fantasia}</dd></div>}
            {formData.cnpj_cpf && <div><dt className="font-medium text-muted-foreground">CNPJ/CPF:</dt><dd>{formData.cnpj_cpf}</dd></div>}
          </dl>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Contato</h4>
          <dl className="space-y-2 text-sm">
            <div><dt className="font-medium text-muted-foreground">Responsável:</dt><dd>{formData.responsavel_nome}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Email:</dt><dd>{formData.responsavel_email}</dd></div>
            <div><dt className="font-medium text-muted-foreground">WhatsApp:</dt><dd>{formData.responsavel_whatsapp}</dd></div>
          </dl>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Atuação</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Nichos:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.nichos?.map((nicho: string) => (
                  <Badge key={nicho} variant="secondary">{nicho}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Segmentos:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.segmentos?.map((seg: string) => (
                  <Badge key={seg} variant="secondary">{seg}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Cidades:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.cidades?.map((cidade: string) => (
                  <Badge key={cidade} variant="outline">{cidade}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Orçamento</h4>
          <p className="text-2xl font-bold text-primary">
            R$ {formData.budget_mensal?.toLocaleString('pt-BR')}
            <span className="text-sm font-normal text-muted-foreground ml-2">/mês</span>
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <FormField
          control={form.control}
          name="lgpd_consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium">
                  Concordo com os termos de uso e política de privacidade *
                </FormLabel>
                <FormDescription>
                  Ao marcar esta opção, você autoriza o uso dos seus dados conforme nossa política de privacidade LGPD.
                  Seus dados serão usados exclusivamente para análise e contato comercial.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
