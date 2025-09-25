import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, DollarSign, Target, TrendingUp, Edit, RefreshCw,
  Users, BarChart3, Settings, ExternalLink, CheckCircle, AlertCircle
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
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
  link_drive: string | null;
  usa_meta_ads: boolean;
  usa_google_ads: boolean;
  meta_account_id: string | null;
  google_ads_id: string | null;
  pixel_meta: string | null;
  ga4_stream_id: string | null;
  gtm_id: string | null;
  saldo_meta: number | null;
  budget_mensal_meta: number | null;
  budget_mensal_google: number | null;
  typebot_ativo: boolean | null;
  typebot_url: string | null;
  created_at: string;
}

interface CampaignData {
  id: string;
  client_id: string;
  campaign_name: string | null;
  platform: string;
  date: string;
  spend: number | null;
  leads_count: number;
  ctr: number | null;
  quality_score: number | null;
  kanban_status: string | null;
  feedback_status: string | null;
}

interface ClientStats {
  total_leads: number;
  leads_convertidos: number;
  leads_qualificados: number;
  total_spend: number;
  avg_quality_score: number;
  conversion_rate: number;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;

      setClient(clientData);

      // Buscar campanhas
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_leads_daily')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false })
        .limit(20);

      if (campaignsError) console.warn('Campaigns data not found:', campaignsError);
      setCampaigns(campaignsData || []);

      // Buscar estatísticas consolidadas
      const { data: statsData, error: statsError } = await supabase
        .from('campaign_performance_stats')
        .select('*')
        .eq('client_id', id)
        .single();

      if (statsError) console.warn('Stats not found:', statsError);
      
      // Se não tiver stats consolidadas, buscar da view leads_stats
      let finalStats = null;
      if (statsData) {
        finalStats = {
          total_leads: statsData.total_leads || 0,
          leads_convertidos: statsData.total_converted || 0,
          leads_qualificados: statsData.total_qualified || 0,
          total_spend: statsData.total_spend || 0,
          avg_quality_score: statsData.avg_quality_score || 0,
          conversion_rate: statsData.conversion_rate || 0
        };
      } else {
        // Buscar da view leads_stats como fallback
        const { data: leadsStatsData, error: leadsStatsError } = await supabase
          .from('leads_stats')
          .select('*')
          .eq('client_id', id)
          .single();

        if (!leadsStatsError && leadsStatsData) {
          finalStats = {
            total_leads: leadsStatsData.total_leads || 0,
            leads_convertidos: leadsStatsData.leads_convertidos || 0,
            leads_qualificados: leadsStatsData.leads_qualificados || 0,
            total_spend: leadsStatsData.valor_total_conversoes || 0,
            avg_quality_score: leadsStatsData.nota_media || 0,
            conversion_rate: leadsStatsData.leads_convertidos && leadsStatsData.leads_qualificados 
              ? (leadsStatsData.leads_convertidos / leadsStatsData.leads_qualificados) * 100 
              : 0
          };
        }
      }
      
      setStats(finalStats);

    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = async (data: ClienteFormData) => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          nome_cliente: data.nomeCliente,
          nome_empresa: data.nomeEmpresa,
          telefone: data.telefone,
          email: data.email || null,
          observacoes: data.observacoes || null,
          canais: data.canais,
          status: data.status,
          usa_meta_ads: data.usaMetaAds,
          usa_google_ads: data.usaGoogleAds,
          meta_account_id: data.metaAccountId || null,
          google_ads_id: data.googleAdsId || null,
          pixel_meta: data.pixelMeta || null,
          ga4_stream_id: data.ga4StreamId || null,
          gtm_id: data.gtmId || null,
          typebot_ativo: data.typebotAtivo,
          typebot_url: data.typebotUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Cliente ${data.nomeCliente} atualizado com sucesso.`,
      });
      
      // Recarregar dados
      await loadClientData();
      
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    }
  };

  const handleSyncClient = async () => {
    setSyncLoading(true);
    try {
      // Simular sincronização - aqui você implementaria a lógica real
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sincronizado!",
        description: "Dados do cliente sincronizados com sucesso.",
      });
      
      // Recarregar dados após sincronização
      await loadClientData();
      
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados",
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const getClientFormData = (): ClienteFormData => {
    if (!client) return {} as ClienteFormData;
    
    return {
      nomeCliente: client.nome_cliente,
      nomeEmpresa: client.nome_empresa,
      telefone: client.telefone,
      email: client.email,
      observacoes: client.observacoes,
      gestorId: client.gestor_id,
      canais: client.canais,
      status: client.status,
      usaMetaAds: client.usa_meta_ads,
      usaGoogleAds: client.usa_google_ads,
      metaAccountId: client.meta_account_id,
      googleAdsId: client.google_ads_id,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pausado': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Inativo': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={
          channel === 'Meta' 
            ? 'border-blue-500 text-blue-600 bg-blue-50'
            : channel === 'Google'
            ? 'border-green-500 text-green-600 bg-green-50'
            : channel === 'TikTok'
            ? 'border-black text-black bg-gray-50'
            : 'border-gray-500 text-gray-600 bg-gray-50'
        }
      >
        {channel}
      </Badge>
    ));
  };

  // Loading State
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Client Not Found
  if (!client) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Cliente não encontrado</h1>
            <p className="text-muted-foreground mb-4">O cliente solicitado não foi encontrado.</p>
            <Button onClick={() => navigate('/clientes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/clientes")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{client.nome_cliente}</h1>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                <div className="flex gap-2">
                  {getChannelBadges(client.canais)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{client.nome_empresa}</span>
                <span>•</span>
                <span>{client.telefone}</span>
                {client.email && (
                  <>
                    <span>•</span>
                    <span>{client.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
            <Button 
              variant="default"
              onClick={handleSyncClient}
              disabled={syncLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Saldo Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency((client.saldo_meta || 0) / 100)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Disponível</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.total_leads || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gerados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.conversion_rate?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leads → Vendas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Investimento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats?.total_spend || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gasto em campanhas</p>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Cliente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{client.nome_cliente}</p>
                </div>
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
              </div>
              
              {client.link_drive && (
                <div className="pt-3 border-t">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 font-medium"
                    onClick={() => window.open(client.link_drive!, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir Drive do Cliente
                  </Button>
                </div>
              )}
              
              {client.observacoes && (
                <div className="pt-3 border-t">
                  <span className="text-muted-foreground text-sm">Observações:</span>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md">
                    {client.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações e Implementações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações e Rastreamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Meta Account ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{client.meta_account_id || '—'}</span>
                    {client.meta_account_id ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Google Ads ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{client.google_ads_id || '—'}</span>
                    {client.google_ads_id ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pixel Meta:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{client.pixel_meta || '—'}</span>
                    {client.pixel_meta ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GA4 Stream:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{client.ga4_stream_id || '—'}</span>
                    {client.ga4_stream_id ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GTM ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{client.gtm_id || '—'}</span>
                    {client.gtm_id ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Typebot:</span>
                  <Badge variant={client.typebot_ativo ? "default" : "secondary"}>
                    {client.typebot_ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {client.typebot_url && (
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {client.typebot_url}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Budget Mensal Meta:</span>
                  <p className="font-medium">{client.budget_mensal_meta ? formatCurrency(client.budget_mensal_meta) : '—'}</p>
                </div>
                <div className="text-sm mt-2">
                  <span className="text-muted-foreground">Budget Mensal Google:</span>
                  <p className="font-medium">{client.budget_mensal_google ? formatCurrency(client.budget_mensal_google) : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campanhas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades de Campanha Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma atividade de campanha encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-center">CTR</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={`${campaign.id}-${campaign.date}`}>
                        <TableCell className="font-mono text-sm">
                          {new Date(campaign.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            campaign.platform === 'Meta' 
                              ? 'border-blue-500 text-blue-600' 
                              : campaign.platform === 'Google'
                              ? 'border-green-500 text-green-600'
                              : 'border-gray-500 text-gray-600'
                          }>
                            {campaign.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {campaign.campaign_name || 'Campanha sem nome'}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {campaign.leads_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.spend ? formatCurrency(campaign.spend) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.ctr ? `${campaign.ctr.toFixed(2)}%` : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.kanban_status && (
                            <Badge variant="outline" className={
                              campaign.kanban_status === 'Executado'
                                ? 'border-green-500 text-green-600'
                                : campaign.kanban_status === 'Em Andamento'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-yellow-500 text-yellow-600'
                            }>
                              {campaign.kanban_status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição */}
      <ClienteFormModal
        mode="edit"
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleEditClient}
        initialValues={getClientFormData()}
      />
    </AppLayout>
  );
}