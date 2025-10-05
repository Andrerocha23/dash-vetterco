import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

const NICHOS = [
  { value: "locacao", label: "Locação" },
  { value: "venda", label: "Venda" },
  { value: "lancamento", label: "Lançamento" },
  { value: "locacao_temporada", label: "Locação Temporada" },
  { value: "venda_temporada", label: "Venda Temporada" },
  { value: "terceiros", label: "Terceiros" },
];

const SEGMENTOS = [
  { value: "mcmv", label: "MCMV (Minha Casa Minha Vida)" },
  { value: "medio", label: "Médio" },
  { value: "medio_alto", label: "Médio Alto" },
  { value: "alto_padrao", label: "Alto Padrão" },
  { value: "altissimo_padrao", label: "Altíssimo Padrão" },
];

export function StepNichoRegiao({ form }: { form: UseFormReturn<any> }) {
  const [cidadeInput, setCidadeInput] = useState("");
  const [bairroInput, setBairroInput] = useState("");

  const nichosSelecionados = form.watch("nichos") || [];
  const segmentosSelecionados = form.watch("segmentos") || [];
  const cidades = form.watch("cidades") || [];
  const bairros = form.watch("bairros_regioes") || [];

  const addCidade = () => {
    if (cidadeInput.trim()) {
      form.setValue("cidades", [...cidades, cidadeInput.trim()]);
      setCidadeInput("");
    }
  };

  const removeCidade = (index: number) => {
    form.setValue(
      "cidades",
      cidades.filter((_: any, i: number) => i !== index)
    );
  };

  const addBairro = () => {
    if (bairroInput.trim()) {
      form.setValue("bairros_regioes", [...bairros, bairroInput.trim()]);
      setBairroInput("");
    }
  };

  const removeBairro = (index: number) => {
    form.setValue(
      "bairros_regioes",
      bairros.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Nicho de Atuação *</h3>
        <div className="grid grid-cols-2 gap-3">
          {NICHOS.map((nicho) => (
            <FormField
              key={nicho.value}
              control={form.control}
              name="nichos"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(nicho.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        field.onChange(
                          checked
                            ? [...current, nicho.value]
                            : current.filter((v: string) => v !== nicho.value)
                        );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">{nicho.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
        {form.formState.errors.nichos && (
          <p className="text-sm text-destructive mt-2">{String(form.formState.errors.nichos.message)}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Padrão/Segmento *</h3>
        <div className="grid grid-cols-2 gap-3">
          {SEGMENTOS.map((segmento) => (
            <FormField
              key={segmento.value}
              control={form.control}
              name="segmentos"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(segmento.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        field.onChange(
                          checked
                            ? [...current, segmento.value]
                            : current.filter((v: string) => v !== segmento.value)
                        );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">{segmento.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
        {form.formState.errors.segmentos && (
          <p className="text-sm text-destructive mt-2">{String(form.formState.errors.segmentos.message)}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Região de Atuação</h3>
        
        <FormField
          control={form.control}
          name="cidades"
          render={() => (
            <FormItem>
              <FormLabel>Cidades *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Digite uma cidade"
                    value={cidadeInput}
                    onChange={(e) => setCidadeInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCidade())}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={addCidade}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {cidades.map((cidade: string, index: number) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {cidade}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeCidade(index)} />
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bairros_regioes"
          render={() => (
            <FormItem className="mt-4">
              <FormLabel>Bairros/Regiões (opcional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Digite um bairro ou região"
                    value={bairroInput}
                    onChange={(e) => setBairroInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBairro())}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={addBairro}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {bairros.map((bairro: string, index: number) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {bairro}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeBairro(index)} />
                  </Badge>
                ))}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Estado (UF)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: SP" maxLength={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
