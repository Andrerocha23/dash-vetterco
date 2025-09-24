import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  Target,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Mock data - substitua pelos dados reais
const mockClients = [
  {
    id: 1,
    name: "Adde Negócios",
    initials: "AN",
    groupId: "123633750611388-group",
    metaAccountId: null,
    googleAdsId: null,
    isActive: false,
    metaBalance: 0,
    googleBalance: 0,
    metaReports: false,
    googleReports: false,
    scheduleActive: false,
    scheduleDays: [1, 2, 3, 4, 5], // Segunda a Sexta
    scheduleTime: "09:00",
    lastSent: null,
    status: "inactive"
  },
  {
    id: 2,
    name: "Alexandre CHBG",
    initials: "AC",
    groupId: "123634023181730-group",
    metaAccountId: "542336538152315",
    googleAdsId: null,
    isActive: true,
    metaBalance: 1250.50,
    googleBalance: 0,
    metaReports: true,
    googleReports: false,
    scheduleActive: true,
    scheduleDays: [1, 2, 3, 4, 5],
    scheduleTime: "08:30",
    lastSent: "2025-01-26T08:30:00",
    status: "active"
  },
  {
    id: 3,
    name: "ANA LIVIA",
    initials: "AL",
    groupId: "123633836413519-group",
    metaAccountId: "491021061960049",
    googleAdsId: null,
    isActive: true,
    metaBalance: 850.75,
    googleBalance: 0,
    metaReports: true,
    googleReports: false,
    scheduleActive: true,
    scheduleDays: [1, 3, 5], // Segunda, Quarta, Sexta
    scheduleTime: "09:15",
    lastSent: "2025-01-26T09:15:00",
    status: "active"
  },
  {
    id: 4,
    name: "BÁRBARA RICCI",
    initials: "BR",
    groupId: "123634110899527-group",
    metaAccountId: "789842036470494",
    googleAdsId: null,
    isActive: true,
    metaBalance: 2100.00,
    googleBalance: 0,
    metaReports: true,
    googleReports: false,
    scheduleActive: true,
    scheduleDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
    scheduleTime: "10:00",
    lastSent: "2025-01-26T10:00:00",
    status: "active"
  }
];

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
  const [clients, setClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.groupId.includes(searchTerm);
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && client.isActive) ||
                         (filterStatus === "inactive" && !client.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleToggleClient = (clientId: number) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, isActive: !client.isActive, status: !client.isActive ? "active" : "inactive" }
        : client
    ));
  };

  const handleToggleReports = (clientId: number, type: "meta" | "google") => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            [type === "meta" ? "metaReports" : "googleReports"]: !client[type === "meta" ? "metaReports" : "googleReports"]
          }
        : client
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-text-muted" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-text-muted" />;
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(balance);
  };

  const formatLastSent = (date: string | null) => {
    if (!date) return "Nunca enviado";
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const WeekDaySelector = ({ selectedDays, onChange }: { selectedDays: number[], onChange: (days: number[]) => void }) => {
    const toggleDay = (dayId: number) => {
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
                className={`w-8 h-8 p-0 rounded-lg transition-all duration-200 ${
                  selectedDays.includes(day.id)
                    ? "bg-primary text-primary-foreground shadow-glow scale-105"
                    : "hover:bg-muted hover:scale-105"
                }`}
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
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Disparo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.isActive).length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.metaReports).length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.googleReports).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Saldo Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatBalance(clients.reduce((sum, c) => sum + c.metaBalance + c.googleBalance, 0))}
                  </p>
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

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="surface-elevated hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Client Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                      {client.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg truncate">
                          {client.name}
                        </h3>
                        {getStatusIcon(client.status)}
                      </div>
                      <p className="text-text-tertiary text-sm truncate">
                        {client.groupId}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-text-muted" />
                          <span className="text-sm text-text-secondary">
                            {client.scheduleTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-text-muted" />
                          <WeekDaySelector 
                            selectedDays={client.scheduleDays}
                            onChange={(days) => {
                              setClients(prev => prev.map(c => 
                                c.id === client.id ? {...c, scheduleDays: days} : c
                              ));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Controls */}
                  <div className="flex items-center gap-6">
                    {/* Meta Ads */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="font-medium text-sm">Meta</span>
                      </div>
                      {client.metaAccountId ? (
                        <>
                          <div className="text-center">
                            <p className="text-xs text-text-muted">Saldo</p>
                            <p className="font-semibold text-sm">
                              {formatBalance(client.metaBalance)}
                            </p>
                          </div>
                          <Switch
                            checked={client.metaReports}
                            onCheckedChange={() => handleToggleReports(client.id, "meta")}
                            className="data-[state=checked]:bg-primary"
                          />
                        </>
                      ) : (
                        <p className="text-xs text-text-muted text-center">
                          Não configurado
                        </p>
                      )}
                    </div>

                    {/* Google Ads */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                        <span className="font-medium text-sm">Google</span>
                      </div>
                      {client.googleAdsId ? (
                        <>
                          <div className="text-center">
                            <p className="text-xs text-text-muted">Saldo</p>
                            <p className="font-semibold text-sm">
                              {formatBalance(client.googleBalance)}
                            </p>
                          </div>
                          <Switch
                            checked={client.googleReports}
                            onCheckedChange={() => handleToggleReports(client.id, "google")}
                            className="data-[state=checked]:bg-warning"
                          />
                        </>
                      ) : (
                        <p className="text-xs text-text-muted text-center">
                          Não configurado
                        </p>
                      )}
                    </div>

                    {/* Status & Controls */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-text-muted mb-1">Último Envio</p>
                        <p className="text-xs font-medium">
                          {formatLastSent(client.lastSent)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={client.isActive}
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
                            <DropdownMenuItem className="gap-2">
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Zap className="h-4 w-4" />
                              Enviar Agora
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <Card className="surface-elevated">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 p-3 bg-muted/30 rounded-full w-fit">
                <Search className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhum cliente encontrado</h3>
              <p className="text-text-secondary">
                Tente ajustar os filtros ou termo de busca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}