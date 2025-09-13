import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Target, TrendingUp, Play, Pause, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientsService } from "@/services/clientsService";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock chart data for client detail
const mockChartData = [
  { date: "2024-01-01", leads: 15, spend: 420 },
  { date: "2024-01-02", leads: 22, spend: 380 },
  { date: "2024-01-03", leads: 18, spend: 450 },
  { date: "2024-01-04", leads: 28, spend: 520 },
  { date: "2024-01-05", leads: 24, spend: 480 },
  { date: "2024-01-06", leads: 32, spend: 600 },
  { date: "2024-01-07", leads: 26, spend: 540 },
];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClientData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const clientData = await clientsService.getById(id);
        
        if (!clientData) {
          toast({
            title: "Cliente não encontrado",
            description: "O cliente solicitado não foi encontrado",
            variant: "destructive",
          });
          navigate("/clients");
          return;
        }
        
        setClient(clientData);
        setCampaigns([]); // No campaigns for now
      } catch (error) {
        console.error("Falha ao carregar dados do cliente:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados do cliente",
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
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`
          ${channel === 'Meta' 
            ? 'border-primary text-primary bg-primary/10' 
            : 'border-muted-foreground text-muted-foreground bg-secondary/50'
          }
        `}
      >
        {channel}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
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
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <div className="flex gap-2">
                {getChannelBadges(client.channels)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-lg">{client.manager.avatar}</span>
                Gerenciado por {client.manager.name}
              </span>
              <span>•</span>
              <span>Criado em {new Date(client.createdOn).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Editar Cliente</Button>
            <Button variant="apple">Sincronizar Agora</Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Meta Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(client.metaBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Saldo atual da conta</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Play className="h-4 w-4" />
                Campanhas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">Executando atualmente</p>
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
              <div className="text-2xl font-bold">{Math.floor(Math.random() * 150) + 50}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                CPL Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(Math.random() * 50 + 20)}</div>
              <p className="text-xs text-muted-foreground mt-1">Custo por lead</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{(Math.random() * 5 + 1).toFixed(2)}%</div>
                <p className="text-muted-foreground">CTR Médio</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{formatCurrency(Math.random() * 1000 + 500)}</div>
                <p className="text-muted-foreground">Gasto Atual</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{(Math.random() * 15 + 5).toFixed(1)}%</div>
                <p className="text-muted-foreground">Taxa de Gancho</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Leads ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Gasto Diário</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px"
                    }}
                  />
                  <Bar 
                    dataKey="spend" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle>Campaigns ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
                <p className="text-muted-foreground">Este cliente ainda não possui campanhas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Campanha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orçamento Diário</TableHead>
                    <TableHead>Impressões</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>CPL</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={campaign.status === "Active" ? "default" : "secondary"}
                          className={`flex items-center gap-1 w-fit ${
                            campaign.status === "Active" 
                              ? "bg-green-500/20 text-green-400 border-green-500/50" 
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          }`}
                        >
                          {campaign.status === "Active" ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          {campaign.status === "Active" ? "Ativo" : "Pausado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(campaign.dailyBudget)}</TableCell>
                      <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                      <TableCell>{campaign.ctr.toFixed(2)}%</TableCell>
                      <TableCell>{formatCurrency(campaign.cpc)}</TableCell>
                      <TableCell>{campaign.leads}</TableCell>
                      <TableCell>{formatCurrency(campaign.cpl)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem>Ver Campanha</DropdownMenuItem>
                            <DropdownMenuItem>Editar Campanha</DropdownMenuItem>
                            <DropdownMenuItem>Duplicar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}