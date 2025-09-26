import React, { useState, useEffect } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  Target, 
  DollarSign, 
  Users, 
  Facebook,
  Chrome,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Schema de validação
const contaSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  nome_conta: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  segmento: z.string().min(2, "Segmento é obrigatório"),
  plataformas: z.array(z.string()).min(1, "Selecione pelo menos uma plataforma"),
  orcamento_mensal: z.number().min(100, "Orçamento mínimo de R$ 100"),
  gestor_id: z.string().min(1, "Selecione um gestor"),
  status: z.enum(["Ativo", "Pausado", "Arquivado"]),
  observacoes: z.string().optional(),
});

type ContaFormData = z.infer<typeof contaSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Gestor {
  id: string;
  name: string;
}

interface ModernAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContaFormData) => Promise<void>;
  initialData?: Partial<ContaFormData>;
  isEdit?: boolean;
}

const PLATAFORMAS = [
  { id: "meta", name: "Meta Ads", icon: Facebook, color: "bg-blue-500" },
  { id: "google", name: "Google Ads", icon: Chrome, color: "bg-red-500" },
  { id: "tiktok", name: "TikTok Ads", icon: TrendingUp, color: "bg-pink-500" },
];

const SEGMENTOS_IMOVEIS = [
  "Locação Residencial",
  "Venda Residencial", 
  "Locação Comercial",
  "Venda Comercial",
  "Alto Padrão",
  "MCMV/Popular",
  "Lançamentos",
  "Terrenos",
];

export function ModernAccountForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEdit = false,
}: ModernAccountFormProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      cliente_id: initialData?.cliente_id || "",
      nome_conta: initialData?.nome_conta || "",
      cidade: initialData?.cidade || "",
      segmento: initialData?.segmento || "",
      plataformas: initialData?.plataformas || [],
      orcamento_mensal: initialData?.orcamento_mensal || 1000,
      gestor_id: initialData?.gestor_id || "",
      status: initialData?.status || "Ativo",
      observacoes: initialData?.observacoes || "",
    },
  });

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar clientes
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, nome')
          .order('nome');

        // Buscar gestores
        const { data: gestoresData } = await supabase
          .from('managers')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        setClientes(clientesData || []);
        setGestores(gestoresData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Gerar nome automático da conta
  const generateAccountName = () => {
    const cliente = clientes.find(c => c.id === form.watch('cliente_id'));
    const cidade = form.watch('cidade');
    const segmento = form.watch('segmento');

    if (cliente && cidade && segmento) {
      const nome = `${cliente.nome} - ${cidade} - ${segmento}`;
      form.setValue('nome_conta', nome);
    }
  };

  useEffect(() => {
    generateAccountName();
  }, [form.watch('cliente_id'), form.watch('cidade'), form.watch('segmento')]);

  const handleSubmit = async (data: ContaFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
      setStep(1);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlataforma = (plataforma: string) => {
    const current = form.watch('plataformas');
    const updated = current.includes(plataforma)
      ? current.filter(p => p !== plataforma)
      : [...current, plataforma];
    form.setValue('plataformas', updated);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    const data = form.watch();
    if (step === 1) {
      return data.cliente_id && data.cidade && data.segmento;
    }
    if (step === 2) {
      return data.plataformas.length > 0 && data.orcamento_mensal >= 100;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl">
            {isEdit ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step > stepNum ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {step === 1 && "Dados básicos da conta"}
            {step === 2 && "Plataformas e orçamento"}
            {step === 3 && "Configurações finais"}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* STEP 1: Dados Básicos */}
            {step === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Dados Básicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Cliente */}
                    <FormField
                      control={form.control}
                      name="cliente_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientes.map((cliente) => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cidade */}
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Cidade *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: São Carlos" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Segmento */}
                      <FormField
                        control={form.control}
                        name="segmento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Segmento *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo de negócio" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SEGMENTOS_IMOVEIS.map((segmento) => (
                                  <SelectItem key={segmento} value={segmento}>
                                    {segmento}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Nome Auto-gerado */}
                    <FormField
                      control={form.control}
                      name="nome_conta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Conta</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Será gerado automaticamente" />
                          </FormControl>
                          <FormDescription className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Nome gerado automaticamente. Você pode editar se necessário.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: Plataformas e Orçamento */}
            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Plataformas de Anúncios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Plataformas */}
                    <FormField
                      control={form.control}
                      name="plataformas"
                      render={() => (
                        <FormItem>
                          <FormLabel>Selecione as plataformas *</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {PLATAFORMAS.map((plataforma) => {
                              const Icon = plataforma.icon;
                              const isSelected = form.watch('plataformas').includes(plataforma.id);
                              
                              return (
                                <div
                                  key={plataforma.id}
                                  onClick={() => togglePlataforma(plataforma.id)}
                                  className={`
                                    border-2 rounded-lg p-4 cursor-pointer transition-all
                                    ${isSelected 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-muted hover:border-primary/50'
                                    }
                                  `}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg ${plataforma.color} flex items-center justify-center`}>
                                      <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{plataforma.name}</p>
                                      {isSelected && (
                                        <Badge variant="secondary" className="mt-1">
                                          Selecionado
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Orçamento */}
                    <FormField
                      control={form.control}
                      name="orcamento_mensal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Orçamento Mensal *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="number"
                                placeholder="1000"
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Orçamento mensal total para todas as plataformas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: Configurações Finais */}
            {step === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Configurações Finais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gestor */}
                      <FormField
                        control={form.control}
                        name="gestor_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gestor Responsável *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um gestor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {gestores.map((gestor) => (
                                  <SelectItem key={gestor.id} value={gestor.id}>
                                    {gestor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Status */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Ativo">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Ativo
                                  </div>
                                </SelectItem>
                                <SelectItem value="Pausado">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Pausado
                                  </div>
                                </SelectItem>
                                <SelectItem value="Arquivado">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    Arquivado
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Observações */}
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações adicionais sobre esta conta..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Resumo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Conta:</strong> {form.watch('nome_conta')}</p>
                      <p><strong>Cliente:</strong> {clientes.find(c => c.id === form.watch('cliente_id'))?.nome}</p>
                      <p><strong>Plataformas:</strong> {form.watch('plataformas').join(', ')}</p>
                      <p><strong>Orçamento:</strong> R$ {form.watch('orcamento_mensal')?.toLocaleString()}/mês</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer com navegação */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              </div>

              <div>
                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : isEdit ? "Atualizar Conta" : "Criar Conta"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}