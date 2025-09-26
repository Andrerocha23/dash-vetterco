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

  // Carregar dados reais do banco
  const loadClientsData = async () => {
    try {
      setLoading(true);

      // Buscar clientes com suas configurações de relatório
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          nome_cliente,
          nome_empresa,
          id_grupo,
          meta_account_id,
          google_ads_id,
          status
        `)
        .eq('status', 'Ativo')
        .order('nome_cliente');

      if (clientsError) throw clientsError;

      // Buscar configurações de relatório
      const { data: configsData, error: configsError } = await supabase
        .from('relatorio_config')
        .select('*');

      if (configsError) throw configsError;

      // Buscar últimos disparos
      const { data: disparosData, error: disparosError } = await supabase
        .from('relatorio_disparos')
        .select('*')
        .order('data_disparo', { ascending: false });

      if (disparosError) throw disparosError;

      // Buscar stats dos clientes
      const { data: statsData, error: statsError } = await supabase
        .from('leads_stats')
        .select('client_id, total_leads, leads_convertidos');

      if (statsError) throw statsError;

      // Processar dados
      const processedClients: ClientReport[] = (clientsData || []).map(client => {
        const config = configsData?.find(c => c.client_id === client.id);
        const stats = statsData?.find(s => s.client_id === client.id);
        
        // Encontrar último disparo do cliente
        const ultimoDisparo = disparosData?.find(d => d.client_id === client.id);

        return {
          id: client.id,
          nome_cliente: client.nome_cliente,
          nome_empresa: client.nome_empresa,
          id_grupo: client.id_grupo,
          meta_account_id: client.meta_account_id,
          google_ads_id: client.google_ads_id,
          status: client.status,
          config: config ? {
            ativo: config.ativo || false,
            horario_disparo: config.horario_disparo,
            dias_semana: config.dias_semana || [1, 2, 3, 4, 5]
          } : undefined,
          ultimo_disparo: ultimoDisparo ? {
            data_disparo: ultimoDisparo.data_disparo,
            status: ultimoDisparo.status,
            mensagem_erro: ultimoDisparo.mensagem_erro
          } : undefined,
          stats: stats ? {
            total_leads: stats.total_leads || 0,
            leads_convertidos: stats.leads_convertidos || 0
          } : undefined
        };
      });

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

      // Verificar se já existe config
      const { data: existingConfig } = await supabase
        .from('relatorio_config')
        .select('id')
        .eq('client_id', clientId)
        .single();

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
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  // Enviar relatório agora
  const handleSendReport = async (clientId: string, clientName: string) => {
    try {
      setSendingReport(clientId);

      // Registrar disparo no banco
      const { error } = await supabase
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

      if (error) throw error;

      // Recarregar dados para mostrar o último disparo
      await loadClientsData();

      toast({
        title: "Relatório enviado!",
        description: `Relatório de ${clientName} enviado com sucesso`,
      });

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

  // Abrir modal de edição
  const handleEditClient = (client: ClientReport) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  // Salvar edições do cliente
  const handleSaveEdit = async (updatedData: {
    horario_disparo: string;
    dias_semana: number[];
    ativo: boolean;
  }) => {
    if (!editingClient) return;

    try {
      // Verificar se já existe config
      const { data: existingConfig } = await supabase
        .from('relatorio_config')
        .select('id')
        .eq('client_id', editingClient.id)
        .single();

      if (existingConfig) {
        // Atualizar existente
        const { error } = await supabase
          .from('relatorio_config')
          .update({
            horario_disparo: updatedData.horario_disparo + ':00',
            dias_semana: updatedData.dias_semana,
            ativo: updatedData.ativo,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', editingClient.id);

        if (error) throw error;
      } else {
        // Criar nova config
        const { error } = await supabase
          .from('relatorio_config')
          .insert({
            client_id: editingClient.id,
            horario_disparo: updatedData.horario_disparo + ':00',
            dias_semana: updatedData.dias_semana,
            ativo: updatedData.ativo
          });

        if (error) throw error;
      }

      // Recarregar dados
      await loadClientsData();
      setShowEditModal(false);
      setEditingClient(null);

      toast({
        title: "Sucesso",
        description: `Configurações de ${editingClient.nome_cliente} atualizadas`,
      });

    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
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

  const WeekDaySelector = ({ selectedDays, onChange, disabled = false }: { 
    selectedDays: number[], 
    onChange: (days: number[]) => void,
    disabled?: boolean 
  }) => {
    const toggleDay = (dayId: number) => {
      if (disabled) return;
      
      const newDays = selectedDays.includes(dayId)
        ? selectedDays.filter(d => d !== dayId)
        : [...selectedDays, dayId].sort();
      onChange(newDays);
    };

    return (
      <div className="flex gap-1">
        {weekDays.map(day => (
          <Tooltip key={day.id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedDays.includes(day.id) ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                className={`w-7 h-7 p-0 rounded-lg transition-all duration-200 text-xs ${
                  selectedDays.includes(day.id)
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "hover:bg-muted"
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => toggleDay(day.id)}
              >
                {day.short}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{day.full}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  // Atualizar dias da semana inline
  const handleUpdateDays = async (clientId: string, newDays: number[]) => {
    try {
      const { error } = await supabase
        .from('relatorio_config')
        .update({ 
          dias_semana: newDays,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) throw error;

      // Atualizar estado local
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { 
              ...client, 
              config: {
                ...client.config,
                ativo: client.config?.ativo || false,
                horario_disparo: client.config?.horario_disparo || '09:00:00',
                dias_semana: newDays
              }
            }
          : client
      ));

    } catch (error) {
      console.error('Erro ao atualizar dias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dias",
        variant: "destructive",
      });
    }
  };

  // Componente do Modal de Edição
  const EditClientModal = () => {
    const [formData, setFormData] = useState({
      horario_disparo: '',
      dias_semana: [] as number[],
      ativo: false
    });

    useEffect(() => {
      if (editingClient) {
        setFormData({
          horario_disparo: editingClient.config?.horario_disparo?.slice(0, 5) || '09:00',
          dias_semana: editingClient.config?.dias_semana || [1, 2, 3, 4, 5],
          ativo: editingClient.config?.ativo || false
        });
      }
    }, [editingClient]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveEdit(formData);
    };

    return (
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Configurações</DialogTitle>
            <DialogDescription>
              Configurações de relatório para {editingClient?.nome_cliente}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Ativo */}
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Relatórios Ativos</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, ativo: checked }))
                }
              />
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="horario">Horário de Disparo</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario_disparo}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, horario_disparo: e.target.value }))
                }
              />
            </div>

            {/* Dias da Semana */}
            <div className="space-y-2">
              <Label>Dias da Semana</Label>
              <div className="flex gap-1">
                {weekDays.map(day => (
                  <Button
                    key={day.id}
                    type="button"
                    variant={formData.dias_semana.includes(day.id) ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() => {
                      const newDays = formData.dias_semana.includes(day.id)
                        ? formData.dias_semana.filter(d => d !== day.id)
                        : [...formData.dias_semana, day.id].sort();
                      setFormData(prev => ({ ...prev, dias_semana: newDays }));
                    }}
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
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

  // Stats calculadas dos dados reais
  const totalAtivos = clients.filter(c => c.config?.ativo).length;
  const totalMeta = clients.filter(c => c.meta_account_id).length;
  const totalGoogle = clients.filter(c => c.google_ads_id).length;
  const totalLeads = clients.reduce((sum, c) => sum + (c.stats?.total_leads || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Relatórios</h1>
            <p className="text-text-secondary mt-1">
              Gerencie os disparos automáticos de relatórios para seus clientes
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

        {/* Stats Cards - Nova estrutura */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Todos</p>
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
                <div className="p-2 rounded-lg bg-text-muted/10">
                  <XCircle className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Desativados</p>
                  <p className="text-2xl font-bold text-foreground">{clients.length - totalAtivos}</p>
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
                  <p className="text-text-secondary text-sm">Meta</p>
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
                  <p className="text-text-secondary text-sm">Google</p>
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

        {/* Clients List - Dados Reais */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Lado ESQUERDO - Avatar + Nome/ID vertical */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                      {client.nome_cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      {/* Nome + Status */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {client.nome_cliente}
                        </h3>
                        {getStatusIcon(client)}
                      </div>
                      {/* ID do Grupo embaixo */}
                      {client.id_grupo && (
                        <p className="text-text-tertiary text-sm">
                          {client.id_grupo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lado DIREITO - Todas as informações numa linha */}
                  <div className="flex items-center gap-4">
                    {/* Horário */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-text-muted" />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {client.config?.horario_disparo?.slice(0, 5) || '09:00'}
                      </span>
                    </div>
                    
                    {/* Dias da semana */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-text-muted" />
                      <WeekDaySelector 
                        selectedDays={client.config?.dias_semana || [1, 2, 3, 4, 5]}
                        onChange={(days) => handleUpdateDays(client.id, days)}
                        disabled={!client.config?.ativo}
                      />
                    </div>
                    
                    {/* Separador */}
                    <div className="w-px h-6 bg-border"></div>
                    
                    {/* Meta */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-medium text-sm whitespace-nowrap">Meta</span>
                      {client.meta_account_id ? (
                        <Badge variant="secondary" className="text-xs">Config.</Badge>
                      ) : (
                        <span className="text-xs text-text-muted whitespace-nowrap">Não config.</span>
                      )}
                    </div>
                    
                    {/* Google */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-warning"></div>
                      <span className="font-medium text-sm whitespace-nowrap">Google</span>
                      {client.google_ads_id ? (
                        <Badge variant="secondary" className="text-xs">Config.</Badge>
                      ) : (
                        <span className="text-xs text-text-muted whitespace-nowrap">Não config.</span>
                      )}
                    </div>
                    
                    {/* Separador */}
                    <div className="w-px h-6 bg-border"></div>
                    
                    {/* Status & Controls */}
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
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
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
              <h3 className="font-semibold text-lg mb-2">Nenhum cliente encontrado</h3>
              <p className="text-text-secondary">
                {searchTerm ? "Tente ajustar o termo de busca" : "Nenhum cliente ativo no sistema"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}