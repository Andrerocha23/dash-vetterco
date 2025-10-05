import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Eye,
  UserCheck,
  Archive,
  Filter
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientRegistration {
  id: string;
  razao_social?: string;
  nome_fantasia?: string;
  responsavel_nome?: string;
  responsavel_email: string;
  telefone: string;
  cidade_regiao: string;
  budget_mensal: number | null;
  status: string;
  created_at: string;
  cidades?: string[];
  nichos?: string[];
  segmentos?: string[];
}

export default function ClientRegistrations() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<ClientRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] = useState<ClientRegistration | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_client_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cadastros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('public_client_registrations')
        .update({ 
          status: newStatus,
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Status atualizado para ${newStatus}`,
      });

      await loadRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (statusFilter === "all") return true;
    return reg.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
      case 'Processado': return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
      case 'Cliente': return 'bg-green-500/20 text-green-600 border-green-500/50';
      case 'Rejeitado': return 'bg-red-500/20 text-red-600 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendente': return Clock;
      case 'Processado': return Eye;
      case 'Cliente': return CheckCircle;
      case 'Rejeitado': return Archive;
      default: return Clock;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = {
    total: registrations.length,
    pendente: registrations.filter(r => r.status === 'Pendente').length,
    processado: registrations.filter(r => r.status === 'Processado').length,
    cliente: registrations.filter(r => r.status === 'Cliente').length,
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Cadastros de Clientes</h1>
          </div>
          <div className="text-center py-8">
            Carregando cadastros...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cadastros de Clientes</h1>
          <Button 
            onClick={() => window.open('/cadastro-cliente', '_blank')}
            variant="outline"
          >
            <User className="h-4 w-4 mr-2" />
            Link de Cadastro
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Cadastros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processado}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.cliente}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cadastros Recebidos</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="processado">Processado</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cadastro encontrado</p>
                <p className="text-sm">Os cadastros aparecerão aqui quando houver</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Investimento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => {
                    const StatusIcon = getStatusIcon(registration.status);
                    
                    return (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{registration.responsavel_nome || 'Sem nome'}</div>
                            <div className="text-sm text-muted-foreground">
                              {registration.responsavel_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{registration.razao_social || registration.nome_fantasia || 'Sem nome'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{registration.cidade_regiao}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(registration.budget_mensal)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(registration.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {registration.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {registration.status === 'Pendente' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatus(registration.id, 'Processado')}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatus(registration.id, 'Cliente')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Cadastro</DialogTitle>
            </DialogHeader>
            
            {selectedRegistration && (
              <div className="space-y-6">
                {/* Dados Principais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados Principais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <p className="font-medium">{selectedRegistration.responsavel_nome || 'Sem nome'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="font-medium">{selectedRegistration.responsavel_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                        <p className="font-medium">{selectedRegistration.telefone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                        <p className="font-medium">{selectedRegistration.razao_social || selectedRegistration.nome_fantasia || 'Sem nome'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mercado e Atuação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mercado e Atuação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cidade/Região</label>
                      <p className="font-medium">{selectedRegistration.cidade_regiao}</p>
                    </div>
                    {selectedRegistration.nichos && selectedRegistration.nichos.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nichos</label>
                        <p className="font-medium">{selectedRegistration.nichos.join(', ')}</p>
                      </div>
                    )}
                    {selectedRegistration.segmentos && selectedRegistration.segmentos.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Segmentos</label>
                        <p className="font-medium">{selectedRegistration.segmentos.join(', ')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Investimento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Investimento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                      <p className="font-medium">{formatCurrency(selectedRegistration.budget_mensal)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {selectedRegistration.status === 'Pendente' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          updateStatus(selectedRegistration.id, 'Processado');
                          setShowDetailModal(false);
                        }}
                      >
                        Marcar como Processado
                      </Button>
                      <Button
                        onClick={() => {
                          updateStatus(selectedRegistration.id, 'Cliente');
                          setShowDetailModal(false);
                        }}
                      >
                        Transformar em Cliente
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}