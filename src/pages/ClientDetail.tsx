import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, DollarSign, Target, TrendingUp, Edit, Archive, RefreshCw,
  Users, BarChart3, Calendar, Settings, Shield
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

        {/* KPIs Simples */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Informações do Cliente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="surface-elevated">
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

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Meta Ads</p>
                  <p className="text-sm text-muted-foreground">Facebook e Instagram</p>
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

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Rastreamento</p>
                  <p className="text-sm text-muted-foreground">Pixel e Analytics</p>
                </div>
                <Badge variant={client.traqueamento_ativo ? "default" : "secondary"}>
                  {client.traqueamento_ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes seções */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
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