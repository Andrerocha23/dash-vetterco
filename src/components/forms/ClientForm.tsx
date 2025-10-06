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
import { supabase } from "@/integrations/supabase/client";
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
// managersService removido

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
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
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
      notificacaoLeadsDiarios: client?.notificacaoLeadsDiarios || true,

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
      somarMetricas: client?.somarMetricas || true,
    },
  });

  const usaMetaAds = form.watch("usaMetaAds");
  const usaGoogleAds = form.watch("usaGoogleAds");
  const monitorarSaldoMeta = form.watch("monitorarSaldoMeta");
  const usaCrmExterno = form.watch("usaCrmExterno");
  const typebotAtivo = form.watch("typebotAtivo");
  const budgetMeta = form.watch("budgetMensalMeta");
  const budgetGoogle = form.watch("budgetMensalGoogle");

  // Load users (antigos gestores)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingManagers(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name');
        
        if (error) throw error;
        
        setAvailableManagers(data?.map(u => ({
          id: u.id,
          nome: u.name || u.email || 'Sem nome'
        })) || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários",
          variant: "destructive",
        });
      } finally {
        setLoadingManagers(false);
      }
    };

    loadUsers();
  }, []);

  // Track dirty state
  const { isDirty } = form.formState;
  
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Auto-calculate global budget
  if (budgetMeta && budgetGoogle) {
    const globalBudget = (budgetMeta || 0) + (budgetGoogle || 0);
    if (form.getValues("budgetMensalGlobal") !== globalBudget) {
      form.setValue("budgetMensalGlobal", globalBudget);
    }
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswordFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testWebhook = (url: string, type: string) => {
    toast({
      title: "Teste de Webhook",
      description: `Testando conexão com ${type}... (Mock)`,
    });
  };

  const handleSubmit = (data: z.infer<typeof clientSchema>) => {
    onSubmit(data as ClienteFormData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const SectionHeader = ({ icon: Icon, title, isOpen, onToggle, disabled = false }: {
    icon: any;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <CollapsibleTrigger asChild>
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-2xl border border-border ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={disabled ? undefined : onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </CollapsibleTrigger>
  );

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 grid-cols-1">
            
            {/* 1. Informações Básicas */}
            <div className="lg:col-span-2">
              <Collapsible
                open={sectionStates.basico}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, basico: !prev.basico }))}
              >
                <SectionHeader
                  icon={Building2}
                  title="Informações Básicas"
                  isOpen={sectionStates.basico}
                  onToggle={() => setSectionStates(prev => ({ ...prev, basico: !prev.basico }))}
                />
                <CollapsibleContent>
                  <Card className="surface-elevated mt-4">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="nomeCliente"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Cliente *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Casa & Cia Imóveis" {...field} />
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
                                <Input placeholder="Ex: Casa & Cia LTDA" {...field} />
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
                        
                        <FormField
                          control={form.control}
                          name="gestorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gestor Responsável *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingManagers ? "Carregando..." : "Selecione um gestor"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableManagers.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                          {manager.name.charAt(0)}
                                        </div>
                                        <div>
                                          <span className="font-medium">{manager.name}</span>
                                          {manager.department && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                              ({manager.department})
                                            </span>
                                          )}
                                          {manager.clientsCount !== undefined && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                              - {manager.clientsCount} cliente{manager.clientsCount !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {availableManagers.length === 0 && !loadingManagers && (
                                    <SelectItem value="none" disabled>
                                      Nenhum gestor disponível
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
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
                        
                        <FormField
                          control={form.control}
                          name="canais"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canais Utilizados *</FormLabel>
                              <div className="flex gap-4">
                                {["Meta", "Google"].map((canal) => (
                                  <div key={canal} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={canal}
                                      checked={field.value?.includes(canal)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, canal]);
                                        } else {
                                          field.onChange(current.filter(c => c !== canal));
                                        }
                                      }}
                                    />
                                    <label htmlFor={canal} className="text-sm font-medium">
                                      {canal}
                                    </label>
                                  </div>
                                ))}
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
                              <FormLabel>Status do Cliente</FormLabel>
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
                          name="usaCrmExterno"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">BIM/CRM Externo</FormLabel>
                                <FormDescription>
                                  Integração com CRM externo
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {usaCrmExterno && (
                          <FormField
                            control={form.control}
                            name="urlCrm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL do CRM</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://meu-crm.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 2. Meta Ads */}
            <div>
              <Collapsible
                open={sectionStates.meta && usaMetaAds}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, meta: !prev.meta }))}
              >
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Meta Ads</h3>
                    <FormField
                      control={form.control}
                      name="usaMetaAds"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setSectionStates(prev => ({ ...prev, meta: checked }));
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {usaMetaAds && (
                    <ChevronDown className={`h-5 w-5 transition-transform ${sectionStates.meta ? 'rotate-180' : ''}`} />
                  )}
                </div>
                
                {usaMetaAds && (
                  <CollapsibleContent>
                    <Card className="surface-elevated mt-4">
                      <CardContent className="p-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="ativarCampanhasMeta"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Ativar campanhas Meta</FormLabel>
                                <FormDescription>Habilitar gestão de campanhas</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid gap-4 lg:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="metaAccountId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Ad Account ID *</FormLabel>
                                <FormControl>
                                  <Input placeholder="act_123456789 ou 123456789" {...field} />
                                </FormControl>
                                <FormDescription>Cole aqui o ID exato</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="metaBusinessId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Business ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="987654321" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="metaPageId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Page ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="1122334455" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="modoSaldoMeta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modo de saldo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Cartão">Cartão</SelectItem>
                                    <SelectItem value="Pix">Pix</SelectItem>
                                    <SelectItem value="Pré-pago (crédito)">Pré-pago (crédito)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="monitorarSaldoMeta"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Monitorar saldo Meta</FormLabel>
                                <FormDescription>Alertas de saldo baixo</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {monitorarSaldoMeta && (
                          <div className="grid gap-4 lg:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="saldoMeta"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Valor do Saldo (R$)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0,00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                                      value={field.value ? field.value / 100 : ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="alertaSaldoBaixo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alerta de Saldo Baixo (R$)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0,00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                                      value={field.value ? field.value / 100 : ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        <div className="grid gap-4 lg:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="budgetMensalMeta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget Mensal (R$) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                                    value={field.value ? field.value / 100 : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="linkMeta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link do Gerenciador / Página</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://business.facebook.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="utmPadrao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Política de UTM padrão</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="utm_source=meta&utm_medium=cpc&utm_campaign={{campanha}}"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="webhookMeta"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Webhook de sincronização imediata</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="https://n8n.app.com/webhook/sync-meta" {...field} />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => testWebhook(field.value, "Meta")}
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>

            {/* 3. Google Ads */}
            <div>
              <Collapsible
                open={sectionStates.google && usaGoogleAds}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, google: !prev.google }))}
              >
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Chrome className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold">Google Ads</h3>
                    <FormField
                      control={form.control}
                      name="usaGoogleAds"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setSectionStates(prev => ({ ...prev, google: checked }));
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {usaGoogleAds && (
                    <ChevronDown className={`h-5 w-5 transition-transform ${sectionStates.google ? 'rotate-180' : ''}`} />
                  )}
                </div>
                
                {usaGoogleAds && (
                  <CollapsibleContent>
                    <Card className="surface-elevated mt-4">
                      <CardContent className="p-6 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="googleAdsId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID da Conta Google Ads *</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234567890 (10 dígitos)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="budgetMensalGoogle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget Mensal (R$)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                                    value={field.value ? field.value / 100 : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="linkGoogle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link do Google Ads</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://ads.google.com/" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="conversoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conversões (label)</FormLabel>
                              <div className="flex gap-4 flex-wrap">
                                {["Formulário", "Ligação", "WhatsApp", "Visita"].map((conversao) => (
                                  <div key={conversao} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={conversao}
                                      checked={field.value?.includes(conversao)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, conversao]);
                                        } else {
                                          field.onChange(current.filter(c => c !== conversao));
                                        }
                                      }}
                                    />
                                    <label htmlFor={conversao} className="text-sm font-medium">
                                      {conversao}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="webhookGoogle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Webhook de sincronização imediata</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="https://n8n.app.com/webhook/sync-google" {...field} />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => testWebhook(field.value, "Google")}
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>

            {/* 4. Comunicação & Automação */}
            <div className="lg:col-span-2">
              <Collapsible
                open={sectionStates.comunicacao}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, comunicacao: !prev.comunicacao }))}
              >
                <SectionHeader
                  icon={MessageSquare}
                  title="Comunicação & Automação"
                  isOpen={sectionStates.comunicacao}
                  onToggle={() => setSectionStates(prev => ({ ...prev, comunicacao: !prev.comunicacao }))}
                />
                <CollapsibleContent>
                  <Card className="surface-elevated mt-4">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="canalRelatorio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canal de Relatórios</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                  <SelectItem value="Email">Email</SelectItem>
                                  <SelectItem value="Ambos">Ambos</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="horarioRelatorio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horário do Relatório Diário</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="templatesPadrao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Templates Padrão</FormLabel>
                            <div className="grid gap-2 lg:grid-cols-3">
                              {mockTemplates.map((template) => (
                                <div key={template.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={template.id}
                                    checked={field.value?.includes(template.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, template.id]);
                                      } else {
                                        field.onChange(current.filter(id => id !== template.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={template.id} className="text-sm font-medium">
                                    {template.nome}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Notificações</h4>
                        <div className="grid gap-4 lg:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="notificacaoSaldoBaixo"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Saldo baixo</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificacaoErroSync"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Erro de sincronização</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificacaoLeadsDiarios"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Leads diários</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 5. Rastreamento & Analytics */}
            <div>
              <Collapsible
                open={sectionStates.rastreamento}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, rastreamento: !prev.rastreamento }))}
              >
                <SectionHeader
                  icon={BarChart3}
                  title="Rastreamento & Analytics"
                  isOpen={sectionStates.rastreamento}
                  onToggle={() => setSectionStates(prev => ({ ...prev, rastreamento: !prev.rastreamento }))}
                />
                <CollapsibleContent>
                  <Card className="surface-elevated mt-4">
                    <CardContent className="p-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="traqueamentoAtivo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Rastreamento Ativo</FormLabel>
                              <FormDescription>Habilitar tracking e analytics</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="pixelMeta"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pixel Meta</FormLabel>
                              <FormControl>
                                <Input placeholder="1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ga4StreamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GA4 Stream ID</FormLabel>
                              <FormControl>
                                <Input placeholder="G-ABCD1234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="gtmId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GTM Container ID</FormLabel>
                              <FormControl>
                                <Input placeholder="GTM-XXXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="typebotAtivo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Typebot Ativo</FormLabel>
                              <FormDescription>Chatbot automatizado</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {typebotAtivo && (
                        <FormField
                          control={form.control}
                          name="typebotUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL do Bot</FormLabel>
                              <FormControl>
                                <Input placeholder="https://typebot.co/seu-bot" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <div className="p-4 bg-secondary/20 rounded-lg">
                        <h4 className="text-md font-semibold mb-3">Checklist de Implementação</h4>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { name: "Pixel", active: !!form.watch("pixelMeta") },
                            { name: "GA4", active: !!form.watch("ga4StreamId") },
                            { name: "UTM padrão", active: !!form.watch("utmPadrao") },
                            { name: "Typebot", active: form.watch("typebotAtivo") },
                          ].map((item) => (
                            <Badge
                              key={item.name}
                              variant={item.active ? "default" : "secondary"}
                              className={item.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                            >
                              {item.active ? "✓" : "✗"} {item.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 6. Financeiro & Orçamento */}
            <div>
              <Collapsible
                open={sectionStates.financeiro}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, financeiro: !prev.financeiro }))}
              >
                <SectionHeader
                  icon={CreditCard}
                  title="Financeiro & Orçamento"
                  isOpen={sectionStates.financeiro}
                  onToggle={() => setSectionStates(prev => ({ ...prev, financeiro: !prev.financeiro }))}
                />
                <CollapsibleContent>
                  <Card className="surface-elevated mt-4">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="budgetMensalGlobal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Mensal Global (R$)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                                  value={field.value ? field.value / 100 : ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Sugestão: {formatCurrency((budgetMeta || 0) + (budgetGoogle || 0))}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="formaPagamento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Forma de Pagamento Principal</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Cartão">Cartão</SelectItem>
                                  <SelectItem value="Pix">Pix</SelectItem>
                                  <SelectItem value="Boleto">Boleto</SelectItem>
                                  <SelectItem value="Misto">Misto</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contratoInicio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início do Contrato</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contratoRenovacao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Renovação</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="centroCusto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de Custo / Observações Financeiras</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Marketing Imobiliário..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 7. Permissões & Atribuições */}
            <div className="lg:col-span-2">
              <Collapsible
                open={sectionStates.permissoes}
                onOpenChange={() => setSectionStates(prev => ({ ...prev, permissoes: !prev.permissoes }))}
              >
                <SectionHeader
                  icon={Shield}
                  title="Permissões & Atribuições"
                  isOpen={sectionStates.permissoes}
                  onToggle={() => setSectionStates(prev => ({ ...prev, permissoes: !prev.permissoes }))}
                />
                <CollapsibleContent>
                  <Card className="surface-elevated mt-4">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="papelPadrao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Papel padrão de acesso ao cliente</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Usuário padrão">Usuário padrão</SelectItem>
                                  <SelectItem value="Gestor">Gestor</SelectItem>
                                  <SelectItem value="Administrador">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Visibilidade</h4>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="ocultarRanking"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Ocultar do ranking público</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="somarMetricas"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Somar nas métricas gerais</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 flex justify-between items-center gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            
            <Button 
              type="submit" 
              className="gradient-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}