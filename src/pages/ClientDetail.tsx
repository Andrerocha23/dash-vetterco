import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  DollarSign, 
  Target, 
  TrendingUp, 
  Edit, 
  Archive, 
  RefreshCw,
  Users, 
  BarChart3, 
  Calendar, 
  Settings, 
  Shield,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Facebook,
  Search,
  Zap,
  Globe
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interfaces dos dados reais
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

      // Buscar campanhas do cliente (dados reais quando disponível)
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaign_leads_daily')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (campaignsError && campaignsError.code !== 'PGRST116') {
        console.warn('Tabela campaign_leads_daily não encontrada:', campaignsError);
      } else if (campaignsData) {
        setCampaigns(campaignsData);

        // Calcular estatísticas das campanhas reais
        if (campaignsData.length > 0) {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
            ? 'border-red-500 text-red-600 bg-red-50'
            : 'border-purple-500 text-purple-600 bg-purple-50'
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
        {/* Header Melhorado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/clients")}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">{client.nome_cliente}</h1>
                  <Badge className={`${getStatusColor(client.status)} border font-medium px-3 py-1`}>
                    {client.status}
                  </Badge>
                </div>
                <p className="text-xl text-muted-foreground mb-2">{client.nome_empresa}</p>
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.telefone}
                  </span>
                  {client.email && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Cliente desde {formatDate(client.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => loadClientData()} disabled={isLoading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => navigate(`/clients/${id}/edit`)} className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards Melhorados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700/70 mb-1">Saldo Meta</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {client.saldo_meta ? formatCurrency(client.saldo_meta / 100) : 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600/60 mt-1">
                    {client.budget_mensal_meta ? `Budget: ${formatCurrency(client.budget_mensal_meta)}` : 'Budget não definido'}
                  </p>
                </div>
                <div className="p-4 bg-blue-500/20 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700/70 mb-1">Campanhas</p>
                  <p className="text-2xl font-bold text-green-900">{campaignStats.totalCampaigns}</p>
                  <p className="text-xs text-green-600/60 mt-1">
                    {campaignStats.totalCampaigns > 0 ? 'Com dados reais' : 'Aguardando dados'}
                  </p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-2xl">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700/70 mb-1">Total Leads</p>
                  <p className="text-2xl font-bold text-purple-900">{campaignStats.totalLeads}</p>
                  <p className="text-xs text-purple-600/60 mt-1">
                    {campaignStats.totalSpend > 0 ? `Gasto: ${formatCurrency(campaignStats.totalSpend)}` : 'Sem gastos registrados'}
                  </p>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700/70 mb-1">Gestor</p>
                  <p className="text-lg font-bold text-orange-900">{manager.name}</p>
                  <p className="text-xs text-orange-600/60 mt-1">Responsável</p>
                </div>
                <div className="p-4 bg-orange-500/20 rounded-2xl">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Melhoradas */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Contas & IDs
            </TabsTrigger>
            <TabsTrigger value="tracking" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Rastreamento
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Cliente */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Nome</span>
                      <span className="font-semibold">{client.nome_cliente}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Empresa</span>
                      <span className="font-semibold">{client.nome_empresa}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Telefone</span>
                      <span className="font-semibold">{client.telefone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                      <span className="font-semibold">{client.email || 'Não informado'}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Canais</p>
                    <div className="flex flex-wrap gap-2">
                      {getChannelBadges(client.canais)}
                    </div>
                  </div>

                  {client.observacoes && (
                    <div className="pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                      <p className="text-sm p-3 bg-muted rounded-lg">{client.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance do Cliente */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Performance & Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaignStats.totalCampaigns > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Total de Campanhas</span>
                        <Badge variant="outline">{campaignStats.totalCampaigns}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Total de Leads</span>
                        <span className="font-bold text-green-600">{campaignStats.totalLeads}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Gasto Total</span>
                        <span className="font-bold">{formatCurrency(campaignStats.totalSpend)}</span>
                      </div>
                      {campaignStats.avgQualityScore > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-muted-foreground">Qualidade Média</span>
                          <Badge variant="secondary">{campaignStats.avgQualityScore.toFixed(1)}/10</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Dados de campanhas não disponíveis
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure as integrações para ver estatísticas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meta Ads */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    Meta Ads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={client.usa_meta_ads ? 'default' : 'secondary'}>
                      {client.usa_meta_ads ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account ID</p>
                      <div className="font-mono text-sm bg-muted p-3 rounded-lg">
                        {client.meta_account_id || 'Não configurado'}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pixel ID</p>
                      <div className="font-mono text-sm bg-muted p-3 rounded-lg">
                        {client.pixel_meta || 'Não configurado'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google Ads */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-red-600" />
                    Google Ads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={client.usa_google_ads ? 'default' : 'secondary'}>
                      {client.usa_google_ads ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer ID</p>
                      <div className="font-mono text-sm bg-muted p-3 rounded-lg">
                        {client.google_ads_id || 'Não configurado'}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GA4 Stream ID</p>
                      <div className="font-mono text-sm bg-muted p-3 rounded-lg">
                        {client.ga4_stream_id || 'Não configurado'}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GTM Container ID</p>
                      <div className="font-mono text-sm bg-muted p-3 rounded-lg">
                        {client.gtm_id || 'Não configurado'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Rastreamento */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Status do Rastreamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {client.typebot_ativo ? (
                        <Zap className="h-6 w-6 text-green-600" />
                      ) : (
                        <Zap className="h-6 w-6 text-gray-400" />
                      )}
                      <div>
                        <p className="font-semibold">Typebot</p>
                        <p className="text-sm text-muted-foreground">
                          {client.typebot_ativo ? 'Configurado e ativo' : 'Não configurado'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.typebot_ativo ? 'default' : 'secondary'}>
                      {client.typebot_ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {client.typebot_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">URL do Typebot</p>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm bg-muted p-3 rounded-lg flex-1 truncate">
                          {client.typebot_url}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.open(client.typebot_url!, '_blank')}
                          className="rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orçamento */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Configurações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Budget Mensal Meta</span>
                      <span className="font-bold">
                        {client.budget_mensal_meta ? formatCurrency(client.budget_mensal_meta) : 'Não definido'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Budget Mensal Google</span>
                      <span className="font-bold">
                        {client.budget_mensal_google ? formatCurrency(client.budget_mensal_google) : 'Não definido'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm font-medium text-muted-foreground">Saldo Atual Meta</span>
                      <span className="font-bold text-green-600">
                        {client.saldo_meta ? formatCurrency(client.saldo_meta / 100) : 'N/A'}
                      </span>
                    </div>

                    {campaigns.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-3 text-blue-900">Campanhas Ativas</h4>
                        <div className="space-y-2">
                          {campaigns.slice(0, 3).map((campaign, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-blue-700">Campanha {index + 1}</span>
                              <span className="font-medium text-blue-900">
                                {campaign.leads_count || 0} leads • {formatCurrency(campaign.spend || 0)}
                              </span>
                            </div>
                          ))}
                          {campaigns.length > 3 && (
                            <p className="text-xs text-blue-600 text-center pt-2">
                              +{campaigns.length - 3} campanhas adicionais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gestor e Configurações */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Gestão & Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Gestor */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Gestor Responsável</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {manager.avatar}
                        </div>
                        <div>
                          <p className="font-semibold">{manager.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {client.gestor_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Datas importantes */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Cliente desde</span>
                        <span className="font-medium">{formatDate(client.created_at)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Última atualização</span>
                        <span className="font-medium">{formatDate(client.updated_at)}</span>
                      </div>
                    </div>

                    {/* Status das plataformas */}
                    <div className="mt-6">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Plataformas Ativas</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Meta Ads</span>
                          </div>
                          <Badge variant={client.usa_meta_ads ? 'default' : 'secondary'}>
                            {client.usa_meta_ads ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">Google Ads</span>
                          </div>
                          <Badge variant={client.usa_google_ads ? 'default' : 'secondary'}>
                            {client.usa_google_ads ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}-center gap-3">
                      {client.traqueamento_ativo ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-semibold">Rastreamento Principal</p>
                        <p className="text-sm text-muted-foreground">
                          {client.traqueamento_ativo ? 'Ativo e funcionando' : 'Inativo ou com problemas'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.traqueamento_ativo ? 'default' : 'destructive'}>
                      {client.traqueamento_ativo ? 'OK' : 'Pendente'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-sm font-medium">Meta Pixel</span>
                      {client.pixel_meta ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-sm font-medium">Google Analytics 4</span>
                      {client.ga4_stream_id ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium">Google Tag Manager</span>
                      {client.gtm_id ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typebot */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Automação & Typebot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items