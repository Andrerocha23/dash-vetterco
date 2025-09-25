import React, { useState, useEffect } from "react";
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
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Facebook,
  Search,
  TrendingDown
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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

// Interface para dados reais do cliente
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
  meta_account_id: string | null;
  google_ads_id: string | null;
  alerta_saldo_baixo: number | null;
  canal_relatorio: string | null;
  horario_relatorio: string | null;
  created_at: string;
  updated_at: string;
}

// Interface para stats reais de leads
interface LeadsStats {
  total_leads: number;
  leads_convertidos: number;
  valor_total_conversoes: number;
  media_leads_dia: number;
  ultima_atualizacao: string;
}

// Interface para contas do cliente
interface ClientAccount {
  id: string;
  tipo: string;
  account_id: string;
  status: string;
  observacoes: string | null;
}

// Mock data dos gestores (até implementar tabela managers)
const gestores = {
  'gest1': { id: 'gest1', name: 'Carlos Silva', avatar: '👨‍💼', email: 'carlos@company.com' },
  'gest2': { id: 'gest2', name: 'Ana Costa', avatar: '👩‍💼', email: 'ana@company.com' },
  'gest3': { id: 'gest3', name: 'João Santos', avatar: '🧑‍💼', email: 'joao@company.com' },
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

      // Buscar estatísticas de leads (se existir)
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('leads_stats')
          .select('*')
          .eq('client_id', id)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          console.warn('Erro ao buscar stats de leads:', statsError);
        } else if (statsData) {
          setLeadsStats(statsData);
        }
      } catch (error) {
        console.warn('Tabela leads_stats não encontrada ou erro:', error);
      }

      // Buscar contas do cliente (se existir)
      try {
        const { data: accountsData, error: accountsError } = await supabase
          .from('client_accounts')
          .select('*')
          .eq('client_id', id);

        if (accountsError && accountsError.code !== 'PGRST116') {
          console.warn('Erro ao buscar contas:', accountsError);
        } else if (accountsData) {
          setClientAccounts(accountsData);
        }
      } catch (error) {
        console.warn('Tabela client_accounts não encontrada ou erro:', error);
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

  // Funções auxiliares
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Ativo': 'bg-green-100 text-green-800 border-green-200',
      'Pausado': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Arquivado': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'} border`}>
        {status}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const variants = {
      'Meta': 'bg-blue-100 text-blue-800 border-blue-200',
      'Google': 'bg-red-100 text-red-800 border-red-200',
      'TikTok': 'bg-black text-white border-black',
      'LinkedIn': 'bg-blue-600 text-white border-blue-600',
    };
    
    return (
      <Badge key={channel} className={`${variants[channel as keyof typeof variants] || 'bg-purple-100 text-purple-800'} border`}>
        {channel}
      </Badge>
    );
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/clients")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{client.nome_cliente}</h1>
                  {getStatusBadge(client.status)}
                </div>
                <p className="text-muted-foreground">{client.nome_empresa}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {client.telefone}
                  </span>
                  {client.email && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => loadClientData()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => navigate(`/clients/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Stats Cards - Apenas com dados reais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">
                    {leadsStats?.total_leads || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leadsStats ? `Atualizado em ${formatDate(leadsStats.ultima_atualizacao)}` : 'Dados não disponíveis'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Leads Convertidos</p>
                  <p className="text-2xl font-bold">
                    {leadsStats?.leads_convertidos || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leadsStats && leadsStats.total_leads > 0 
                      ? `${((leadsStats.leads_convertidos / leadsStats.total_leads) * 100).toFixed(1)}% de conversão`
                      : 'Taxa não disponível'
                    }
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor em Conversões</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(leadsStats?.valor_total_conversoes || null)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total acumulado</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Meta</p>
                  <p className="text-2xl font-bold">
                    {client.saldo_meta ? formatCurrency(client.saldo_meta / 100) : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.alerta_saldo_baixo 
                      ? `Alerta: ${formatCurrency(client.alerta_saldo_baixo / 100)}`
                      : 'Sem alerta configurado'
                    }
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="accounts">Contas & IDs</TabsTrigger>
            <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Client Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p className="font-semibold">{client.nome_cliente}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                      <p className="font-semibold">{client.nome_empresa}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="font-semibold">{client.telefone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-semibold">{client.email || 'Não informado'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Canais</p>
                    <div className="flex flex-wrap gap-2">
                      {client.canais.map(canal => getChannelBadge(canal))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Gestor Responsável</p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{manager.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">Typebot</p>
                        <p className="text-sm text-muted-foreground">
                          {client.typebot_ativo ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.typebot_ativo ? 'default' : 'secondary'}>
                      {client.typebot_ativo ? 'Configurado' : 'Não configurado'}
                    </Badge>
                  </div>

                  {client.typebot_url && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">URL do Typebot</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm bg-muted p-2 rounded flex-1 truncate">
                            {client.typebot_url}
                          </p>
                          <Button size="sm" variant="outline" onClick={() => window.open(client.typebot_url!, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Orçamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget Mensal Meta</span>
                      <span className="font-semibold">
                        {client.budget_mensal_meta ? formatCurrency(client.budget_mensal_meta) : 'Não definido'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget Mensal Google</span>
                      <span className="font-semibold">
                        {client.budget_mensal_google ? formatCurrency(client.budget_mensal_google) : 'Não definido'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Saldo Atual Meta</span>
                      <span className="font-semibold text-green-600">
                        {client.saldo_meta ? formatCurrency(client.saldo_meta / 100) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Alerta Saldo Baixo</span>
                      <span className="font-semibold text-yellow-600">
                        {client.alerta_saldo_baixo ? formatCurrency(client.alerta_saldo_baixo / 100) : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comunicação & Relatórios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Canal de Relatório</span>
                      <Badge variant="outline">
                        {client.canal_relatorio || 'Não configurado'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Horário dos Relatórios</span>
                      <span className="font-semibold">
                        {client.horario_relatorio || 'Não configurado'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Status das Contas</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Meta Ads</span>
                        </div>
                        <Badge variant={client.usa_meta_ads ? 'default' : 'secondary'}>
                          {client.usa_meta_ads ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Google Ads</span>
                        </div>
                        <Badge variant={client.usa_google_ads ? 'default' : 'secondary'}>
                          {client.usa_google_ads ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Cliente Criado</p>
                      <p className="text-sm text-muted-foreground">
                        Cliente {client.nome_cliente} foi adicionado ao sistema
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(client.created_at)}
                      </p>
                    </div>
                  </div>

                  {client.updated_at !== client.created_at && (
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Edit className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Última Atualização</p>
                        <p className="text-sm text-muted-foreground">
                          Informações do cliente foram atualizadas
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(client.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {leadsStats && (
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Estatísticas de Leads</p>
                        <p className="text-sm text-muted-foreground">
                          {leadsStats.total_leads} leads totais • {leadsStats.leads_convertidos} convertidos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado em {formatDate(leadsStats.ultima_atualizacao)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!leadsStats && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Histórico de atividades será exibido aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure integrações para ver mais dados
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}-semibold">{manager.name}</p>
                        <p className="text-sm text-muted-foreground">{manager.email}</p>
                      </div>
                    </div>
                  </div>

                  {client.observacoes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                        <p className="text-sm">{client.observacoes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Real Stats Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leadsStats ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total de Leads</span>
                        <span className="font-bold">{leadsStats.total_leads}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Convertidos</span>
                        <span className="font-bold text-green-600">{leadsStats.leads_convertidos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                        <span className="font-bold">
                          {((leadsStats.leads_convertidos / leadsStats.total_leads) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor Total</span>
                        <span className="font-bold">{formatCurrency(leadsStats.valor_total_conversoes)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Dados de performance não disponíveis
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure integrações para ver estatísticas
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cliente desde</p>
                    <p className="font-semibold">{formatDate(client.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>IDs das Contas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      Meta Ads
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Account ID</p>
                        <p className="font-mono text-sm bg-muted p-2 rounded">
                          {client.meta_account_id || 'Não configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pixel ID</p>
                        <p className="font-mono text-sm bg-muted p-2 rounded">
                          {client.pixel_meta || 'Não configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Usando Meta Ads</p>
                        <Badge variant={client.usa_meta_ads ? 'default' : 'secondary'}>
                          {client.usa_meta_ads ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Search className="h-5 w-5 text-red-600" />
                      Google Ads
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer ID</p>
                        <p className="font-mono text-sm bg-muted p-2 rounded">
                          {client.google_ads_id || 'Não configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GA4 Stream ID</p>
                        <p className="font-mono text-sm bg-muted p-2 rounded">
                          {client.ga4_stream_id || 'Não configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GTM Container ID</p>
                        <p className="font-mono text-sm bg-muted p-2 rounded">
                          {client.gtm_id || 'Não configurado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Usando Google Ads</p>
                        <Badge variant={client.usa_google_ads ? 'default' : 'secondary'}>
                          {client.usa_google_ads ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Accounts Table */}
                {clientAccounts.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Contas Adicionais</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Account ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientAccounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell>{account.tipo}</TableCell>
                              <TableCell className="font-mono">{account.account_id}</TableCell>
                              <TableCell>
                                {getStatusBadge(account.status)}
                              </TableCell>
                              <TableCell>{account.observacoes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status do Rastreamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${client.traqueamento_ativo ? 'bg-green-100' : 'bg-red-100'}`}>
                        {client.traqueamento_ativo ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Rastreamento Principal</p>
                        <p className="text-sm text-muted-foreground">
                          {client.traqueamento_ativo ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.traqueamento_ativo ? 'default' : 'destructive'}>
                      {client.traqueamento_ativo ? 'Configurado' : 'Pendente'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Meta Pixel</span>
                      {client.pixel_meta ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Analytics 4</span>
                      {client.ga4_stream_id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Tag Manager</span>
                      {client.gtm_id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Typebot & Automação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${client.typebot_ativo ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {client.typebot_ativo ? (
                          <Zap className="h-5 w-5 text-green-600" />
                        ) : (
                          <Zap className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font