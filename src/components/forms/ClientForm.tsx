import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  CreditCard,
  Shield,
  ChevronDown,
  Eye,
  EyeOff,
  TestTube,
  Facebook,
  Chrome,
} from "lucide-react";
import { ClienteFormData } from "@/types/client";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { managersService } from "@/services/managersService";

const clientSchema = z.object({
  // Informações Básicas
  nomeCliente: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  nomeEmpresa: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(14, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  gestorId: z.string().min(1, "Gestor é obrigatório"),
  linkDrive: z.string().url("URL inválida").optional().or(z.literal("")),
  canais: z.array(z.string()).min(1, "Selecione pelo menos um canal"),
  status: z.enum(["Ativo", "Pausado", "Arquivado"]),
  observacoes: z.string().optional(),
  idGrupo: z.string().optional(),
  usaCrmExterno: z.boolean().optional(),
  urlCrm: z.string().url("URL inválida").optional().or(z.literal("")),

  // Meta Ads
  usaMetaAds: z.boolean(),
  ativarCampanhasMeta: z.boolean().optional(),
  metaAccountId: z.string().optional(),
  metaBusinessId: z.string().optional(),
  metaPageId: z.string().optional(),
  modoSaldoMeta: z.enum(["Cartão", "Pix", "Pré-pago (crédito)"]).optional(),
  monitorarSaldoMeta: z.boolean().optional(),
  saldoMeta: z.number().min(0, "Valor deve ser positivo").optional(),
  alertaSaldoBaixo: z.number().min(0, "Valor deve ser positivo").optional(),
  budgetMensalMeta: z.number().min(0, "Valor deve ser positivo").optional(),
  linkMeta: z.string().url("URL inválida").optional().or(z.literal("")),
  utmPadrao: z.string().optional(),
  webhookMeta: z.string().url("URL inválida").optional().or(z.literal("")),

  // Google Ads
  usaGoogleAds: z.boolean(),
  googleAdsId: z.string().optional(),
  budgetMensalGoogle: z.number().min(0, "Valor deve ser positivo").optional(),
  conversoes: z.array(z.string()).optional(),
  linkGoogle: z.string().url("URL inválida").optional().or(z.literal("")),
  webhookGoogle: z.string().url("URL inválida").optional().or(z.literal("")),

  // Comunicação & Automação
  canalRelatorio: z.enum(["WhatsApp", "Email", "Ambos"]).optional(),
  horarioRelatorio: z.string().optional(),
  templatesPadrao: z.array(z.string()).optional(),
  notificacaoSaldoBaixo: z.boolean().optional(),
  notificacaoErroSync: z.boolean().optional(),
  notificacaoLeadsDiarios: z.boolean().optional(),

  // Rastreamento & Analytics
  traqueamentoAtivo: z.boolean(),
  pixelMeta: z.string().optional(),
  ga4StreamId: z.string().optional(),
  gtmId: z.string().optional(),
  typebotAtivo: z.boolean().optional(),
  typebotUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  // Financeiro & Orçamento
  budgetMensalGlobal: z.number().min(0, "Valor deve ser positivo").optional(),
  formaPagamento: z.enum(["Cartão", "Pix", "Boleto", "Misto"]).optional(),
  centroCusto: z.string().optional(),
  contratoInicio: z.string().optional(),
  contratoRenovacao: z.string().optional(),

  // Permissões & Atribuições
  papelPadrao: z.enum(["Usuário padrão", "Gestor", "Administrador"]).optional(),
  usuariosVinculados: z.array(z.string()).optional(),
  ocultarRanking: z.boolean().optional(),
  somarMetricas: z.boolean().optional(),
});

interface ClientFormProps {
  client?: ClienteFormData;
  onSubmit: (data: ClienteFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  isSubmitting?: boolean;
}

const mockTemplates = [
  { id: "tpl1", nome: "Relatório Diário", categoria: "Relatórios" },
  { id: "tpl2", nome: "Alerta de Saldo", categoria: "Alertas" },
  { id: "tpl3", nome: "Follow-up Lead", categoria: "Lead" },
];

export function ClientForm({ 
  client, 
  onSubmit, 
  onCancel, 
  isEdit = false, 
  onDirtyChange,
  isSubmitting = false 
}: ClientFormProps) {
  const { toast } = useToast();
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});
  const [sectionStates, setSectionStates] = useState({
    basico: true,
    meta: client?.usaMetaAds || false,
    google: client?.usaGoogleAds || false,
    comunicacao: true,
    rastreamento: true,
    financeiro: true,
    permissoes: true,
  });

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nomeCliente: client?.nomeCliente || "",
      nomeEmpresa: client?.nomeEmpresa || "",
      telefone: client?.telefone || "",
      email: client?.email || "",
      gestorId: client?.gestorId || "",
      linkDrive: client?.linkDrive || "",
      canais: client?.canais || [],
      status: client?.status || "Ativo",
      observacoes: client?.observacoes || "",
      idGrupo: client?.idGrupo || "",
      usaCrmExterno: client?.usaCrmExterno || false,
      urlCrm: client?.urlCrm || "",

      usaMetaAds: client?.usaMetaAds || false,
      ativarCampanhasMeta: client?.ativarCampanhasMeta || false,
      metaAccountId: client?.metaAccountId || "",
      metaBusinessId: client?.metaBusinessId || "",
      metaPageId: client?.metaPageId || "",
      modoSaldoMeta: client?.modoSaldoMeta || "Pix",
      monitorarSaldoMeta: client?.monitorarSaldoMeta || false,
      saldoMeta: client?.saldoMeta || 0,
      alertaSaldoBaixo: client?.alertaSaldoBaixo || 0,
      budgetMensalMeta: client?.budgetMensalMeta || 0,
      linkMeta: client?.linkMeta || "",
      utmPadrao: client?.utmPadrao || "",
      webhookMeta: client?.webhookMeta || "",

      usaGoogleAds: client?.usaGoogleAds || false,
      googleAdsId: client?.googleAdsId || "",
      budgetMensalGoogle: client?.budgetMensalGoogle || 0,
      conversoes: client?.conversoes || [],
      linkGoogle: client?.linkGoogle || "",
      webhookGoogle: client?.webhookGoogle || "",

      canalRelatorio: client?.canalRelatorio || "WhatsApp",
      horarioRelatorio: client?.horarioRelatorio || "09:00",
      templatesPadrao: client?.templatesPadrao || [],
      notificacaoSaldoBaixo: client?.notificacaoSaldoBaixo || true,
      notificacaoErroSync: client?.notificacaoErroSync || true,
      notificacaoLeadsDiarios: client?.notificacaoLeadsDiarios || false,

      traqueamentoAtivo: client?.traqueamentoAtivo || false,
      pixelMeta: client?.pixelMeta || "",
      ga4StreamId: client?.ga4StreamId || "",
      gtmId: client?.gtmId || "",
      typebotAtivo: client?.typebotAtivo || false,
      typebotUrl: client?.typebotUrl || "",

      budgetMensalGlobal: client?.budgetMensalGlobal || 0,
      formaPagamento: client?.formaPagamento || "Pix",
      centroCusto: client?.centroCusto || "",
      contratoInicio: client?.contratoInicio || "",
      contratoRenovacao: client?.contratoRenovacao || "",

      papelPadrao: client?.papelPadrao || "Usuário padrão",
      usuariosVinculados: client?.usuariosVinculados || [],
      ocultarRanking: client?.ocultarRanking || false,
      somarMetricas: client?.somarMetricas || false,
    },
  });

  // Carregar gestores reais
  useEffect(() => {
    const loadManagers = async () => {
      try {
        setLoadingManagers(true);
        const managersData = await managersService.getManagersForSelect();
        setManagers(managersData);
        console.log('✅ Managers loaded for form:', managersData);
      } catch (error) {
        console.error('❌ Error loading managers:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar gestores",
          variant: "destructive"
        });
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, [toast]);

  // Watch for form changes
  useEffect(() => {
    if (onDirtyChange) {
      const subscription = form.watch(() => {
        onDirtyChange(form.formState.isDirty);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onDirtyChange]);

  // Watch for Meta Ads changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "usaMetaAds") {
        setSectionStates(prev => ({ ...prev, meta: value.usaMetaAds || false }));
      }
      if (name === "usaGoogleAds") {
        setSectionStates(prev => ({ ...prev, google: value.usaGoogleAds || false }));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const togglePasswordVisibility = (field: string) => {
    setShowPasswordFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informações Básicas */}
          <Collapsible 
            open={sectionStates.basico} 
            onOpenChange={() => toggleSection('basico')}
          >
            <Card className="surface-elevated">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Informações Básicas
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.basico ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nomeCliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="João Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="nomeEmpresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Silva & Associados" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone/WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="+55 (99) 99999-9999" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="cliente@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Gestor Responsável - ATUALIZADO COM GESTORES REAIS */}
                  <FormField
                    control={form.control}
                    name="gestorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Gestor Responsável *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione um gestor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingManagers ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                                  <span>Carregando gestores...</span>
                                </div>
                              </SelectItem>
                            ) : managers.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>Nenhum gestor encontrado</span>
                                </div>
                              </SelectItem>
                            ) : (
                              managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  <div className="flex items-center gap-3 py-1">
                                    {manager.avatar_url ? (
                                      <img 
                                        src={manager.avatar_url} 
                                        alt={manager.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs flex items-center justify-center font-medium">
                                        {manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">{manager.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {manager.department} • {manager.clientsCount || 0} clientes
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Escolha o gestor que será responsável por este cliente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="canais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canais de Anúncio *</FormLabel>
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="meta"
                                checked={field.value?.includes("Meta")}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, "Meta"]);
                                  } else {
                                    field.onChange(current.filter(canal => canal !== "Meta"));
                                  }
                                }}
                              />
                              <label htmlFor="meta" className="flex items-center gap-2 cursor-pointer">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                Meta
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="google"
                                checked={field.value?.includes("Google")}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, "Google"]);
                                  } else {
                                    field.onChange(current.filter(canal => canal !== "Google"));
                                  }
                                }}
                              />
                              <label htmlFor="google" className="flex items-center gap-2 cursor-pointer">
                                <Chrome className="h-4 w-4 text-green-600" />
                                Google
                              </label>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              <SelectItem value="Ativo">Ativo</SelectItem>
                              <SelectItem value="Pausado">Pausado</SelectItem>
                              <SelectItem value="Arquivado">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações sobre o cliente..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="idGrupo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Grupo de Disparo (ID)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 text-muted-foreground cursor-help">ℹ️</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>ID do grupo para automações (n8n/WhatsApp)</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="GRP-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="linkDrive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link do Drive</FormLabel>
                          <FormControl>
                            <Input placeholder="https://drive.google.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : (isEdit ? "Atualizar Cliente" : "Criar Cliente")}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}