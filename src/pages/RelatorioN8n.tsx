import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { n8nService } from "@/mocks/n8nService";
import { 
  Search, 
  RefreshCw, 
  Settings,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  Play,
  Pause,
  TestTube,
  Clock,
  Calendar,
  Filter
} from "lucide-react";

interface ClientReport {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  id_grupo?: string;
  meta_account_id?: string;
  google_ads_id?: string;
  status: string;
  config?: {
    ativo: boolean;
    horario_disparo?: string;
    dias_semana?: number[];
  };
  ultimo_disparo?: {
    data_disparo: string;
    status: string;
    mensagem_erro?: string;
  };
  stats?: {
    total_leads: number;
    leads_convertidos: number;
  };
}

const weekDays = [
  { id: 1, short: "S", full: "Segunda" },
  { id: 2, short: "T", full: "Terça" },
  { id: 3, short: "Q", full: "Quarta" },
  { id: 4, short: "Q", full: "Quinta" },
  { id: 5, short: "S", full: "Sexta" },
  { id: 6, short: "S", full: "Sábado" },
  { id: 0, short: "D", full: "Domingo" }
];

function RelatorioN8n() {
  const [clients, setClients] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar dados usando n8nService
  const loadClientsData = async () => {
    try {
      setLoading(true);

      // Usar o n8nService para buscar os relatórios
      const relatorios = await n8nService.listRelatorios();
      
      // Converter para o formato ClientReport
      const processedClients: ClientReport[] = relatorios.map(relatorio => ({
        id: relatorio.contaId,
        nome_cliente: relatorio.contaNome,
        nome_empresa: relatorio.contaNome, // usar o mesmo nome
        id_grupo: relatorio.idGrupo,
        meta_account_id: relatorio.metaAccountId,
        google_ads_id: relatorio.googleAdsId,
        status: 'Ativo', // status fixo pois n8nService já filtra por ativo
        config: {
          ativo: relatorio.ativo,
          horario_disparo: relatorio.horarioPadrao,
          dias_semana: [1, 2, 3, 4, 5] // padrão seg-sex
        },
        ultimo_disparo: relatorio.ultimoEnvio ? {
          data_disparo: relatorio.ultimoEnvio,
          status: 'enviado',
          mensagem_erro: undefined
        } : undefined
      }));

      setClients(processedClients);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle ativo/inativo usando n8nService
  const handleToggleClient = async (clientId: string) => {
    try {
      const newStatus = await n8nService.toggleAtivo(clientId);
      
      // Atualizar estado local
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, config: { ...client.config!, ativo: newStatus } }
          : client
      ));

      toast({
        title: "Status atualizado",
        description: `Relatório ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  // Testar disparo usando n8nService
  const handleTestReport = async (clientId: string) => {
    try {
      setSendingReport(clientId);
      const result = await n8nService.testarDisparo(clientId);
      
      toast({
        title: result.ok ? "Teste enviado" : "Erro no teste",
        description: result.message,
        variant: result.ok ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o teste.",
        variant: "destructive",
      });
    } finally {
      setSendingReport(null);
    }
  };

  useEffect(() => {
    loadClientsData();
  }, []);

  // Filtrar clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.id_grupo && client.id_grupo.includes(searchTerm));
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && client.config?.ativo) ||
                         (filterStatus === "inactive" && !client.config?.ativo);
    return matchesSearch && matchesFilter;
  });

  // Calcular totais
  const totalClients = clients.length;
  const totalAtivos = clients.filter(c => c.config?.ativo).length;
  const totalDesativados = totalClients - totalAtivos;
  const totalMeta = clients.filter(c => c.meta_account_id).length;
  const totalGoogle = clients.filter(c => c.google_ads_id).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Relatório n8n</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os disparos automatizados de relatórios para seus clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => loadClientsData()}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Todos</p>
                  <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Desativados</p>
                  <p className="text-2xl font-bold text-foreground">{totalDesativados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Meta</p>
                  <p className="text-2xl font-bold text-foreground">{totalMeta}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Target className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Google</p>
                  <p className="text-2xl font-bold text-foreground">{totalGoogle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Buscar por cliente ou ID do grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Avatar + Nome */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white font-bold flex-shrink-0">
                      {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {client.nome_cliente}
                        </h3>
                        <Badge 
                          variant={client.config?.ativo ? "default" : "secondary"}
                          className={client.config?.ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
                        >
                          {client.config?.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {client.id_grupo && (
                        <p className="text-sm text-text-secondary">{client.id_grupo}</p>
                      )}
                    </div>
                  </div>

                  {/* Horário + Dias */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-text-tertiary" />
                      <span className="text-sm">
                        {client.config?.horario_disparo?.slice(0, 5) || "09:00"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {weekDays.map((day) => {
                        const isActive = client.config?.dias_semana?.includes(day.id) ?? [1,2,3,4,5].includes(day.id);
                        return (
                          <div
                            key={day.id}
                            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center border font-medium ${
                              isActive
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : 'bg-muted/30 text-muted-foreground border-border'
                            }`}
                          >
                            {day.short}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Plataformas */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={client.meta_account_id ? "border-blue-200 text-blue-600 bg-blue-50" : ""}
                    >
                      Meta {client.meta_account_id ? "Config." : "Não config."}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={client.google_ads_id ? "border-orange-200 text-orange-600 bg-orange-50" : ""}
                    >
                      Google {client.google_ads_id ? "Config." : "Não config."}
                    </Badge>
                  </div>

                  {/* Último Envio */}
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">Último Envio</p>
                    <p className="text-sm text-text-tertiary">
                      {client.ultimo_disparo?.data_disparo 
                        ? new Date(client.ultimo_disparo.data_disparo).toLocaleDateString('pt-BR')
                        : "Nunca enviado"
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleClient(client.id)}
                      className="gap-1"
                    >
                      {client.config?.ativo ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestReport(client.id)}
                      disabled={sendingReport === client.id}
                      className="gap-1"
                    >
                      <TestTube className="h-3 w-3" />
                      {sendingReport === client.id ? 'Enviando...' : 'Testar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredClients.length === 0 && (
            <Card className="surface-elevated">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-text-secondary mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Tente ajustar os filtros para encontrar os clientes que procura."
                    : "Comece criando sua primeira conta de anúncio."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default RelatorioN8n;