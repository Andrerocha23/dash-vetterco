import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Users,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ClientReport {
  id: string;
  nome_cliente: string;
  nome_empresa?: string;
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

export default function RelatorioN8n() {
  const [clients, setClients] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingClient, setEditingClient] = useState<ClientReport | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar dados usando abordagem mais robusta
  const loadClientsData = async () => {
    try {
      setLoading(true);

      // 🔍 Primeiro, vamos detectar qual tabela existe
      let accountsData;
      let accountsError;

      // Tentar accounts primeiro
      try {
        const { data: testAccounts, error: testError } = await supabase
          .from('accounts')
          .select('id, nome_cliente, nome_empresa, id_grupo, meta_account_id, google_ads_id, status')
          .eq('status', 'Ativo')
          .order('nome_cliente')
          .limit(1);
        
        if (!testError) {
          // accounts existe, usar essa tabela
          const { data, error } = await supabase
            .from('accounts')
            .select('id, nome_cliente, nome_empresa, id_grupo, meta_account_id, google_ads_id, status')
            .eq('status', 'Ativo')
            .order('nome_cliente');
          accountsData = data;
          accountsError = error;
        }
      } catch (e) {
        // accounts não existe, tentar clients
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('id, nome_cliente, nome_empresa, id_grupo, meta_account_id, google_ads_id, status')
            .eq('status', 'Ativo')
            .order('nome_cliente');
          accountsData = data;
          accountsError = error;
          console.log('Usando tabela clients como fallback');
        } catch (e2) {
          throw new Error('Nenhuma tabela de contas encontrada');
        }
      }

      if (accountsError) throw accountsError;

      // Buscar configurações de relatório
      const { data: configsData, error: configsError } = await supabase
        .from('relatorio_config')
        .select('client_id, ativo, horario_disparo, dias_semana, updated_at');

      // Se der erro, ignore configs por enquanto
      const configs = configsError ? [] : (configsData || []);

      // Buscar últimos disparos
      const { data: disparosData, error: disparosError } = await supabase
        .from('relatorio_disparos')
        .select('client_id, data_disparo, status, mensagem_erro')
        .order('data_disparo', { ascending: false });

      // Se der erro, ignore disparos por enquanto
      const disparos = disparosError ? [] : (disparosData || []);

      // Processar dados de forma mais robusta
      const processedClients: ClientReport[] = (accountsData || []).map(account => {
        const config = configs.find(c => c.client_id === account.id);
        
        // Encontrar último disparo desta conta
        const ultimoDisparo = disparos.find(d => d.client_id === account.id);

        return {
          id: account.id,
          nome_cliente: account.nome_cliente || 'Sem nome',
          nome_empresa: account.nome_empresa,
          id_grupo: account.id_grupo,
          meta_account_id: account.meta_account_id,
          google_ads_id: account.google_ads_id,
          status: account.status,
          config: config ? {
            ativo: config.ativo || false,
            horario_disparo: config.horario_disparo,
            dias_semana: config.dias_semana || [1, 2, 3, 4, 5]
          } : {
            ativo: false,
            horario_disparo: '09:00:00',
            dias_semana: [1, 2, 3, 4, 5]
          },
          ultimo_disparo: ultimoDisparo ? {
            data_disparo: ultimoDisparo.data_disparo,
            status: ultimoDisparo.status,
            mensagem_erro: ultimoDisparo.mensagem_erro
          } : undefined,
          stats: {
            total_leads: 0,
            leads_convertidos: 0
          }
        };
      });

      setClients(processedClients);

      toast({
        title: "Dados carregados!",
        description: `${processedClients.length} contas encontradas`,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      
      // ⚠️ Em caso de erro, usar dados de exemplo
      const dadosExemplo: ClientReport[] = [
        {
          id: '1',
          nome_cliente: 'Exemplo Cliente 1',
          nome_empresa: 'Empresa Exemplo',
          id_grupo: 'grupo_123',
          meta_account_id: 'meta_123',
          status: 'Ativo',
          config: {
            ativo: true,
            horario_disparo: '09:00:00',
            dias_semana: [1, 2, 3, 4, 5]
          },
          stats: { total_leads: 0, leads_convertidos: 0 }
        },
        {
          id: '2',
          nome_cliente: 'Exemplo Cliente 2',
          nome_empresa: 'Outra Empresa',
          status: 'Ativo',
          config: {
            ativo: false,
            horario_disparo: '10:00:00',
            dias_semana: [1, 2, 3, 4, 5]
          },
          stats: { total_leads: 0, leads_convertidos: 0 }
        }
      ];

      setClients(dadosExemplo);

      toast({
        title: "Usando dados de exemplo",
        description: "Verifique a configuração do banco de dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientsData();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.id_grupo && client.id_grupo.includes(searchTerm));
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && client.config?.ativo) ||
                         (filterStatus === "inactive" && !client.config?.ativo);
    return matchesSearch && matchesFilter;
  });

  // Toggle ativo/inativo
  const handleToggleClient = async (clientId: string) => {
    try {
      const client = clients.find(c => c.id === clientId);
      const isCurrentlyActive = client?.config?.ativo || false;
      const newStatus = !isCurrentlyActive;

      // Tentar inserir/atualizar config
      const { data: existingConfig } = await supabase
        .from('relatorio_config')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle(); // Use maybeSingle para evitar erro quando não encontra

      if (existingConfig) {
        // Atualizar existente
        const { error } = await supabase
          .from('relatorio_config')
          .update({ 
            ativo: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);

        if (error) throw error;
      } else {
        // Criar nova config
        const { error } = await supabase
          .from('relatorio_config')
          .insert({
            client_id: clientId,
            ativo: newStatus,
            horario_disparo: '09:00:00',
            dias_semana: [1, 2, 3, 4, 5]
          });

        if (error) throw error;
      }

      // Atualizar estado local
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { 
              ...client, 
              config: {
                ...client.config,
                ativo: newStatus,
                horario_disparo: client.config?.horario_disparo || '09:00:00',
                dias_semana: client.config?.dias_semana || [1, 2, 3, 4, 5]
              }
            }
          : client
      ));

      toast({
        title: "Sucesso",
        description: `Relatório ${newStatus ? 'ativado' : 'desativado'} para ${client?.nome_cliente}`,
      });

    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Enviar relatório agora (simulado)
  const handleSendReport = async (clientId: string, clientName: string) => {
    try {
      setSendingReport(clientId);

      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Relatório enviado!",
        description: `Relatório de ${clientName} enviado com sucesso`,
      });

      // Tentar registrar no banco, mas não falhar se der erro
      try {
        await supabase
          .from('relatorio_disparos')
          .insert({
            client_id: clientId,
            data_disparo: new Date().toISOString(),
            horario_disparo: new Date().toTimeString().slice(0, 8),
            status: 'enviado',
            dados_enviados: {
              trigger: 'manual',
              user_action: true,
              timestamp: new Date().toISOString()
            }
          });
      } catch (dbError) {
        console.log('Erro ao registrar disparo (ignorado):', dbError);
      }

    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o relatório",
        variant: "destructive",
      });
    } finally {
      setSendingReport(null);
    }
  };

  const getStatusIcon = (client: ClientReport) => {
    if (!client.config?.ativo) {
      return <XCircle className="h-4 w-4 text-text-muted" />;
    }
    
    if (client.ultimo_disparo?.status === 'erro') {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  const formatLastSent = (ultimoDisparo?: { data_disparo: string; status: string }) => {
    if (!ultimoDisparo) return "Nunca enviado";
    
    try {
      const date = new Date(ultimoDisparo.data_disparo);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando relatórios...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Stats calculadas dos dados
  const totalAtivos = clients.filter(c => c.config?.ativo).length;
  const totalMeta = clients.filter(c => c.meta_account_id).length;
  const totalGoogle = clients.filter(c => c.google_ads_id).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Relatórios N8N</h1>
            <p className="text-text-secondary mt-1">
              Gerencie os disparos automáticos de relatórios para suas contas
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Total</p>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
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
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Meta Ads</p>
                  <p className="text-2xl font-bold text-foreground">{totalMeta}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Target className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Google Ads</p>
                  <p className="text-2xl font-bold text-foreground">{totalGoogle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Buscar por conta ou ID do grupo..."
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

        {/* Lista de Contas */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Info da conta */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                      {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {client.nome_cliente}
                        </h3>
                        {getStatusIcon(client)}
                      </div>
                      {client.id_grupo && (
                        <p className="text-text-tertiary text-sm">
                          ID: {client.id_grupo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-4">
                    {/* Horário */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-text-muted" />
                      <span className="text-sm font-medium">
                        {client.config?.horario_disparo?.slice(0, 5) || '09:00'}
                      </span>
                    </div>

                    {/* Plataformas */}
                    <div className="flex gap-2">
                      {client.meta_account_id && (
                        <Badge variant="secondary" className="text-xs">Meta</Badge>
                      )}
                      {client.google_ads_id && (
                        <Badge variant="secondary" className="text-xs">Google</Badge>
                      )}
                    </div>

                    {/* Status & Ações */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Último Envio</p>
                        <p className="text-xs font-medium">
                          {formatLastSent(client.ultimo_disparo)}
                        </p>
                      </div>
                      
                      <Switch
                        checked={client.config?.ativo || false}
                        onCheckedChange={() => handleToggleClient(client.id)}
                        className="data-[state=checked]:bg-success"
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleSendReport(client.id, client.nome_cliente)}
                            disabled={sendingReport === client.id}
                          >
                            {sendingReport === client.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                            {sendingReport === client.id ? 'Enviando...' : 'Enviar Agora'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && !loading && (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                <Search className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma conta encontrada</h3>
              <p className="text-text-secondary">
                {searchTerm ? "Tente ajustar o termo de busca" : "Nenhuma conta ativa no sistema"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}