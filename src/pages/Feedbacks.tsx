import { useState, useEffect } from "react";
import { Calendar, TrendingUp, DollarSign, Target, MessageSquare, Star, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interface para campanha com métricas diárias
interface CampaignDay {
  id: string;
  client_id: string;
  campaign_id: string;
  campaign_name: string;
  platform: 'Meta' | 'Google' | 'Manual';
  date: string;
  leads_count: number;
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  
  // Feedback do cliente
  feedback_status: 'Pendente' | 'Em Análise' | 'Concluído';
  qualified_leads: number;
  disqualified_leads: number;
  no_response_leads: number;
  scheduled_leads: number;
  converted_leads: number;
  client_notes: string | null;
  quality_score: number | null;
  kanban_status: 'Novo' | 'Analisando' | 'Feedback Dado' | 'Concluído';
  reviewed_by: string | null;
  reviewed_at: string | null;
  
  // Dados do cliente
  client_name?: string;
}

interface FeedbackForm {
  qualified_leads: number;
  disqualified_leads: number;
  no_response_leads: number;
  scheduled_leads: number;
  converted_leads: number;
  client_notes: string;
  quality_score: number;
}

export default function Feedbacks() {
  const [campaigns, setCampaigns] = useState<CampaignDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDay | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    qualified_leads: 0,
    disqualified_leads: 0,
    no_response_leads: 0,
    scheduled_leads: 0,
    converted_leads: 0,
    client_notes: '',
    quality_score: 3,
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const { toast } = useToast();

  // Carregar campanhas do banco
  const loadCampaigns = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('campaign_leads_daily')
        .select(`
          *,
          clients!inner(nome_cliente)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedCampaigns: CampaignDay[] = (data || []).map(campaign => ({
        ...campaign,
        client_name: campaign.clients?.nome_cliente || 'Cliente não encontrado'
      }));

      setCampaigns(transformedCampaigns);

    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as campanhas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Organizar campanhas por status Kanban
  const campaignsByStatus = {
    'Novo': campaigns.filter(c => c.kanban_status === 'Novo'),
    'Analisando': campaigns.filter(c => c.kanban_status === 'Analisando'),
    'Feedback Dado': campaigns.filter(c => c.kanban_status === 'Feedback Dado'),
    'Concluído': campaigns.filter(c => c.kanban_status === 'Concluído'),
  };

  // Abrir modal de feedback
  const handleOpenFeedback = (campaign: CampaignDay) => {
    setSelectedCampaign(campaign);
    setFeedbackForm({
      qualified_leads: campaign.qualified_leads || 0,
      disqualified_leads: campaign.disqualified_leads || 0,
      no_response_leads: campaign.no_response_leads || 0,
      scheduled_leads: campaign.scheduled_leads || 0,
      converted_leads: campaign.converted_leads || 0,
      client_notes: campaign.client_notes || '',
      quality_score: campaign.quality_score || 3,
    });
    setShowFeedbackModal(true);
  };

  // Salvar feedback
  const handleSaveFeedback = async () => {
    if (!selectedCampaign) return;

    try {
      const { error } = await supabase
        .from('campaign_leads_daily')
        .update({
          ...feedbackForm,
          kanban_status: 'Feedback Dado',
          feedback_status: 'Concluído',
          reviewed_by: 'current_user', // TODO: usar user real
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Feedback salvo com sucesso",
      });

      setShowFeedbackModal(false);
      await loadCampaigns();

    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o feedback",
        variant: "destructive",
      });
    }
  };

  // Mover campanha para próximo status
  const handleMoveToNext = async (campaign: CampaignDay) => {
    const statusFlow = {
      'Novo': 'Analisando',
      'Analisando': 'Feedback Dado',
      'Feedback Dado': 'Concluído',
      'Concluído': 'Concluído' // Já está no final
    };

    const nextStatus = statusFlow[campaign.kanban_status];
    if (nextStatus === campaign.kanban_status) return;

    try {
      const { error } = await supabase
        .from('campaign_leads_daily')
        .update({ kanban_status: nextStatus })
        .eq('id', campaign.id);

      if (error) throw error;

      await loadCampaigns();
      
      toast({
        title: "Status atualizado",
        description: `Campanha movida para ${nextStatus}`,
      });

    } catch (error) {
      console.error('Erro ao mover campanha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  // Componente do Card da Campanha
  const CampaignCard = ({ campaign }: { campaign: CampaignDay }) => {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getPlatformColor = (platform: string) => {
      switch (platform) {
        case 'Meta': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        case 'Google': return 'bg-red-500/20 text-red-400 border-red-500/50';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      }
    };

    const getQualityStars = (score: number | null) => {
      if (!score) return '—';
      return '⭐'.repeat(score) + '☆'.repeat(5 - score);
    };

    const qualificationRate = campaign.leads_count > 0 
      ? ((campaign.qualified_leads / campaign.leads_count) * 100).toFixed(1)
      : '0';

    return (
      <Card className="mb-3 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium truncate">
                {campaign.campaign_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPlatformColor(campaign.platform)}>
                  {campaign.platform}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {campaign.client_name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(campaign.date).toLocaleDateString('pt-BR')}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Métricas principais */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-bold text-lg text-primary">{campaign.leads_count}</div>
              <div className="text-xs text-muted-foreground">Leads</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-bold text-lg">{formatCurrency(campaign.spend)}</div>
              <div className="text-xs text-muted-foreground">Gasto</div>
            </div>
          </div>

          {/* Métricas de performance */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">{(campaign.ctr * 100).toFixed(2)}%</div>
              <div className="text-muted-foreground">CTR</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{formatCurrency(campaign.cpc)}</div>
              <div className="text-muted-foreground">CPC</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{qualificationRate}%</div>
              <div className="text-muted-foreground">Qualif.</div>
            </div>
          </div>

          {/* Feedback do cliente */}
          {campaign.quality_score && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span>Qualidade:</span>
                <span>{getQualityStars(campaign.quality_score)}</span>
              </div>
              {campaign.client_notes && (
                <div className="mt-1 text-xs text-muted-foreground italic truncate">
                  "{campaign.client_notes}"
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {campaign.kanban_status === 'Novo' || campaign.kanban_status === 'Analisando' ? (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleOpenFeedback(campaign)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Dar Feedback
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleOpenFeedback(campaign)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente da Coluna Kanban
  const KanbanColumn = ({ title, campaigns, color }: { 
    title: string; 
    campaigns: CampaignDay[]; 
    color: string;
  }) => (
    <div className="flex-1 min-w-80">
      <div className={`p-3 rounded-lg mb-4 ${color}`}>
        <h3 className="font-semibold text-sm">
          {title} ({campaigns.length})
        </h3>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
        {campaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma campanha
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando campanhas...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold">Feedback de Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie feedback e qualidade dos leads por campanha
            </p>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-2xl font-bold mt-1">
                {campaignsByStatus['Novo'].length + campaignsByStatus['Analisando'].length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="text-sm text-muted-foreground">Total Leads</div>
              </div>
              <div className="text-2xl font-bold mt-1">
                {campaigns.reduce((sum, c) => sum + c.leads_count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <div className="text-sm text-muted-foreground">Gasto Total</div>
              </div>
              <div className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 0 
                }).format(campaigns.reduce((sum, c) => sum + c.spend, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                <div className="text-sm text-muted-foreground">Nota Média</div>
              </div>
              <div className="text-2xl font-bold mt-1">
                {(() => {
                  const withScores = campaigns.filter(c => c.quality_score);
                  const avg = withScores.length > 0 
                    ? withScores.reduce((sum, c) => sum + (c.quality_score || 0), 0) / withScores.length
                    : 0;
                  return avg.toFixed(1);
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn 
            title="Novo" 
            campaigns={campaignsByStatus['Novo']} 
            color="bg-blue-500/20 text-blue-400"
          />
          <KanbanColumn 
            title="Analisando" 
            campaigns={campaignsByStatus['Analisando']} 
            color="bg-yellow-500/20 text-yellow-400"
          />
          <KanbanColumn 
            title="Feedback Dado" 
            campaigns={campaignsByStatus['Feedback Dado']} 
            color="bg-purple-500/20 text-purple-400"
          />
          <KanbanColumn 
            title="Concluído" 
            campaigns={campaignsByStatus['Concluído']} 
            color="bg-green-500/20 text-green-400"
          />
        </div>

        {/* Modal de Feedback */}
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Feedback da Campanha</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCampaign?.campaign_name} • {selectedCampaign?.leads_count} leads
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Qualificados</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.qualified_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      qualified_leads: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label>Desqualificados</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.disqualified_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      disqualified_leads: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Não Responderam</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.no_response_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      no_response_leads: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label>Convertidos</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.converted_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      converted_leads: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Nota de Qualidade (1-5)</Label>
                <Select
                  value={feedbackForm.quality_score.toString()}
                  onValueChange={(value) => setFeedbackForm(prev => ({
                    ...prev,
                    quality_score: parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ - Muito Ruim</SelectItem>
                    <SelectItem value="2">⭐⭐ - Ruim</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ - Regular</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ - Bom</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Como foi a qualidade dos leads? Alguma observação sobre o perfil?"
                  value={feedbackForm.client_notes}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    client_notes: e.target.value
                  }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFeedback}>
                Salvar Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}