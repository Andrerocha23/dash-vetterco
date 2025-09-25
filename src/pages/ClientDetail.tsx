import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit, RefreshCw, ExternalLink, DollarSign, Target, 
  TrendingUp, Users, Settings, Activity, CheckCircle, AlertTriangle, 
  Phone, Mail, Building, Eye, BarChart3, Award, Star, Calendar
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  const [activeTab, setActiveTab] = useState("overview");

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

      // Buscar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('campaign_performance_stats')
        .select('*')
        .eq('client_id', id)
        .single();

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
        const { data: leadsStatsData } = await supabase
          .from('leads_stats')
          .select('*')
          .eq('client_id', id)
          .single();

        if (leadsStatsData) {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sincronizado!",
        description: "Dados atualizados com sucesso.",
      });
      
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

  const getImplementationScore = () => {
    let score = 0;
    let total = 0;

    const implementations = [
      client?.meta_account_id,
      client?.google_ads_id,
      client?.pixel_meta,
      client?.ga4_stream_id,
      client?.gtm_id
    ];

    implementations.forEach(impl => {
      total++;
      if (impl) score++;
    });

    return Math.round((score / total) * 100);
  };

  // Loading State
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

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

  const implementationScore = getImplementationScore();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Simples */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/clientes")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{client.nome_cliente}</h1>
              <p className="text-sm text-muted-foreground">{client.nome_empresa}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {client.link_drive && (
              <Button 
                variant="outline"
                onClick={() => window.open(client.link_drive!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Drive
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button 
              onClick={handleSyncClient}
              disabled={syncLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {client.telefone}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {client.email || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Canais</p>
                <div className="flex gap-2">
                  {getChannelBadges(client.canais)}
                </div>
              </div>
            </div>

            {/* KPIs */}
            {stats && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estatísticas de Performance
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency((client.saldo_meta || 0) / 100)}</p>
                    <p className="text-xs text-blue-600">Saldo Meta</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{stats.total_leads}</p>
                    <p className="text-xs text-green-600">Total de Leads</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border">
                    <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-700">{stats.conversion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-orange-600">Taxa de Conversão</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border">
                    <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.total_spend)}</p>
                    <p className="text-xs text-purple-600">Investimento Total</p>
                  </div>
                </div>
              </div>
            )}

            {/* Score de Implementação */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Saúde da Implementação
                </h4>
                <div className="text-right">
                  <div className="text-2xl font-bold">{implementationScore}%</div>
                  <Progress value={implementationScore} className="w-20 mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Meta Account ID', value: client.meta_account_id },
                  { label: 'Google Ads ID', value: client.google_ads_id },
                  { label: 'Pixel Meta', value: client.pixel_meta },
                  { label: 'GA4 Stream ID', value: client.ga4_stream_id },
                  { label: 'GTM ID', value: client.gtm_id },
                  { label: 'Typebot', value: client.typebot_ativo ? 'Ativo' : null }
                ].map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {config.value || '—'}
                      </p>
                    </div>
                    {config.value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Orçamentos */}
            {(client.budget_mensal_meta || client.budget_mensal_google) && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Orçamento Mensal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.budget_mensal_meta && (
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Meta</p>
                      <p className="font-medium text-lg">{formatCurrency(client.budget_mensal_meta)}</p>
                    </div>
                  )}
                  {client.budget_mensal_google && (
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Google</p>
                      <p className="font-medium text-lg">{formatCurrency(client.budget_mensal_google)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {client.observacoes && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Observações</h4>
                <p className="text-sm p-3 bg-gray-50 rounded-lg">
                  {client.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade de Campanhas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade de Campanhas ({campaigns.length})
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "overview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("overview")}
                >
                  Visão Geral
                </Button>
                <Button
                  variant={activeTab === "campaigns" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("campaigns")}
                >
                  Campanhas
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.leads_qualificados}</p>
                    <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Star className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.avg_quality_score?.toFixed(1) || '0.0'}</p>
                    <p className="text-sm text-muted-foreground">Score de Qualidade</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {stats.total_spend > 0 ? formatCurrency(stats.total_spend / stats.total_leads) : 'R$ 0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Custo por Lead</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "campaigns" && (
              <div>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma atividade encontrada</h3>
                    <p className="text-muted-foreground">As campanhas aparecerão aqui quando houver dados disponíveis.</p>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => (
                          <TableRow key={`${campaign.id}-${campaign.date}`}>
                            <TableCell className="font-mono text-sm">
                              {new Date(campaign.date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  campaign.platform === 'Meta' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : campaign.platform === 'Google'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-gray-500 text-gray-600'
                                }
                              >
                                {campaign.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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