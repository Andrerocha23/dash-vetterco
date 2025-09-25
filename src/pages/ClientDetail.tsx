import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit, RefreshCw, ExternalLink, DollarSign, Target, 
  TrendingUp, Users, Settings, Calendar, BarChart3, Activity,
  CheckCircle, AlertTriangle, Zap, Star, Phone, Mail, Building,
  Globe, Eye, MousePointer, ShoppingCart, Award, Clock, MapPin
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
        title: "🎉 Sucesso!",
        description: `Cliente ${data.nomeCliente} atualizado com sucesso.`,
      });
      
      await loadClientData();
      
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
      toast({
        title: "❌ Erro",
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
        title: "⚡ Sincronizado!",
        description: "Dados atualizados com sucesso.",
      });
      
      await loadClientData();
      
    } catch (error) {
      toast({
        title: "❌ Erro na sincronização",
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
      case 'Ativo': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'Pausado': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'Inativo': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`
          ${channel === 'Meta' ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' : ''}
          ${channel === 'Google' ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' : ''}
          ${channel === 'TikTok' ? 'border-pink-500 text-pink-700 bg-pink-50 hover:bg-pink-100' : ''}
          ${!['Meta', 'Google', 'TikTok'].includes(channel) ? 'border-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100' : ''}
          transition-colors duration-200 cursor-pointer
        `}
      >
        {channel}
      </Badge>
    ));
  };

  const getImplementationScore = () => {
    let score = 0;
    let total = 0;

    // Verificar implementações críticas
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
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Cliente não encontrado</h1>
            <p className="text-gray-600 max-w-md">O cliente solicitado não existe ou foi removido do sistema.</p>
            <Button onClick={() => navigate('/clientes')} className="mt-4">
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
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <Button
                  variant="ghost" 
                  size="lg"
                  onClick={() => navigate("/clientes")}
                  className="rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {client.nome_cliente}
                    </h1>
                    <p className="text-xl text-gray-600 flex items-center gap-2 mt-2">
                      <Building className="h-5 w-5" />
                      {client.nome_empresa}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={`px-4 py-2 text-sm font-medium ${getStatusColor(client.status)}`}>
                      <Activity className="w-4 h-4 mr-2" />
                      {client.status}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {getChannelBadges(client.canais)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      {client.telefone}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {client.link_drive && (
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(client.link_drive!, '_blank')}
                    className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Abrir Drive
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowEditModal(true)}
                  className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Editar
                </Button>
                
                <Button 
                  size="lg"
                  onClick={handleSyncClient}
                  disabled={syncLoading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatCurrency((client.saldo_meta || 0) / 100)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Meta Ads</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium mb-1">Total de Leads</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {stats?.total_leads || 0}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    +{stats?.leads_convertidos || 0} convertidos
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium mb-1">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-orange-700">
                    {stats?.conversion_rate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Leads → Vendas</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium mb-1">Investimento Total</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {formatCurrency(stats?.total_spend || 0)}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Todas as campanhas</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Health Score */}
        <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Saúde da Implementação</CardTitle>
                  <p className="text-sm text-gray-600">Status das configurações críticas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{implementationScore}%</div>
                <Progress value={implementationScore} className="w-24 mt-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Meta Account ID', value: client.meta_account_id, icon: Globe, color: 'blue' },
                { label: 'Google Ads ID', value: client.google_ads_id, icon: Globe, color: 'green' },
                { label: 'Pixel Meta', value: client.pixel_meta, icon: Eye, color: 'blue' },
                { label: 'GA4 Stream ID', value: client.ga4_stream_id, icon: BarChart3, color: 'orange' },
                { label: 'GTM ID', value: client.gtm_id, icon: MousePointer, color: 'purple' }
              ].map((config, index) => {
                const Icon = config.icon;
                const isConfigured = !!config.value;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isConfigured 
                        ? `bg-${config.color}-100 text-${config.color}-600` 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isConfigured ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <p className="text-xs text-gray-600">
                          {isConfigured ? 'Configurado' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typebot Status */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    client.typebot_ativo ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Typebot</p>
                    <p className="text-sm text-gray-600">Automação de conversas</p>
                  </div>
                </div>
                <Badge variant={client.typebot_ativo ? "default" : "secondary"} className="px-4 py-2">
                  {client.typebot_ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            {/* Budget Information */}
            {(client.budget_mensal_meta || client.budget_mensal_google) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  Orçamento Mensal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.budget_mensal_meta && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-sm text-blue-600 mb-1">Meta Ads</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(client.budget_mensal_meta)}</p>
                    </div>
                  )}
                  {client.budget_mensal_google && (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-sm text-green-600 mb-1">Google Ads</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(client.budget_mensal_google)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {client.observacoes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Observações
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                  <p className="text-gray-700 leading-relaxed">{client.observacoes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="bg-white border-gray-200 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Atividade de Campanhas</CardTitle>
                  <p className="text-sm text-gray-600">{campaigns.length} registros encontrados</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "overview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("overview")}
                  className="transition-all duration-200"
                >
                  Visão Geral
                </Button>
                <Button
                  variant={activeTab === "campaigns" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("campaigns")}
                  className="transition-all duration-200"
                >
                  Campanhas
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {activeTab === "overview" && stats && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-blue-700">{stats.leads_qualificados}</p>
                    <p className="text-sm text-blue-600 font-medium">Leads Qualificados</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {stats.total_leads > 0 ? Math.round((stats.leads_qualificados / stats.total_leads) * 100) : 0}% do total
                    </p>
                  </div>
                  
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                    <Star className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-emerald-700">{stats.avg_quality_score?.toFixed(1) || '0.0'}</p>
                    <p className="text-sm text-emerald-600 font-medium">Score de Qualidade</p>
                    <p className="text-xs text-emerald-500 mt-1">Média das campanhas</p>
                  </div>
                  
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-purple-700">
                      {stats.total_spend > 0 ? formatCurrency(stats.total_spend / stats.total_leads) : 'R$ 0'}
                    </p>
                    <p className="text-sm text-purple-600 font-medium">Custo por Lead</p>
                    <p className="text-xs text-purple-500 mt-1">Média geral</p>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Gráfico de Performance</h3>
                  <p className="text-gray-500">Visualização de dados ao longo do tempo em desenvolvimento</p>
                </div>
              </div>
            )}

            {activeTab === "campaigns" && (
              <div className="overflow-x-auto">
                {campaigns.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma atividade encontrada</h3>
                    <p className="text-gray-500">As campanhas aparecerão aqui quando houver dados disponíveis.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Data</TableHead>
                        <TableHead className="font-semibold text-gray-700">Plataforma</TableHead>
                        <TableHead className="font-semibold text-gray-700">Campanha</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">Leads</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Investimento</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">CTR</TableHead>
                        <TableHead className="text-center font-semibold text-gray-700">Qualidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign, index) => (
                        <TableRow key={`${campaign.id}-${campaign.date}`} className="hover:bg-gray-50/50 transition-colors duration-200">
                          <TableCell className="font-mono text-sm text-gray-600">
                            {new Date(campaign.date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short',
                              year: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`font-medium ${
                                campaign.platform === 'Meta' 
                                  ? 'border-blue-300 text-blue-700 bg-blue-50' 
                                  : campaign.platform === 'Google'
                                  ? 'border-green-300 text-green-700 bg-green-50'
                                  : 'border-gray-300 text-gray-700 bg-gray-50'
                              }`}
                            >
                              {campaign.platform}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="truncate font-medium text-gray-900">
                              {campaign.campaign_name || 'Campanha sem nome'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                              {campaign.leads_count || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {campaign.spend ? (
                              <span className="text-gray-900">{formatCurrency(campaign.spend)}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {campaign.ctr ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {campaign.ctr.toFixed(2)}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {campaign.quality_score ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  campaign.quality_score >= 8 ? 'bg-emerald-400' :
                                  campaign.quality_score >= 6 ? 'bg-amber-400' : 'bg-red-400'
                                }`}></div>
                                <span className="text-sm font-medium">{campaign.quality_score.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-indigo-50 border-indigo-200 transition-all duration-300"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="w-5 h-5 text-indigo-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Editar Informações</p>
                  <p className="text-xs text-gray-600">Atualizar dados do cliente</p>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-purple-50 border-purple-200 transition-all duration-300"
                onClick={() => navigate(`/relatorio-n8n?client=${id}`)}
              >
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Ver Relatórios</p>
                  <p className="text-xs text-gray-600">Configurar automação</p>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-emerald-50 border-emerald-200 transition-all duration-300"
                onClick={() => navigate(`/analytics?client=${id}`)}
              >
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-600">Análise detalhada</p>
                </div>
              </Button>
            </div>
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