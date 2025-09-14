import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, DollarSign, Target, TrendingUp, Play, Pause, MoreHorizontal, 
  Settings, Users, BarChart3, Calendar, Globe, Shield, ExternalLink,
  Edit, Archive, RefreshCw, Zap, LineChart
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  pixel_meta: string | null;
  ga4_stream_id: string | null;
  gtm_id: string | null;
  typebot_ativo: boolean | null;
  typebot_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  totalCampaigns: number;
  totalLeads: number;
  totalSpend: number;
  avgQualityScore: number;
  qualificationRate: number;
  conversionRate: number;
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
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          const totalConverted = campaignsData.reduce((sum, c) => sum + (c.converted_leads || 0), 0);
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
            conversionRate: totalQualified > 0 ? (totalConverted / totalQualified) * 100 : 0,
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

    loadClientData();
  }, [id, navigate, toast]);

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
        className={`
          ${channel === 'Meta' 
            ? 'border-blue-500 text-blue-600 bg-blue-50' 
            : channel === 'Google'
            ? 'border-red-500 text-red-600 bg-red-50'
            : 'border-gray-500 text-gray-600 bg-gray-50'
          }
        `}
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
        {/* Header */}
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
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
            <Button variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar Cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Saldo Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((client.saldo_meta || 0) / 100)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo atual da conta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaignStats.totalLeads}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads capturados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Taxa Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaignStats.qualificationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads qualificados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                Gasto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(campaignStats.totalSpend)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Investimento total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com informações detalhadas */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>

          {/* Aba Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
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

              {/* Performance das Campanhas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Performance Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        {campaignStats.totalCampaigns}
                      </div>
                      <div className="text-xs text-blue-600">Campanhas</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {campaignStats.avgQualityScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-green-600">Nota Média</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Qualificação</span>
                      <span className="font-medium">{campaignStats.qualificationRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(campaignStats.qualificationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Conversão</span>
                      <span className="font-medium">{campaignStats.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(campaignStats.conversionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Campanhas */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-muted-foreground">
                      As campanhas deste cliente aparecerão aqui quando houver dados disponíveis.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead>Gasto</TableHead>
                        <TableHead>Qualificação</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.slice(0, 10).map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="font-medium">{campaign.campaign_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              campaign.platform === 'Meta' 
                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-red-500 text-red-600 bg-red-50'
                            }>
                              {campaign.platform}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(campaign.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{campaign.leads_count}</TableCell>
                          <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                          <TableCell>
                            {campaign.qualified_leads || 0}/{campaign.leads_count}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              campaign.kanban_status === 'Concluído' 
                                ? 'border-green-500 text-green-600 bg-green-50'
                                : 'border-yellow-500 text-yellow-600 bg-yellow-50'
                            }>
                              {campaign.kanban_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações de Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Meta Ads</p>
                      <p className="text-sm text-muted-foreground">Campanhas do Facebook e Instagram</p>
                    </div>
                    <Badge variant={client.usa_meta_ads ? "default" : "secondary"}>
                      {client.usa_meta_ads ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Google Ads</p>
                      <p className="text-sm text-muted-foreground">Campanhas do Google</p>
                    </div>
                    <Badge variant={client.usa_google_ads ? "default" : "secondary"}>
                      {client.usa_google_ads ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {client.budget_mensal_meta && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">Budget Mensal Meta</p>
                      <p className="font-medium">{formatCurrency(client.budget_mensal_meta)}</p>
                    </div>
                  )}

                  {client.budget_mensal_google && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">Budget Mensal Google</p>
                      <p className="font-medium">{formatCurrency(client.budget_mensal_google)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rastreamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Rastreamento Ativo</p>
                      <p className="text-sm text-muted-foreground">Status geral do tracking</p>
                    </div>
                    <Badge variant={client.traqueamento_ativo ? "default" : "secondary"}>
                      {client.traqueamento_ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {client.pixel_meta && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">Pixel Meta</p>
                      <p className="font-mono text-xs">{client.pixel_meta}</p>
                    </div>
                  )}

                  {client.ga4_stream_id && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">GA4 Stream ID</p>
                      <p className="font-mono text-xs">{client.ga4_stream_id}</p>
                    </div>
                  )}

                  {client.gtm_id && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">GTM ID</p>
                      <p className="font-mono text-xs">{client.gtm_id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Integrações */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Typebot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">Chatbot automatizado</p>
                    </div>
                    <Badge variant={client.typebot_ativo ? "default" : "secondary"}>
                      {client.typebot_ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {client.typebot_url && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm text-muted-foreground">URL do Typebot</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-xs truncate">{client.typebot_url}</p>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={client.typebot_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Outros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Outras integrações disponíveis em breve</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}