import { useState, useEffect } from "react";
import { Download, Eye, Edit, Plus, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interfaces para leads reais
interface Lead {
  id: string;
  client_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string;
  campanha: string | null;
  status: string;
  qualificacao: string | null;
  interesse: string | null;
  responsavel_id: string | null;
  nota_qualificacao: number | null;
  created_at: string;
  updated_at: string;
  // Dados do cliente
  client_name?: string;
}

interface LeadStats {
  total: number;
  novos: number;
  contatados: number;
  qualificados: number;
  convertidos: number;
  desqualificados: number;
}

export default function Feedbacks() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    novos: 0,
    contatados: 0,
    qualificados: 0,
    convertidos: 0,
    desqualificados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");

  const { toast } = useToast();

  // Função para carregar leads do banco
  const loadLeads = async () => {
    try {
      setLoading(true);

      // Buscar leads com informações do cliente
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          clients!inner(
            nome_cliente
          )
        `)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Transformar dados para incluir nome do cliente
      const transformedLeads: Lead[] = (leadsData || []).map(lead => ({
        ...lead,
        client_name: lead.clients?.nome_cliente || 'Cliente não encontrado'
      }));

      setLeads(transformedLeads);

      // Calcular estatísticas
      const totalLeads = transformedLeads.length;
      const leadStats: LeadStats = {
        total: totalLeads,
        novos: transformedLeads.filter(l => l.status === 'Novo').length,
        contatados: transformedLeads.filter(l => l.status === 'Contatado').length,
        qualificados: transformedLeads.filter(l => l.status === 'Qualificado').length,
        convertidos: transformedLeads.filter(l => l.status === 'Convertido').length,
        desqualificados: transformedLeads.filter(l => l.status === 'Desqualificado').length,
      };

      setStats(leadStats);

    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar leads quando o componente montar
  useEffect(() => {
    loadLeads();
  }, []);

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.telefone && lead.telefone.includes(searchQuery));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesOrigem = origemFilter === "all" || lead.origem === origemFilter;

    return matchesSearch && matchesStatus && matchesOrigem;
  });

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Novo': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Contatado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Qualificado': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Convertido': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Desqualificado': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Função para obter cor da origem
  const getOrigemColor = (origem: string) => {
    switch (origem) {
      case 'Meta': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Google': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Orgânico': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Função para exportar CSV (simplificada)
  const handleExport = () => {
    const csvData = filteredLeads.map(lead => ({
      Nome: lead.nome,
      Telefone: lead.telefone || '',
      Email: lead.email || '',
      Cliente: lead.client_name,
      Origem: lead.origem,
      Campanha: lead.campanha || '',
      Status: lead.status,
      Qualificação: lead.qualificacao || '',
      'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Sucesso",
      description: "CSV exportado com sucesso",
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando leads...</p>
          </div>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Feedbacks & Leads</h1>
            <p className="text-muted-foreground">
              Gerencie e qualifique seus leads
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport} 
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Novos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.novos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contatados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.contatados}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Qualificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.qualificados}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Convertidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{stats.convertidos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Desqualificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.desqualificados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Contatado">Contatado</SelectItem>
              <SelectItem value="Qualificado">Qualificado</SelectItem>
              <SelectItem value="Convertido">Convertido</SelectItem>
              <SelectItem value="Desqualificado">Desqualificado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={origemFilter} onValueChange={setOrigemFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="Meta">Meta</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Orgânico">Orgânico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">Nenhum lead encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || origemFilter !== "all"
                    ? "Tente ajustar sua busca ou filtros"
                    : "Aguardando os primeiros leads chegarem"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Qualificação</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {lead.telefone} • {lead.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{lead.client_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOrigemColor(lead.origem)}>
                          {lead.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.campanha || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.qualificacao ? (
                          <Badge variant="outline">{lead.qualificacao}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.nota_qualificacao ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{lead.nota_qualificacao}</span>
                            <span className="text-muted-foreground">/5</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Dados em tempo real • 
            Último update: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
