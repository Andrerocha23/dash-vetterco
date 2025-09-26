import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Instagram,
  Globe,
  Building2,
  Plus,
  Eye,
  Users,
  Calendar,
  Activity,
  ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Cliente {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  instagram_handle: string | null;
  site: string | null;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  status: string;
  canais: string[];
  gestor_id: string;
  gestor_name?: string;
  created_at: string;
  updated_at: string;
}

export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadClienteData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Buscar cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (clienteError) throw clienteError;

      // Buscar contas do cliente
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('cliente_id', id)
        .order('updated_at', { ascending: false });

      if (accountsError) console.warn('Accounts not found:', accountsError);

      // Buscar gestores para as contas
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('id, name')
        .eq('status', 'active');

      if (managersError) console.warn('Managers not found:', managersError);

      // Processar contas com nomes dos gestores
      const processedAccounts: Account[] = (accountsData || []).map(account => {
        const manager = managersData?.find(m => m.id === account.gestor_id);
        return {
          ...account,
          gestor_name: manager?.name || 'Gestor não encontrado'
        };
      });

      setCliente(clienteData);
      setAccounts(processedAccounts);

    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClienteData();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Ativo': 'bg-success text-white',
      'Pausado': 'bg-warning text-white',
      'Arquivado': 'bg-text-muted text-white'
    };
    return (
      <Badge className={`text-xs ${statusColors[status as keyof typeof statusColors] || 'bg-text-muted text-white'}`}>
        {status}
      </Badge>
    );
  };

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge 
        key={channel}
        variant="outline" 
        className={`text-xs ${
          channel === 'Meta' ? 'border-primary text-primary' : 
          channel === 'Google' ? 'border-warning text-warning' :
          'border-accent text-accent'
        }`}
      >
        {channel}
      </Badge>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-text-secondary">Carregando dados do cliente...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!cliente) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Cliente não encontrado</h2>
            <p className="text-text-secondary">O cliente que você está procurando não existe.</p>
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
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/clientes')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{cliente.nome}</h1>
              <p className="text-text-secondary">
                Cliente desde {formatDate(cliente.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cliente Info */}
          <Card className="surface-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">
                    {cliente.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{cliente.nome}</h3>
                  {cliente.cnpj && (
                    <p className="text-text-secondary text-sm">CNPJ: {cliente.cnpj}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {cliente.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-text-secondary" />
                    <span className="text-foreground">{cliente.telefone}</span>
                  </div>
                )}
                
                {cliente.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-text-secondary" />
                    <span className="text-foreground">{cliente.email}</span>
                  </div>
                )}

                {cliente.instagram_handle && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-text-secondary" />
                    <span className="text-foreground">@{cliente.instagram_handle}</span>
                  </div>
                )}

                {cliente.site && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-text-secondary" />
                    <a 
                      href={cliente.site} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {cliente.site.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-text-secondary">
                  <p>Criado em: {formatDate(cliente.created_at)}</p>
                  <p>Atualizado em: {formatDate(cliente.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contas */}
          <Card className="surface-elevated lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Contas de Anúncio ({accounts.length})
                </CardTitle>
                <Button 
                  onClick={() => navigate('/contas?cliente=' + cliente.id)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Conta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <Card key={account.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{account.nome_cliente}</h4>
                              {getStatusBadge(account.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                              <span>{account.nome_empresa}</span>
                              <span>Gestor: {account.gestor_name}</span>
                              <span>Atualizado: {formatDate(account.updated_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getChannelBadges(account.canais)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/contas/${account.id}`)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Abrir conta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma conta vinculada
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Este cliente ainda não possui contas de anúncio vinculadas.
                  </p>
                  <Button 
                    onClick={() => navigate('/contas?cliente=' + cliente.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Criar primeira conta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}