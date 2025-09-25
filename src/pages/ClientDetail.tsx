import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, DollarSign, Target, TrendingUp, Edit, Archive, RefreshCw,
  Users, BarChart3, Calendar, Settings, Shield, ExternalLink, AlertTriangle,
  Banknote, Clock, CheckCircle, XCircle
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
import { AccountsSection } from "@/components/accounts/AccountsSection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClienteFormData } from "@/types/client";

// Interfaces
interface ClientData {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  telefone: string;
  email: string | null;
  gestor_id: string;
  canais: string[];
  status: string;
  observacoes: string | null;
  usa_meta_ads: boolean;
  usa_google_ads: boolean;
  traqueamento_ativo: boolean;
  saldo_meta: number | null;
  budget_mensal_meta: number | null;
  budget_mensal_google: number | null;
  budget_mensal_global: number | null;
  pixel_meta: string | null;
  ga4_stream_id: string | null;
  gtm_id: string | null;
  typebot_ativo: boolean | null;
  typebot_url: string | null;
  link_drive: string | null;
  meta_account_id: string | null;
  google_ads_id: string | null;
  modo_saldo_meta: string | null;
  alerta_saldo_baixo: number | null;
  forma_pagamento: string | null;
  centro_custo: string | null;
  contrato_inicio: string | null;
  contrato_renovacao: string | null;
  url_crm: string | null;
  webhook_meta: string | null;
  webhook_google: string | null;
  canal_relatorio: string | null;
  horario_relatorio: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  totalCampaigns: number;
  totalLeads: number;
  totalSpend: number;
  avgQualityScore: number;
  qualificationRate: number;
}

// Dados dos gestores
const gestores = {
  'gest1': { id: 'gest1', name: 'Carlos Silva', avatar: '👨‍💼' },
  'gest2': { id: 'gest2', name: 'Ana Costa', avatar: '👩‍💼' },
  'gest3': { id: 'gest3', name: 'João Santos', avatar: '🧑‍💼' },
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    totalSpend: 0,
    avgQualityScore: 0,
    qualificationRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadClientData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) {
        if (clientError.code === 'PGRST116') {
          toast({
            title: "Cliente não encontrado",
            description: "O cliente solicitado não foi encontrado",
            variant: "destructive",
          });
          navigate("/clients");
          return;
        }
        throw clientError;
      }

      setClient(clientData);

      // Buscar campanhas do cliente
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_leads_daily')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (campaignsError) throw campaignsError;

      setCampaigns(campaignsData || []);

      // Calcular estatísticas das campanhas
      if (campaignsData && campaignsData.length > 0) {
        const totalLeads = campaignsData.reduce((sum, c) => sum + c.leads_count, 0);
        const totalSpend = campaignsData.reduce((sum, c) => sum + c.spend, 0);
        const totalQualified = campaignsData.reduce((sum, c) => sum + (c.qualified_leads || 0), 0);
        const withScores = campaignsData.filter(c => c.quality_score);
        const avgQualityScore = withScores.length > 0 
          ? withScores.reduce((sum, c) => sum + c.quality_score, 0) / withScores.length
          : 0;

        setCampaignStats({
          totalCampaigns: campaignsData.length,
          totalLeads,
          totalSpend,
          avgQualityScore,
          qualificationRate: totalLeads > 0 ? (totalQualified / totalLeads) * 100 : 0,
        });
      }

    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [id, navigate, toast]);

  // Função para editar cliente
  const handleEditClient = async (clientData: ClienteFormData) => {
    if (!client) return;

    try {
      const supabaseData = {
        nome_cliente: clientData.nomeCliente,
        nome_empresa: clientData.nomeEmpresa,
        telefone: clientData.telefone,
        email: clientData.email || null,
        gestor_id: clientData.gestorId,
        canais: clientData.canais,
        status: clientData.status,
        observacoes: clientData.observacoes || null,
        usa_meta_ads: clientData.usaMetaAds,
        usa_google_ads: clientData.usaGoogleAds,
        traqueamento_ativo: clientData.traqueamentoAtivo,
        saldo_meta: clientData.saldoMeta ? clientData.saldoMeta * 100 : null,
        budget_mensal_meta: clientData.budgetMensalMeta || null,
        budget_mensal_google: clientData.budgetMensalGoogle || null,
        pixel_meta: clientData.pixelMeta || null,
        ga4_stream_id: clientData.ga4StreamId || null,
        gtm_id: clientData.gtmId || null,
        typebot_ativo: clientData.typebotAtivo || false,
        typebot_url: clientData.typebotUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('clients')
        .update(supabaseData)
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cliente atualizado com sucesso",
      });

      setShowEditModal(false);
      await loadClientData(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    }
  };

  // Converter dados do cliente para o formato do formulário
  const getClientFormData = (): ClienteFormData => {
    if (!client) return {} as ClienteFormData;

    return {
      id: client.id,
      nomeCliente: client.nome_cliente,
      nomeEmpresa: client.nome_empresa,
      telefone: client.telefone,
      email: client.email || '',
      gestorId: client.gestor_id,
      canais: client.canais as ('Meta' | 'Google')[],
      status: client.status as 'Ativo' | 'Pausado' | 'Arquivado',
      observacoes: client.observacoes || '',
      usaMetaAds: client.usa_meta_ads,
      usaGoogleAds: client.usa_google_ads,
      traqueamentoAtivo: client.traqueamento_ativo,
      saldoMeta: client.saldo_meta ? client.saldo_meta / 100 : 0,
      budgetMensalMeta: client.budget_mensal_meta || 0,
      budgetMensalGoogle: client.budget_mensal_google || 0,
      pixelMeta: client.pixel_meta || '',
      ga4StreamId: client.ga4_stream_id || '',
      gtmId: client.gtm_id || '',
      typebotAtivo: client.typebot_ativo || false,
      typebotUrl: client.typebot_url || '',
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={
          channel === 'Meta' 
            ? 'border-blue-500 text-blue-600 bg-blue-50' 
            : 'border-red-500 text-red-600 bg-red-50'
        }
      >
        {channel}
      </Badge>
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-500/20 text-green-600 border-green-500/50';
      case 'Pausado': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
      case 'Arquivado': return 'bg-gray-500/20 text-gray-600 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
            <p className="text-muted-foreground mb-4">O cliente que você está procurando não existe.</p>
            <Button onClick={() => navigate("/clients")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Clientes
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const manager = gestores[client.gestor_id as keyof typeof gestores] || gestores['gest1'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Simples */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">{client.nome_cliente}</h1>
              <Badge className={getStatusColor(client.status)}>
                {client.status}
              </Badge>
              <div className="flex gap-2">
                {getChannelBadges(client.canais)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-lg">{manager.avatar}</span>
                Gerenciado por {manager.name}
              </span>
              <span>•</span>
              <span>{client.nome_empresa}</span>
              <span>•</span>
              <span>Criado em {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
            <Button variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* KPIs e Budget Total */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Saldo Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((client.saldo_meta || 0) / 100)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Saldo atual</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Budget Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((client.budget_mensal_global || 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Orçamento mensal</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaignStats.totalLeads}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leads capturados</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaignStats.qualificationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leads qualificados</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gasto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(campaignStats.totalSpend)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Investimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Completas do Cliente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Empresa:</span>
                  <p className="font-medium">{client.nome_empresa}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{client.telefone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{client.email || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Forma de Pagamento:</span>
                  <p className="font-medium">{client.forma_pagamento || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Centro de Custo:</span>
                  <p className="font-medium">{client.centro_custo || '—'}</p>
                </div>
                {client.link_drive && (
                  <div>
                    <span className="text-muted-foreground">Drive:</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 font-medium"
                      onClick={() => window.open(client.link_drive!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir Drive
                    </Button>
                  </div>
                )}
              </div>
              {client.observacoes && (
                <div>
                  <span className="text-muted-foreground text-sm">Observações:</span>
                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded">
                    {client.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Canais */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Canais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Meta Ads</p>
                    <p className="text-sm text-muted-foreground">
                      {client.meta_account_id ? `ID: ${client.meta_account_id}` : 'ID não configurado'}
                    </p>
                  </div>
                  <Badge variant={client.usa_meta_ads ? "default" : "secondary"}>
                    {client.usa_meta_ads ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Google Ads</p>
                    <p className="text-sm text-muted-foreground">
                      {client.google_ads_id ? `ID: ${client.google_ads_id}` : 'ID não configurado'}
                    </p>
                  </div>
                  <Badge variant={client.usa_google_ads ? "default" : "secondary"}>
                    {client.usa_google_ads ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Rastreamento</p>
                    <p className="text-sm text-muted-foreground">
                      {client.pixel_meta ? 'Pixel configurado' : 'Pixel não configurado'}
                    </p>
                  </div>
                  <Badge variant={client.traqueamento_ativo ? "default" : "secondary"}>
                    {client.traqueamento_ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {client.usa_meta_ads && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Modo Saldo Meta:</span>
                      <p className="font-medium">{client.modo_saldo_meta || '—'}</p>
                    </div>
                    {client.alerta_saldo_baixo && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Alerta Saldo Baixo:</span>
                        <p className="font-medium">{formatCurrency(client.alerta_saldo_baixo / 100)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status de Configuração */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status de Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contas configuradas</span>
                  {client.meta_account_id || client.google_ads_id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pixel/Analytics</span>
                  {client.pixel_meta || client.ga4_stream_id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhooks</span>
                  {client.webhook_meta || client.webhook_google ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">CRM Externo</span>
                  {client.url_crm ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Relatórios</span>
                  {client.canal_relatorio && client.horario_relatorio ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {client.contrato_inicio && (
                  <div className="pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Contrato:</span>
                      <p className="font-medium">
                        {new Date(client.contrato_inicio).toLocaleDateString('pt-BR')}
                        {client.contrato_renovacao && (
                          <span className="text-muted-foreground">
                            {' até '}
                            {new Date(client.contrato_renovacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes seções */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="details">Dados Completos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns" className="space-y-4">
            <Card className="surface-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campanhas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma campanha encontrada</p>
                    <p className="text-sm">As campanhas aparecerão aqui quando disponíveis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Leads</TableHead>
                          <TableHead>Gasto</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.slice(0, 10).map((campaign) => (
                          <TableRow key={`${campaign.date}-${campaign.campaign_id}`}>
                            <TableCell>
                              {new Date(campaign.date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{campaign.campaign_name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {campaign.campaign_id}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  campaign.platform === 'Meta' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-red-500 text-red-600'
                                }
                              >
                                {campaign.platform}
                              </Badge>
                            </TableCell>
                            <TableCell>{campaign.leads_count}</TableCell>
                            <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  campaign.feedback_status === 'Aprovado' 
                                    ? 'bg-green-500/20 text-green-600' 
                                    : campaign.feedback_status === 'Pendente'
                                    ? 'bg-yellow-500/20 text-yellow-600'
                                    : 'bg-gray-500/20 text-gray-600'
                                }
                              >
                                {campaign.feedback_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accounts" className="space-y-4">
            <AccountsSection clientId={client.id} />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados Preenchidos */}
              <Card className="surface-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Dados Preenchidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Nome do Cliente', value: client.nome_cliente },
                    { label: 'Nome da Empresa', value: client.nome_empresa },
                    { label: 'Telefone', value: client.telefone },
                    { label: 'Email', value: client.email },
                    { label: 'Link Drive', value: client.link_drive },
                    { label: 'Meta Account ID', value: client.meta_account_id },
                    { label: 'Google Ads ID', value: client.google_ads_id },
                    { label: 'Pixel Meta', value: client.pixel_meta },
                    { label: 'GA4 Stream ID', value: client.ga4_stream_id },
                    { label: 'GTM ID', value: client.gtm_id },
                    { label: 'Budget Mensal Global', value: client.budget_mensal_global ? formatCurrency(client.budget_mensal_global) : null },
                    { label: 'Budget Mensal Meta', value: client.budget_mensal_meta ? formatCurrency(client.budget_mensal_meta) : null },
                    { label: 'Budget Mensal Google', value: client.budget_mensal_google ? formatCurrency(client.budget_mensal_google) : null },
                    { label: 'URL CRM', value: client.url_crm },
                    { label: 'Webhook Meta', value: client.webhook_meta },
                    { label: 'Webhook Google', value: client.webhook_google },
                    { label: 'Canal Relatório', value: client.canal_relatorio },
                    { label: 'Horário Relatório', value: client.horario_relatorio },
                    { label: 'Typebot URL', value: client.typebot_url },
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="flex justify-between items-start border-b border-muted/20 pb-2">
                      <span className="text-sm text-muted-foreground">{item.label}:</span>
                      <span className="text-sm font-medium text-right max-w-[60%] break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Dados Pendentes */}
              <Card className="surface-elevated border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Dados Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Email', missing: !client.email },
                    { label: 'Link Drive', missing: !client.link_drive },
                    { label: 'Meta Account ID', missing: !client.meta_account_id && client.usa_meta_ads },
                    { label: 'Google Ads ID', missing: !client.google_ads_id && client.usa_google_ads },
                    { label: 'Pixel Meta', missing: !client.pixel_meta && client.traqueamento_ativo },
                    { label: 'GA4 Stream ID', missing: !client.ga4_stream_id && client.traqueamento_ativo },
                    { label: 'GTM ID', missing: !client.gtm_id && client.traqueamento_ativo },
                    { label: 'Budget Mensal Global', missing: !client.budget_mensal_global },
                    { label: 'Budget Mensal Meta', missing: !client.budget_mensal_meta && client.usa_meta_ads },
                    { label: 'Budget Mensal Google', missing: !client.budget_mensal_google && client.usa_google_ads },
                    { label: 'URL CRM', missing: !client.url_crm },
                    { label: 'Webhook Meta', missing: !client.webhook_meta && client.usa_meta_ads },
                    { label: 'Webhook Google', missing: !client.webhook_google && client.usa_google_ads },
                    { label: 'Canal Relatório', missing: !client.canal_relatorio },
                    { label: 'Horário Relatório', missing: !client.horario_relatorio },
                    { label: 'Typebot URL', missing: !client.typebot_url && client.typebot_ativo },
                    { label: 'Forma de Pagamento', missing: !client.forma_pagamento },
                    { label: 'Centro de Custo', missing: !client.centro_custo },
                    { label: 'Contrato Início', missing: !client.contrato_inicio },
                  ].filter(item => item.missing).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {[
                    { label: 'Email', missing: !client.email },
                    { label: 'Link Drive', missing: !client.link_drive },
                    { label: 'Meta Account ID', missing: !client.meta_account_id && client.usa_meta_ads },
                    { label: 'Google Ads ID', missing: !client.google_ads_id && client.usa_google_ads },
                    { label: 'Pixel Meta', missing: !client.pixel_meta && client.traqueamento_ativo },
                    { label: 'GA4 Stream ID', missing: !client.ga4_stream_id && client.traqueamento_ativo },
                    { label: 'GTM ID', missing: !client.gtm_id && client.traqueamento_ativo },
                    { label: 'Budget Mensal Global', missing: !client.budget_mensal_global },
                    { label: 'Budget Mensal Meta', missing: !client.budget_mensal_meta && client.usa_meta_ads },
                    { label: 'Budget Mensal Google', missing: !client.budget_mensal_google && client.usa_google_ads },
                    { label: 'URL CRM', missing: !client.url_crm },
                    { label: 'Webhook Meta', missing: !client.webhook_meta && client.usa_meta_ads },
                    { label: 'Webhook Google', missing: !client.webhook_google && client.usa_google_ads },
                    { label: 'Canal Relatório', missing: !client.canal_relatorio },
                    { label: 'Horário Relatório', missing: !client.horario_relatorio },
                    { label: 'Typebot URL', missing: !client.typebot_url && client.typebot_ativo },
                    { label: 'Forma de Pagamento', missing: !client.forma_pagamento },
                    { label: 'Centro de Custo', missing: !client.centro_custo },
                    { label: 'Contrato Início', missing: !client.contrato_inicio },
                  ].filter(item => item.missing).length === 0 && (
                    <div className="text-center py-4 text-green-600">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Todos os dados estão preenchidos!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Edição */}
        <ClienteFormModal
          mode="edit"
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={handleEditClient}
          initialValues={getClientFormData()}
        />
      </div>
    </AppLayout>
  );
}