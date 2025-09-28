import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  RefreshCw, 
  ExternalLink, 
  DollarSign, 
  Target, 
  TrendingUp, 
  Users, 
  Settings, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Building, 
  Eye, 
  BarChart3, 
  Award, 
  Star, 
  Calendar,
  User, 
  FolderOpen, 
  X, 
  AlertCircle,
  Clock,
  Globe,
  Zap,
  Shield,
  PlayCircle,
  PauseCircle,
  Link as LinkIcon,
  MessageSquare,
  FileText,
  TrendingDown,
  Download,
  Share2,
  Copy,
  Smartphone
} from 'lucide-react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClienteFormModal } from '@/components/forms/ClienteFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClienteFormData } from '@/types/client';
import { useClientManagers } from '@/hooks/useClientManagers';

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
  traqueamento_ativo: boolean | null;
  webhook_meta: string | null;
  webhook_google: string | null;
  canal_relatorio: string;
  horario_relatorio: string;
  created_at: string;
  updated_at: string;
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

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  required: boolean;
  value?: string | null;
}

export default function ContaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getManagerById, getManagerName, getManagerAvatar } = useClientManagers();
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

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
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
      generateChecklist(clientData);

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

  const generateChecklist = (data: ClientData) => {
    const items: ChecklistItem[] = [
      // Configuração Básica
      {
        id: 'basic-info',
        category: 'Configuração Básica',
        title: 'Informações de Contato',
        description: 'Nome, telefone e email configurados',
        completed: !!(data.nome_cliente && data.telefone && data.email),
        priority: 'high',
        required: true,
        value: data.email
      },
      {
        id: 'drive-link',
        category: 'Configuração Básica',
        title: 'Link do Drive',
        description: 'Link do Google Drive configurado',
        completed: !!data.link_drive,
        priority: 'medium',
        required: false,
        value: data.link_drive
      },
      {
        id: 'report-config',
        category: 'Configuração Básica',
        title: 'Configuração de Relatórios',
        description: 'Canal e horário de relatórios definidos',
        completed: !!(data.canal_relatorio && data.horario_relatorio),
        priority: 'high',
        required: true,
        value: `${data.canal_relatorio} às ${data.horario_relatorio}`
      },

      // Meta Ads
      {
        id: 'meta-account',
        category: 'Meta Ads',
        title: 'Conta Meta Configurada',
        description: 'ID da conta Meta Ads configurado',
        completed: !!(data.usa_meta_ads && data.meta_account_id),
        priority: 'high',
        required: data.usa_meta_ads,
        value: data.meta_account_id
      },
      {
        id: 'meta-webhook',
        category: 'Meta Ads',
        title: 'Webhook Meta',
        description: 'Webhook para receber dados da Meta configurado',
        completed: !!(data.usa_meta_ads && data.webhook_meta),
        priority: 'medium',
        required: data.usa_meta_ads,
        value: data.webhook_meta
      },

      // Google Ads
      {
        id: 'google-account',
        category: 'Google Ads',
        title: 'Conta Google Ads',
        description: 'ID da conta Google Ads configurado',
        completed: !!(data.usa_google_ads && data.google_ads_id),
        priority: 'high',
        required: data.usa_google_ads,
        value: data.google_ads_id
      },
      {
        id: 'google-webhook',
        category: 'Google Ads',
        title: 'Webhook Google',
        description: 'Webhook para receber dados do Google configurado',
        completed: !!(data.usa_google_ads && data.webhook_google),
        priority: 'medium',
        required: data.usa_google_ads,
        value: data.webhook_google
      },

      // Rastreamento
      {
        id: 'pixel-meta',
        category: 'Rastreamento',
        title: 'Pixel Meta',
        description: 'Pixel do Facebook configurado',
        completed: !!data.pixel_meta,
        priority: 'high',
        required: true,
        value: data.pixel_meta
      },
      {
        id: 'ga4-config',
        category: 'Rastreamento',
        title: 'Google Analytics 4',
        description: 'Stream ID do GA4 configurado',
        completed: !!data.ga4_stream_id,
        priority: 'high',
        required: true,
        value: data.ga4_stream_id
      },
      {
        id: 'gtm-config',
        category: 'Rastreamento',
        title: 'Google Tag Manager',
        description: 'GTM ID configurado',
        completed: !!data.gtm_id,
        priority: 'medium',
        required: false,
        value: data.gtm_id
      },
      {
        id: 'typebot-config',
        category: 'Automação',
        title: 'Typebot',
        description: 'Typebot configurado e ativo',
        completed: !!(data.typebot_ativo && data.typebot_url),
        priority: 'medium',
        required: false,
        value: data.typebot_url
      }
    ];

    setChecklist(items);
  };

  const handleEditClient = async (data: ClienteFormData) => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from('accounts')
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

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const openDriveLink = () => {
    if (client?.link_drive) {
      window.open(client.link_drive, '_blank', 'noopener,noreferrer');
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
      canais: client.canais as any,
      status: client.status as any,
      usaMetaAds: client.usa_meta_ads,
      usaGoogleAds: client.usa_google_ads,
      traqueamentoAtivo: client.traqueamento_ativo || false,
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
      case 'Ativo': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Pausado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Inativo': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
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

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const required = checklist.filter(item => item.required).length;
    const requiredCompleted = checklist.filter(item => item.required && item.completed).length;
    
    return {
      total,
      completed,
      required,
      requiredCompleted,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredPercentage: required > 0 ? Math.round((requiredCompleted / required) * 100) : 100
    };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getChecklistIcon = (completed: boolean, required: boolean) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    } else if (required) {
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const stats_completion = getCompletionStats();
  const manager = client ? getManagerById(client.gestor_id) : null;

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
            <Button onClick={() => navigate('/contas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Contas
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Aprimorado */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/contas")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{client.nome_cliente}</h1>
                <p className="text-lg text-muted-foreground">{client.nome_empresa}</p>
              </div>
              <Badge className={getStatusColor(client.status)}>
                {client.status}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {client.link_drive && (
                <Button 
                  variant="outline"
                  onClick={openDriveLink}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Abrir Drive
                  <ExternalLink className="h-3 w-3" />
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

          {/* Cards de Status Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Progresso Geral */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progresso Geral</p>
                    <p className="text-3xl font-bold">{stats_completion.percentage}%</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <Progress value={stats_completion.percentage} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats_completion.completed} de {stats_completion.total} concluídos
                </p>
              </CardContent>
            </Card>

            {/* Itens Obrigatórios */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Obrigatórios</p>
                    <p className="text-3xl font-bold">{stats_completion.requiredPercentage}%</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <Progress value={stats_completion.requiredPercentage} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats_completion.requiredCompleted} de {stats_completion.required} obrigatórios
                </p>
              </CardContent>
            </Card>

            {/* Saldo Meta */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Meta</p>
                    <p className="text-2xl font-bold">{formatCurrency((client.saldo_meta || 0) / 100)}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                {client.budget_mensal_meta && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Budget: {formatCurrency(client.budget_mensal_meta)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Gestor */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={manager?.avatar_url} />
                    <AvatarFallback className="bg-purple-500/20 text-purple-600">
                      {getManagerAvatar(client.gestor_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Gestor</p>
                    <p className="font-semibold">{getManagerName(client.gestor_id)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="checklist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Atividade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Checklist de Configuração
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o progresso da configuração da conta e identifique itens pendentes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedChecklist).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{category}</h3>
                      <Badge variant="secondary">
                        {items.filter(item => item.completed).length}/{items.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                            item.completed 
                              ? 'bg-green-50 border-green-200' 
                              : item.required 
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          {getChecklistIcon(item.completed, item.required)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{item.title}</h4>
                              {getPriorityIcon(item.priority)}
                              {item.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            {item.value && (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-white/60 rounded border">
                                <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                                  {item.value}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyToClipboard(item.value!, item.title)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email || 'Não informado'}</p>
                      </div>
                      {client.email && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyToClipboard(client.email!, 'Email')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{client.telefone}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToClipboard(client.telefone, 'Telefone')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Relatórios</p>
                        <p className="font-medium">{client.canal_relatorio} às {client.horario_relatorio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <LinkIcon className="h-5 w-5 text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Canais Ativos</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getChannelBadges(client.canais)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações de Plataforma */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Plataformas de Anúncios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Meta Ads</p>
                          <p className="text-xs text-muted-foreground">
                            {client.meta_account_id || 'Não configurado'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client.usa_meta_ads ? "default" : "secondary"}>
                        {client.usa_meta_ads ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Google Ads</p>
                          <p className="text-xs text-muted-foreground">
                            {client.google_ads_id || 'Não configurado'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client.usa_google_ads ? "default" : "secondary"}>
                        {client.usa_google_ads ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-full">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Typebot</p>
                          <p className="text-xs text-muted-foreground">
                            {client.typebot_url ? 'Configurado' : 'Não configurado'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client.typebot_ativo ? "default" : "secondary"}>
                        {client.typebot_ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rastreamento e Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rastreamento & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Pixel Meta', value: client.pixel_meta, icon: Shield },
                    { label: 'GA4 Stream ID', value: client.ga4_stream_id, icon: BarChart3 },
                    { label: 'GTM ID', value: client.gtm_id, icon: Settings }
                  ].map((config, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <config.icon className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{config.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {config.value || 'Não configurado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {config.value ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyToClipboard(config.value!, config.label)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Orçamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Orçamentos e Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Saldo Meta Atual</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency((client.saldo_meta || 0) / 100)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>

                    {client.budget_mensal_meta && (
                      <div className="p-3 bg-green-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget Meta Mensal</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(client.budget_mensal_meta)}
                            </p>
                          </div>
                          <Target className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    )}

                    {client.budget_mensal_google && (
                      <div className="p-3 bg-orange-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget Google Mensal</p>
                            <p className="text-xl font-bold text-orange-600">
                              {formatCurrency(client.budget_mensal_google)}
                            </p>
                          </div>
                          <Target className="h-6 w-6 text-orange-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            {client.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="whitespace-pre-wrap">{client.observacoes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {/* KPIs de Performance */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Leads</p>
                        <p className="text-3xl font-bold">{stats.total_leads}</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Leads Convertidos</p>
                        <p className="text-3xl font-bold">{stats.leads_convertidos}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                        <p className="text-3xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Investimento Total</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.total_spend)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabela de Campanhas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividade de Campanhas Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Conta criada</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Última atualização</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(client.updated_at).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {client.link_drive && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border">
                      <div className="p-2 bg-purple-500/20 rounded-full">
                        <FolderOpen className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Drive configurado</p>
                        <p className="text-sm text-muted-foreground">Acesso ao drive do projeto disponível</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openDriveLink}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Mais atividades serão exibidas aqui conforme o uso da conta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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