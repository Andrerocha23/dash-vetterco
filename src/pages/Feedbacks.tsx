import { useState, useEffect } from "react";
import { Calendar, TrendingUp, DollarSign, Target, MessageSquare, Star, Eye, ArrowRight } from "lucide-react";
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

  // Componente do Card da Campanha - MELHORADO
  const CampaignCard = ({ campaign }: { campaign: CampaignDay }) => {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getPlatformColor = (platform: string) => {
      switch (platform) {
        case 'Meta': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Google': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getQualityStars = (score: number | null) => {
      if (!score) return '—';
      return '⭐'.repeat(score);
    };

    const qualificationRate = campaign.leads_count > 0 
      ? ((campaign.qualified_leads / campaign.leads_count) * 100).toFixed(0)
      : '0';

    return (
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
        <CardContent className="p-4">
          {/* Header do Card */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1 truncate">
                {campaign.campaign_name}
              </h4>
              <div className="flex items-center gap-2">
                <Badge className={`${getPlatformColor(campaign.platform)} text-xs px-2 py-0.5`}>
                  {campaign.platform}
                </Badge>
                <span className="text-xs text-gray-500 truncate">
                  {campaign.client_name}
                </span>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3" />
            {new Date(campaign.date).toLocaleDateString('pt-BR')}
          </div>

          {/* Métricas principais - Layout melhorado */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-blue-50 p-2 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-700">{campaign.leads_count}</div>
              <div className="text-xs text-blue-600">Leads</div>
            </div>
            <div className="bg-green-50 p-2 rounded-lg text-center">
              <div className="text-lg font-bold text-green-700">{formatCurrency(campaign.spend)}</div>
              <div className="text-xs text-green-600">Gasto</div>
            </div>
          </div>

          {/* Métricas secundárias - Mais compactas */}
          <div className="flex justify-between text-xs mb-3 bg-gray-50 p-2 rounded">
            <div className="text-center flex-1">
              <div className="font-medium text-gray-700">{(campaign.ctr * 100).toFixed(1)}%</div>
              <div className="text-gray-500">CTR</div>
            </div>
            <div className="text-center flex-1 border-x border-gray-200">
              <div className="font-medium text-gray-700">{formatCurrency(campaign.cpc)}</div>
              <div className="text-gray-500">CPC</div>
            </div>
            <div className="text-center flex-1">
              <div className="font-medium text-gray-700">{qualificationRate}%</div>
              <div className="text-gray-500">Qualif.</div>
            </div>
          </div>

          {/* Feedback - Melhorado */}
          {campaign.quality_score && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-yellow-700 font-medium">Qualidade:</span>
                <span className="text-sm">{getQualityStars(campaign.quality_score)}</span>
              </div>
              {campaign.client_notes && (
                <div className="text-xs text-yellow-700 italic line-clamp-2">
                  "{campaign.client_notes.substring(0, 80)}..."
                </div>
              )}
            </div>
          )}

          {/* Botão de ação */}
          {campaign.kanban_status === 'Novo' || campaign.kanban_status === 'Analisando' ? (
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleOpenFeedback(campaign)}
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Dar Feedback
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => handleOpenFeedback(campaign)}
            >
              <Eye className="h-3 w-3 mr-2" />
              Ver Detalhes
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente da Coluna Kanban - MELHORADO
  const KanbanColumn = ({ title, campaigns, color, count }: { 
    title: string; 
    campaigns: CampaignDay[]; 
    color: string;
    count: number;
  }) => (
    <div className="flex-shrink-0 w-80">
      {/* Header da coluna */}
      <div className={`${color} p-3 rounded-lg mb-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white">
            {title}
          </h3>
          <span className="bg-white/20 px-2 py-1 rounded-full text-xs text-white font-medium">
            {count}
          </span>
        </div>
      </div>

      {/* Cards da coluna */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
        
        {campaigns.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-sm text-gray-500">Nenhuma campanha</p>
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

  // Calcular estatísticas
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads_count, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const pendingCount = campaignsByStatus['Novo'].length + campaignsByStatus['Analisando'].length;
  const avgQuality = (() => {
    const withScores = campaigns.filter(c => c.quality_score);
    return withScores.length > 0 
      ? (withScores.reduce((sum, c) => sum + (c.quality_score || 0), 0) / withScores.length).toFixed(1)
      : '0';
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Feedback de Campanhas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie feedback e qualidade dos leads por campanha
            </p>
          </div>
        </div>

        {/* Stats - Layout melhorado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm opacity-90">Pendentes</div>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm opacity-90">Total Leads</div>
                  <div className="text-2xl font-bold">{totalLeads}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm opacity-90">Gasto Total</div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      minimumFractionDigits: 0 
                    }).format(totalSpend)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm opacity-90">Nota Média</div>
                  <div className="text-2xl font-bold">{avgQuality}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board - Layout MUITO melhorado */}
        <Card className="bg-gray-50 border-0">
          <CardContent className="p-6">
            <div className="flex gap-6 overflow-x-auto pb-4 min-h-[650px]">
              <KanbanColumn 
                title="🆕 Novo" 
                campaigns={campaignsByStatus['Novo']} 
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                count={campaignsByStatus['Novo'].length}
              />
              <KanbanColumn 
                title="🔄 Analisando" 
                campaigns={campaignsByStatus['Analisando']} 
                color="bg-gradient-to-r from-yellow-500 to-orange-500"
                count={campaignsByStatus['Analisando'].length}
              />
              <KanbanColumn 
                title="💬 Feedback Dado" 
                campaigns={campaignsByStatus['Feedback Dado']} 
                color="bg-gradient-to-r from-purple-500 to-purple-600"
                count={campaignsByStatus['Feedback Dado'].length}
              />
              <KanbanColumn 
                title="✅ Concluído" 
                campaigns={campaignsByStatus['Concluído']} 
                color="bg-gradient-to-r from-green-500 to-green-600"
                count={campaignsByStatus['Concluído'].length}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modal de Feedback - Melhorado */}
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Feedback da Campanha</DialogTitle>
              <div className="flex items-center gap-2 pt-2">
                <Badge className={selectedCampaign ? getPlatformColor(selectedCampaign.platform) : ''}>
                  {selectedCampaign?.platform}
                </Badge>
                <span className="text-sm text-gray-600">
                  {selectedCampaign?.campaign_name} • {selectedCampaign?.leads_count} leads
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Qualificados</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.qualified_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      qualified_leads: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Desqualificados</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.disqualified_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      disqualified_leads: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Não Responderam</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.no_response_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      no_response_leads: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Convertidos</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedCampaign?.leads_count || 0}
                    value={feedbackForm.converted_leads}
                    onChange={(e) => setFeedbackForm(prev => ({
                      ...prev,
                      converted_leads: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Nota de Qualidade</Label>
                <Select
                  value={feedbackForm.quality_score.toString()}
                  onValueChange={(value) => setFeedbackForm(prev => ({
                    ...prev,
                    quality_score: parseInt(value)
                  }))}
                >
                  <SelectTrigger className="mt-1">
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
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea
                  placeholder="Como foi a qualidade dos leads? Alguma observação sobre o perfil?"
                  value={feedbackForm.client_notes}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    client_notes: e.target.value
                  }))}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFeedback} className="bg-blue-600 hover:bg-blue-700">
                Salvar Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );

  // Helper function (deve ser colocada antes do return)
  function getPlatformColor(platform: string) {
    switch (platform) {
      case 'Meta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Google': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}