// src/pages/ContaDetalhes.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  FolderOpen,
  Calendar,
  Facebook,
} from 'lucide-react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useClientManagers } from '@/hooks/useClientManagers';
import { MetaMetricsGrid } from '@/components/meta/MetaMetricsGrid';
import { MetaCampaignTable } from '@/components/meta/MetaCampaignTable';
import { MetaPeriodFilter, MetaPeriod } from '@/components/meta/MetaPeriodFilter';
import { MetaSyncButton } from '@/components/meta/MetaSyncButton';
import { metaAdsService } from '@/services/metaAdsService';
import type { MetaAdsResponse } from '@/types/meta';

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
  hook_rate: number | null;
  hold_rate: number | null;
  impressions: number | null;
  clicks: number | null;
  reach: number | null;
  frequency: number | null;
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
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [metaData, setMetaData] = useState<MetaAdsResponse | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaPeriod, setMetaPeriod] = useState<MetaPeriod>('last_7d');

  useEffect(() => {
    if (id) {
      loadClientData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMetaData = async (forceRefresh = false) => {
    if (!client?.meta_account_id) {
      setMetaError('ID da conta Meta não configurado');
      return;
    }

    if (forceRefresh) {
      metaAdsService.clearCache(`${client.meta_account_id}_${metaPeriod}`);
    }

    setMetaLoading(true);
    setMetaError(null);

    try {
      const data = await metaAdsService.fetchMetaCampaigns(client.meta_account_id, metaPeriod);
      setMetaData(data);
    } catch (error: any) {
      console.error('Error loading Meta data:', error);
      setMetaError(error.message || 'Erro ao carregar dados do Meta');
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    if (client?.meta_account_id && metaData) {
      loadMetaData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaPeriod]);

  const handleSyncComplete = () => {
    loadClientData();
    if (client?.meta_account_id) {
      loadMetaData(true);
    }
  };

  const loadClientData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
      generateChecklist(clientData);

      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_leads_daily')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false })
        .limit(30);

      if (campaignsError) console.warn('Campaigns data not found:', campaignsError);
      setCampaigns(campaignsData || []);

      const { data: statsData } = await supabase
        .from('campaign_performance_stats')
        .select('*')
        .eq('client_id', id)
        .single();

      let finalStats: ClientStats | null = null;
      if (statsData) {
        finalStats = {
          total_leads: statsData.total_leads || 0,
          leads_convertidos: statsData.total_converted || 0,
          leads_qualificados: statsData.total_qualified || 0,
          total_spend: statsData.total_spend || 0,
          avg_quality_score: statsData.avg_quality_score || 0,
          conversion_rate: statsData.conversion_rate || 0,
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
            conversion_rate:
              leadsStatsData.leads_convertidos && leadsStatsData.leads_qualificados
                ? (leadsStatsData.leads_convertidos / leadsStatsData.leads_qualificados) * 100
                : 0,
          };
        }
      }

      setStats(finalStats);

      if (clientData.usa_meta_ads && clientData.meta_account_id) {
        loadMetaData();
      }

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
      {
        id: 'basic-info',
        category: 'Configuração Básica',
        title: 'Informações de Contato',
        description: 'Nome, telefone e email configurados',
        completed: !!(data.nome_cliente && data.telefone && data.email),
        priority: 'high',
        required: true,
        value: data.email,
      },
      {
        id: 'drive-link',
        category: 'Configuração Básica',
        title: 'Link do Drive',
        description: 'Link do Google Drive configurado',
        completed: !!data.link_drive,
        priority: 'medium',
        required: false,
        value: data.link_drive,
      },
      {
        id: 'report-config',
        category: 'Configuração Básica',
        title: 'Configuração de Relatórios',
        description: 'Canal e horário de relatórios definidos',
        completed: !!(data.canal_relatorio && data.horario_relatorio),
        priority: 'high',
        required: true,
        value: `${data.canal_relatorio} às ${data.horario_relatorio}`,
      },
      {
        id: 'meta-account',
        category: 'Meta Ads',
        title: 'Conta Meta Configurada',
        description: 'ID da conta Meta Ads configurado',
        completed: !!data.meta_account_id,
        priority: 'high',
        required: data.usa_meta_ads,
        value: data.meta_account_id,
      },
      {
        id: 'meta-webhook',
        category: 'Meta Ads',
        title: 'Webhook Meta',
        description: 'Webhook para receber dados da Meta configurado',
        completed: !!data.webhook_meta,
        priority: 'medium',
        required: data.usa_meta_ads,
        value: data.webhook_meta,
      },
      {
        id: 'google-account',
        category: 'Google Ads',
        title: 'Conta Google Ads',
        description: 'ID da conta Google Ads configurado',
        completed: !!data.google_ads_id,
        priority: 'high',
        required: data.usa_google_ads,
        value: data.google_ads_id,
      },
      {
        id: 'google-webhook',
        category: 'Google Ads',
        title: 'Webhook Google',
        description: 'Webhook para receber dados do Google configurado',
        completed: !!data.webhook_google,
        priority: 'medium',
        required: data.usa_google_ads,
        value: data.webhook_google,
      },
      {
        id: 'pixel-meta',
        category: 'Rastreamento',
        title: 'Pixel Meta',
        description: 'ID do Pixel Meta configurado',
        completed: !!data.pixel_meta,
        priority: 'high',
        required: data.usa_meta_ads,
        value: data.pixel_meta,
      },
      {
        id: 'ga4',
        category: 'Rastreamento',
        title: 'Google Analytics 4',
        description: 'Stream ID do GA4 configurado',
        completed: !!data.ga4_stream_id,
        priority: 'medium',
        required: false,
        value: data.ga4_stream_id,
      },
      {
        id: 'gtm',
        category: 'Rastreamento',
        title: 'Google Tag Manager',
        description: 'ID do GTM configurado',
        completed: !!data.gtm_id,
        priority: 'medium',
        required: false,
        value: data.gtm_id,
      },
      {
        id: 'typebot',
        category: 'Automação',
        title: 'Typebot',
        description: 'Typebot ativo e URL configurada',
        completed: !!(data.typebot_ativo && data.typebot_url),
        priority: 'low',
        required: false,
        value: data.typebot_url,
      },
    ];

    setChecklist(items);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pausado':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'arquivado':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getChecklistProgress = () => {
    const required = checklist.filter(item => item.required);
    const completed = required.filter(item => item.completed);
    return required.length > 0 ? (completed.length / required.length) * 100 : 0;
  };

  if (loading || !client) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const manager = getManagerById(client.gestor_id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/contas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{client.nome_cliente}</h1>
              <p className="text-sm text-muted-foreground">{client.nome_empresa}</p>
            </div>
            <Badge className={getStatusColor(client.status)}>
              {client.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {client.usa_meta_ads && client.meta_account_id && (
              <MetaSyncButton 
                accountId={client.id}
                onSyncComplete={handleSyncComplete}
                showLastSync={true}
              />
            )}
            
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{stats?.total_leads || 0}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Convertidos</p>
                  <p className="text-2xl font-bold">{stats?.leads_convertidos || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gasto Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.total_spend || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">{(stats?.conversion_rate || 0).toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            {client.usa_meta_ads && <TabsTrigger value="meta">Meta Ads</TabsTrigger>}
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.telefone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}
                  {client.link_drive && (
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={client.link_drive} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Abrir Drive
                      </a>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Canais Ativos</p>
                    <div className="flex flex-wrap gap-2">
                      {client.canais.map(canal => (
                        <Badge key={canal} variant="outline">{canal}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gestor Responsável</CardTitle>
                </CardHeader>
                <CardContent>
                  {manager ? (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getManagerAvatar(client.gestor_id)} />
                        <AvatarFallback>
                          {getManagerName(client.gestor_id).split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getManagerName(client.gestor_id)}</p>
                        <p className="text-sm text-muted-foreground">Gestor de Conta</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Gestor não encontrado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-sm text-muted-foreground">
                      As campanhas aparecerão aqui quando houver dados sincronizados.
                    </p>
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
                          <TableHead className="text-center">Hook Rate</TableHead>
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
                                    ? 'border-blue-500/40 text-blue-400'
                                    : campaign.platform === 'Google'
                                    ? 'border-amber-500/40 text-amber-400'
                                    : 'border-border/40 text-foreground/80'
                                }
                              >
                                {campaign.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate">
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
                              {campaign.hook_rate ? (
                                <span className="font-medium text-primary">
                                  {campaign.hook_rate.toFixed(1)}%
                                </span>
                              ) : '—'}
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

          {client.usa_meta_ads && (
            <TabsContent value="meta" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Dados da API Meta</h2>
                  <p className="text-sm text-muted-foreground">
                    Dados em tempo real do Meta Ads Manager
                  </p>
                </div>
                <MetaPeriodFilter value={metaPeriod} onValueChange={setMetaPeriod} />
              </div>

              {metaLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Carregando dados do Meta...</p>
                </div>
              ) : metaError ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Erro ao carregar dados</h3>
                      <p className="text-sm text-muted-foreground mb-4">{metaError}</p>
                      <Button onClick={() => loadMetaData(true)}>
                        Tentar Novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : metaData ? (
                <>
                  <MetaMetricsGrid 
                    account={metaData.account}
                    campaigns={metaData.campaigns}
                  />
                  <MetaCampaignTable campaigns={metaData.campaigns} />
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Facebook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum dado disponível</h3>
                      <p className="text-sm text-muted-foreground">
                        Clique em "Atualizar Meta" para buscar os dados
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Checklist de Configuração</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(getChecklistProgress())}% completo
                  </div>
                </div>
                <Progress value={getChecklistProgress()} className="mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(
                    checklist.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, ChecklistItem[]>)
                  ).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-semibold mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                          >
                            {item.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <AlertTriangle 
                                className={`h-5 w-5 mt-0.5 ${
                                  item.priority === 'high' 
                                    ? 'text-red-500' 
                                    : item.priority === 'medium'
                                    ? 'text-yellow-500'
                                    : 'text-gray-500'
                                }`} 
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.title}</p>
                                {item.required && (
                                  <Badge variant="outline" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                              {item.value && (
                                <p className="text-xs text-muted-foreground mt-2 font-mono">
                                  {item.value}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showEditModal && (
          <ClienteFormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              loadClientData();
            }}
            initialData={client as any}
          />
        )}
      </div>
    </AppLayout>
  );
}