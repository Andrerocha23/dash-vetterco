import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  Globe,
  MapPin,
  Target,
  DollarSign,
  BarChart3,
  Users,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const registrationSchema = z.object({
  // Dados principais
  nome_completo: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  instagram: z.string().optional(),
  nome_imobiliaria: z.string().min(2, "Nome da imobiliária é obrigatório"),
  cnpj_creci: z.string().optional(),
  site_institucional: z.string().url("URL inválida").optional().or(z.literal("")),
  
  // Atuação e mercado
  cidade_regiao: z.string().min(2, "Cidade/região é obrigatória"),
  tipo_imoveis: z.string().min(2, "Tipo de imóveis é obrigatório"),
  publico_alvo: z.string().min(2, "Público-alvo é obrigatório"),
  num_imoveis_ativos: z.number().min(0, "Número deve ser positivo").optional(),
  diferenciais: z.string().optional(),
  
  // Investimento e objetivos
  valor_mensal_anuncios: z.number().min(0, "Valor deve ser positivo").optional(),
  objetivos_marketing: z.string().optional(),
  ticket_medio: z.number().min(0, "Valor deve ser positivo").optional(),
  meta_mensal_vendas: z.number().min(0, "Meta deve ser positiva").optional(),
  
  // Presença digital
  redes_sociais_adicionais: z.array(z.string()).optional(),
  campanhas_ativas: z.boolean(),
  campanhas_detalhes: z.string().optional(),
  pixel_analytics_configurado: z.boolean(),
  crm_utilizado: z.string().optional(),
  
  // Gestão e relacionamento
  nome_gestor_marketing: z.string().optional(),
  forma_receber_relatorios: z.string().optional(),
  observacoes_adicionais: z.string().optional(),
});

const socialNetworks = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "WhatsApp Business",
];

const propertyTypes = [
  "Residencial",
  "Comercial",
  "Industrial",
  "Rural",
  "Lançamentos",
  "Usado",
  "Luxo",
  "Popular",
];

const marketingObjectives = [
  "Aumentar leads qualificados",
  "Melhorar conversão de vendas",
  "Fortalecer marca",
  "Expandir área de atuação",
  "Aumentar engajamento",
  "Educar o mercado",
];

export default function PublicClientRegistration() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      nome_completo: "",
      telefone: "",
      email: "",
      instagram: "",
      nome_imobiliaria: "",
      cnpj_creci: "",
      site_institucional: "",
      cidade_regiao: "",
      tipo_imoveis: "",
      publico_alvo: "",
      num_imoveis_ativos: 0,
      diferenciais: "",
      valor_mensal_anuncios: 0,
      objetivos_marketing: "",
      ticket_medio: 0,
      meta_mensal_vendas: 0,
      redes_sociais_adicionais: [],
      campanhas_ativas: false,
      campanhas_detalhes: "",
      pixel_analytics_configurado: false,
      crm_utilizado: "",
      nome_gestor_marketing: "",
      forma_receber_relatorios: "WhatsApp",
      observacoes_adicionais: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof registrationSchema>) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('public_client_registrations')
        .insert({
          nome_completo: data.nome_completo,
          telefone: data.telefone,
          email: data.email,
          instagram: data.instagram,
          nome_imobiliaria: data.nome_imobiliaria,
          cnpj_creci: data.cnpj_creci,
          site_institucional: data.site_institucional,
          cidade_regiao: data.cidade_regiao,
          tipo_imoveis: data.tipo_imoveis,
          publico_alvo: data.publico_alvo,
          num_imoveis_ativos: data.num_imoveis_ativos,
          diferenciais: data.diferenciais,
          valor_mensal_anuncios: data.valor_mensal_anuncios,
          objetivos_marketing: data.objetivos_marketing,
          ticket_medio: data.ticket_medio,
          meta_mensal_vendas: data.meta_mensal_vendas,
          redes_sociais_adicionais: data.redes_sociais_adicionais,
          campanhas_ativas: data.campanhas_ativas,
          campanhas_detalhes: data.campanhas_detalhes,
          pixel_analytics_configurado: data.pixel_analytics_configurado,
          crm_utilizado: data.crm_utilizado,
          nome_gestor_marketing: data.nome_gestor_marketing,
          forma_receber_relatorios: data.forma_receber_relatorios,
          observacoes_adicionais: data.observacoes_adicionais,
          status: 'Pendente',
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Cadastro enviado!",
        description: "Seus dados foram enviados com sucesso. Entraremos em contato em breve.",
      });
      
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Cadastro Enviado!</h1>
            <p className="text-muted-foreground mb-4">
              Recebemos suas informações e entraremos em contato em breve para dar início ao seu projeto de marketing digital.
            </p>
            <p className="text-sm text-muted-foreground">
              Fique atento ao seu WhatsApp e e-mail.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Cadastro de <span className="text-primary">Cliente</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Preencha as informações abaixo para começarmos a trabalhar juntos
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Dados Principais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Dados Principais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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
                    
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone/WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="(99) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>@ do Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@seuinstagram" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="nome_imobiliaria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Imobiliária/Corretor *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da sua empresa" {...field} />
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
                          <FormLabel>CNPJ/CRECI</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu CNPJ ou número do CRECI" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="site_institucional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Institucional</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.seusite.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Atuação e Mercado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Atuação e Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cidade_regiao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade/Região de Atuação *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: São Paulo - SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tipo_imoveis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Imóveis Trabalhados *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Residencial, Comercial, Lançamentos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="publico_alvo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público-alvo Principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Jovens casais, Investidores" {...field} />
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
                          <FormLabel>Nº de Imóveis Ativos na Carteira</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 50" 
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
                    name="diferenciais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diferenciais da sua Atuação</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="O que te diferencia no mercado? Ex: especialista em lançamentos, atendimento personalizado..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Investimento e Objetivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Investimento e Objetivos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valor_mensal_anuncios"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Mensal para Anúncios (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 5000" 
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
                      name="ticket_medio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Médio dos Imóveis (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 300000" 
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
                          <FormLabel>Meta Mensal de Vendas/Aluguéis</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 10" 
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
                    name="objetivos_marketing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principais Objetivos de Marketing</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Aumentar leads qualificados, fortalecer marca, expandir área de atuação..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Presença Digital */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Presença Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="redes_sociais_adicionais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redes Sociais Adicionais</FormLabel>
                        <FormDescription>
                          Selecione as redes sociais que você utiliza além do Instagram
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {socialNetworks.map((network) => (
                            <div key={network} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(network)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, network]);
                                  } else {
                                    field.onChange(current.filter(item => item !== network));
                                  }
                                }}
                              />
                              <label className="text-sm">{network}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="campanhas_ativas"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Tem campanhas ativas atualmente?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pixel_analytics_configurado"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Pixel/Analytics configurado?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("campanhas_ativas") && (
                    <FormField
                      control={form.control}
                      name="campanhas_detalhes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalhes das Campanhas Ativas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Conte-nos sobre suas campanhas atuais..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="crm_utilizado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRM Utilizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Pipedrive, HubSpot, Vista Software..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Gestão e Relacionamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Gestão e Relacionamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nome_gestor_marketing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Gestor de Marketing</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
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
                          <FormLabel>Forma Preferida para Receber Relatórios</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Email">E-mail</SelectItem>
                              <SelectItem value="Ambos">Ambos</SelectItem>
                              <SelectItem value="Reuniao">Reunião presencial/online</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="observacoes_adicionais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais que considera importante compartilhar..."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Cadastro
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}