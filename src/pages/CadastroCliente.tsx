import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle2, Building2, Users, DollarSign, Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  // Etapa 1: Informações Básicas
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  nome_imobiliaria: z.string().min(2, "Nome da imobiliária é obrigatório"),
  cnpj_creci: z.string().optional(),
  
  // Etapa 2: Estrutura e Equipe
  num_corretores: z.number().min(0).optional(),
  num_funcionarios: z.number().min(0).optional(),
  num_sdr: z.number().min(0).optional(),
  telefone_leads: z.string().min(10, "Telefone para leads é obrigatório"),
  responsavel_nome: z.string().min(2, "Nome do responsável é obrigatório"),
  responsavel_email: z.string().email("Email do responsável inválido"),
  
  // Etapa 3: Informações de Negócio
  tipo_imoveis: z.string().min(1, "Tipo de imóveis é obrigatório"),
  publico_alvo: z.string().min(1, "Público-alvo é obrigatório"),
  cidade_regiao: z.string().min(1, "Cidade/região é obrigatória"),
  ticket_medio: z.number().min(0).optional(),
  meta_mensal_vendas: z.number().min(0).optional(),
  num_imoveis_ativos: z.number().min(0).optional(),
  
  // Etapa 4: Marketing e Budget
  budget_mensal: z.number().min(0, "Budget deve ser maior que zero"),
  campanhas_ativas: z.boolean().default(false),
  redes_sociais_adicionais: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  site_institucional: z.string().optional(),
  pixel_analytics_configurado: z.boolean().default(false),
  objetivos_marketing: z.string().optional(),
  
  // Etapa 5: Sistemas e Integrações
  crm_utilizado: z.string().optional(),
  forma_receber_relatorios: z.string().optional(),
  observacoes_adicionais: z.string().optional(),
  diferenciais: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CadastroCliente = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const totalSteps = 5;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campanhas_ativas: false,
      pixel_analytics_configurado: false,
      num_corretores: 0,
      num_funcionarios: 0,
      num_sdr: 0,
      ticket_medio: 0,
      meta_mensal_vendas: 0,
      num_imoveis_ativos: 0,
      budget_mensal: 0,
      redes_sociais_adicionais: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Garantir que os campos obrigatórios estejam presentes
      const registrationData = {
        ...data,
        email: data.email || '',
        telefone: data.telefone || '',
        nome_completo: data.nome_completo || '',
        nome_imobiliaria: data.nome_imobiliaria || '',
        tipo_imoveis: data.tipo_imoveis || '',
        publico_alvo: data.publico_alvo || '',
        cidade_regiao: data.cidade_regiao || '',
      };

      const { error } = await supabase
        .from('public_client_registrations')
        .insert([registrationData]);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Entraremos em contato em breve.",
      });
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = getStepFields(currentStep);
    const isValid = await form.trigger(fields as any);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 1:
        return ['nome_completo', 'email', 'telefone', 'nome_imobiliaria', 'cnpj_creci'];
      case 2:
        return ['num_corretores', 'num_funcionarios', 'num_sdr', 'telefone_leads', 'responsavel_nome', 'responsavel_email'];
      case 3:
        return ['tipo_imoveis', 'publico_alvo', 'cidade_regiao', 'ticket_medio', 'meta_mensal_vendas', 'num_imoveis_ativos'];
      case 4:
        return ['budget_mensal', 'campanhas_ativas', 'redes_sociais_adicionais', 'instagram', 'site_institucional', 'objetivos_marketing'];
      case 5:
        return ['crm_utilizado', 'forma_receber_relatorios', 'observacoes_adicionais', 'diferenciais'];
      default:
        return [];
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  const stepIcons = [
    <Building2 className="h-5 w-5" />,
    <Users className="h-5 w-5" />,
    <Building2 className="h-5 w-5" />,
    <DollarSign className="h-5 w-5" />,
    <Settings className="h-5 w-5" />,
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Cadastro Concluído!</CardTitle>
            <CardDescription className="text-base mt-2">
              Obrigado por se cadastrar. Nossa equipe entrará em contato em breve para dar continuidade ao processo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Cadastro de Cliente
          </h1>
          <p className="text-muted-foreground">
            Preencha as informações abaixo para iniciar sua jornada conosco
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
                  index + 1 < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index + 1 === currentStep
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1 < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  stepIcons[index]
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center mt-2">
            Etapa {currentStep} de {totalSteps}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Informações Básicas"}
                  {currentStep === 2 && "Estrutura e Equipe"}
                  {currentStep === 3 && "Informações de Negócio"}
                  {currentStep === 4 && "Marketing e Budget"}
                  {currentStep === 5 && "Sistemas e Integrações"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Dados principais da empresa"}
                  {currentStep === 2 && "Informações sobre sua equipe"}
                  {currentStep === 3 && "Detalhes do seu negócio"}
                  {currentStep === 4 && "Investimento e estratégia digital"}
                  {currentStep === 5 && "Ferramentas e observações"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Etapa 1: Informações Básicas */}
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="nome_completo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone *</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="nome_imobiliaria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Imobiliária *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnpj_creci"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ / CRECI</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0000-00 ou CRECI" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Etapa 2: Estrutura e Equipe */}
                {currentStep === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="num_corretores"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nº de Corretores</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="num_funcionarios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nº de Funcionários</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="num_sdr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nº de SDRs</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="telefone_leads"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Principal para Leads *</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="responsavel_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Responsável *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do gestor/responsável" {...field} />
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
                          <FormLabel>Email do Responsável *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="responsavel@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Etapa 3: Informações de Negócio */}
                {currentStep === 3 && (
                  <>
                    <FormField
                      control={form.control}
                      name="tipo_imoveis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Imóveis *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="residencial">Residencial</SelectItem>
                              <SelectItem value="comercial">Comercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="rural">Rural</SelectItem>
                              <SelectItem value="misto">Misto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publico_alvo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público-Alvo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Jovens casais, investidores..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade_regiao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade/Região *</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade ou região de atuação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ticket_medio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ticket Médio (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0,00" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="meta_mensal_vendas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Mensal (vendas)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="num_imoveis_ativos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imóveis Ativos</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Etapa 4: Marketing e Budget */}
                {currentStep === 4 && (
                  <>
                    <FormField
                      control={form.control}
                      name="budget_mensal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Mensal para Anúncios (R$) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0,00" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="campanhas_ativas"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Possui campanhas ativas atualmente?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@seuinstagram" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="site_institucional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Institucional</FormLabel>
                            <FormControl>
                              <Input placeholder="https://seusite.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="pixel_analytics_configurado"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Possui Pixel/Analytics configurado?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="objetivos_marketing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivos de Marketing</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva seus principais objetivos de marketing..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Etapa 5: Sistemas e Integrações */}
                {currentStep === 5 && (
                  <>
                    <FormField
                      control={form.control}
                      name="crm_utilizado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRM Utilizado</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: RD Station, HubSpot, próprio..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="forma_receber_relatorios"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Como prefere receber relatórios?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma opção" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="dashboard">Dashboard Online</SelectItem>
                              <SelectItem value="reuniao">Reuniões Periódicas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diferenciais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diferenciais da Empresa</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Conte-nos sobre os principais diferenciais da sua empresa..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="observacoes_adicionais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Adicionais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais que gostaria de compartilhar..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Enviando..." : "Concluir Cadastro"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CadastroCliente;
