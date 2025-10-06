import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

// Import step components
import { StepIdentificacao } from "@/components/onboarding/StepIdentificacao";
import { StepContato } from "@/components/onboarding/StepContato";
import { StepGestores } from "@/components/onboarding/StepGestores";
import { StepNichoRegiao } from "@/components/onboarding/StepNichoRegiao";
import { StepEquipe } from "@/components/onboarding/StepEquipe";
import { StepOrcamento } from "@/components/onboarding/StepOrcamento";
import { StepRevisao } from "@/components/onboarding/StepRevisao";

const formSchema = z.object({
  razao_social: z.string().min(1, "Razão social é obrigatória"),
  nome_fantasia: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  site_url: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram_handle: z.string().optional(),
  responsavel_nome: z.string().min(1, "Nome do responsável é obrigatório"),
  responsavel_email: z.string().email("Email inválido"),
  responsavel_whatsapp: z.string().min(13, "WhatsApp deve ter DDD + número").max(15),
  responsavel_cargo: z.string().optional(),
  tem_gestor_marketing: z.boolean().default(false),
  gestor_marketing_nome: z.string().optional(),
  gestor_marketing_email: z.string().email("Email inválido").optional().or(z.literal("")),
  gestor_marketing_whatsapp: z.string().optional(),
  tem_gestor_comercial: z.boolean().default(false),
  gestor_comercial_nome: z.string().optional(),
  gestor_comercial_email: z.string().email("Email inválido").optional().or(z.literal("")),
  gestor_comercial_whatsapp: z.string().optional(),
  nichos: z.array(z.string()).min(1, "Selecione pelo menos um nicho"),
  segmentos: z.array(z.string()).min(1, "Selecione pelo menos um segmento"),
  cidades: z.array(z.string()).min(1, "Adicione pelo menos uma cidade"),
  bairros_regioes: z.array(z.string()).default([]),
  estado: z.string().optional(),
  tem_corretor_funcionario: z.boolean().default(false),
  qtd_corretores: z.number().int().min(0).default(0),
  qtd_funcionarios: z.number().int().min(0).default(0),
  estrutura_setores: z.any().optional(),
  tem_sdr: z.boolean().default(false),
  qtd_sdr_total: z.number().int().min(0).default(0),
  budget_mensal: z.number().min(500, "Orçamento mínimo de R$ 500"),
  distribuicao_sugerida: z.any().optional(),
  crm_url: z.string().url("URL inválida").optional().or(z.literal("")),
  meta_bm_id: z.string().optional(),
  google_ads_cid: z.string().optional(),
  contato_preferido: z.string().optional(),
  horarios_contato: z.string().optional(),
  lgpd_consent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { title: "Identificação", component: StepIdentificacao },
  { title: "Contato", component: StepContato },
  { title: "Gestores", component: StepGestores },
  { title: "Nicho & Região", component: StepNichoRegiao },
  { title: "Equipe", component: StepEquipe },
  { title: "Orçamento", component: StepOrcamento },
  { title: "Revisão", component: StepRevisao },
];

export default function PublicClientRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razao_social: "",
      nome_fantasia: "",
      cnpj_cpf: "",
      site_url: "",
      instagram_handle: "",
      responsavel_nome: "",
      responsavel_email: "",
      responsavel_whatsapp: "",
      responsavel_cargo: "",
      tem_gestor_marketing: false,
      tem_gestor_comercial: false,
      nichos: [],
      segmentos: [],
      cidades: [],
      bairros_regioes: [],
      tem_corretor_funcionario: false,
      qtd_corretores: 0,
      qtd_funcionarios: 0,
      tem_sdr: false,
      qtd_sdr_total: 0,
      budget_mensal: 1000,
      lgpd_consent: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      // Salvar diretamente na tabela clientes com todas as informações
      const { error } = await supabase.from("clientes").insert({
        nome: values.razao_social || values.nome_fantasia || "Sem nome",
        cnpj: values.cnpj_cpf,
        email: values.responsavel_email,
        telefone: values.responsavel_whatsapp || "",
        instagram_handle: values.instagram_handle,
        site: values.site_url,
        razao_social: values.razao_social,
        nome_fantasia: values.nome_fantasia,
        cnpj_cpf: values.cnpj_cpf,
        site_url: values.site_url,
        responsavel_nome: values.responsavel_nome,
        responsavel_email: values.responsavel_email,
        responsavel_whatsapp: values.responsavel_whatsapp,
        responsavel_cargo: values.responsavel_cargo,
        tem_gestor_marketing: values.tem_gestor_marketing,
        gestor_marketing_nome: values.gestor_marketing_nome,
        gestor_marketing_email: values.gestor_marketing_email,
        gestor_marketing_whatsapp: values.gestor_marketing_whatsapp,
        tem_gestor_comercial: values.tem_gestor_comercial,
        gestor_comercial_nome: values.gestor_comercial_nome,
        gestor_comercial_email: values.gestor_comercial_email,
        gestor_comercial_whatsapp: values.gestor_comercial_whatsapp,
        nichos: values.nichos,
        segmentos: values.segmentos,
        cidades: values.cidades,
        bairros_regioes: values.bairros_regioes,
        estado: values.estado,
        cidade_regiao: values.cidades[0] || "Não especificado",
        tem_corretor_funcionario: values.tem_corretor_funcionario,
        qtd_corretores: values.qtd_corretores,
        qtd_funcionarios: values.qtd_funcionarios,
        estrutura_setores: values.estrutura_setores || {},
        tem_sdr: values.tem_sdr,
        qtd_sdr_total: values.qtd_sdr_total,
        budget_mensal: values.budget_mensal,
        distribuicao_sugerida: values.distribuicao_sugerida || {},
        crm_url: values.crm_url,
        meta_bm_id: values.meta_bm_id,
        google_ads_cid: values.google_ads_cid,
        contato_preferido: values.contato_preferido,
        horarios_contato: values.horarios_contato,
        lgpd_consent: values.lgpd_consent,
        status: "Pendente",
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: "Cadastro enviado!", description: "Entraremos em contato em breve." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const getFieldsForStep = (step: number): any[] => {
    switch (step) {
      case 0: return ["razao_social"];
      case 1: return ["responsavel_nome", "responsavel_email", "responsavel_whatsapp"];
      case 3: return ["nichos", "segmentos", "cidades"];
      case 5: return ["budget_mensal"];
      case 6: return ["lgpd_consent"];
      default: return [];
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Cadastro Recebido!</CardTitle>
            <CardDescription className="text-base">
              Recebemos seus dados. Entraremos em contato via WhatsApp ou e-mail em breve.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastro de Cliente</CardTitle>
            <CardDescription>Etapa {currentStep + 1} de {steps.length}: {steps[currentStep].title}</CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CurrentStepComponent form={form} />
                <div className="flex justify-between pt-6 border-t">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Anterior
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep}>Próximo<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  ) : (
                    <Button type="submit">Enviar Cadastro<CheckCircle2 className="ml-2 h-4 w-4" /></Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
