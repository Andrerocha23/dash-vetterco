import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MetaStatusBadge } from "./MetaStatusBadge";
import type { MetaCampaign } from "@/types/meta";

interface MetaCampaignDetailDialogProps {
  campaign: MetaCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MetaCampaignDetailDialog({ 
  campaign, 
  open, 
  onOpenChange 
}: MetaCampaignDetailDialogProps) {
  if (!campaign) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPerformanceIndicator = (ctr: number) => {
    if (ctr >= 2) {
      return { icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600 dark:text-green-400', label: 'Excelente' };
    } else if (ctr >= 1) {
      return { icon: <Minus className="h-5 w-5" />, color: 'text-yellow-600 dark:text-yellow-400', label: 'Bom' };
    } else {
      return { icon: <TrendingDown className="h-5 w-5" />, color: 'text-red-600 dark:text-red-400', label: 'Precisa Melhorar' };
    }
  };

  const openInMetaAdsManager = () => {
    window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${campaign.id}`, '_blank');
  };

  const insights = campaign.insights;
  const performance = insights ? getPerformanceIndicator(insights.ctr) : null;
  const hookrate = insights && insights.impressions > 0 
    ? (insights.clicks / insights.impressions) * 100 
    : 0;
  const costPerLead = insights && insights.conversions > 0
    ? insights.spend / insights.conversions
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold pr-8">
            {campaign.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <MetaStatusBadge status={campaign.status} />
            {performance && (
              <Badge variant="outline" className={performance.color}>
                <span className="mr-1">{performance.icon}</span>
                {performance.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">INFORMAÇÕES DA CAMPANHA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                  <p className="text-base font-medium">{campaign.objective}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orçamento</p>
                  <p className="text-base font-medium">
                    {campaign.daily_budget 
                      ? `${formatCurrency(campaign.daily_budget)}/dia`
                      : campaign.lifetime_budget 
                        ? `${formatCurrency(campaign.lifetime_budget)} (total)`
                        : 'Não definido'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {insights && (
            <>
              {/* Métricas Principais */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">MÉTRICAS PRINCIPAIS</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Gasto Total</p>
                      <p className="text-xl font-bold">{formatCurrency(insights.spend)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Impressões</p>
                      <p className="text-xl font-bold">{formatNumber(insights.impressions)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Alcance</p>
                      <p className="text-xl font-bold">{formatNumber(insights.reach)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Cliques</p>
                      <p className="text-xl font-bold">{formatNumber(insights.clicks)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Performance */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">PERFORMANCE</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">CTR</p>
                      <p className="text-xl font-bold flex items-center gap-2">
                        {formatPercentage(insights.ctr)}
                        {performance && <span className={performance.color}>{performance.icon}</span>}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">CPC</p>
                      <p className="text-xl font-bold">{formatCurrency(insights.cpc)}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">CPM</p>
                      <p className="text-xl font-bold">{formatCurrency(insights.cpm)}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Hookrate</p>
                      <p className="text-xl font-bold">{formatPercentage(hookrate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversões e Leads */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">CONVERSÕES E LEADS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total de Leads</p>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(insights.conversions)}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Custo por Lead</p>
                      <p className="text-2xl font-bold">
                        {costPerLead ? formatCurrency(costPerLead) : '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
                      <p className="text-2xl font-bold">
                        {insights.impressions > 0 
                          ? formatPercentage((insights.conversions / insights.impressions) * 100)
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Análise de Frequência */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">ANÁLISE DE ALCANCE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Frequência</p>
                      <p className="text-xl font-bold">
                        {insights.reach > 0 
                          ? (insights.impressions / insights.reach).toFixed(2)
                          : '-'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Média de vezes que cada pessoa viu o anúncio
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Alcance vs Impressões</p>
                      <p className="text-xl font-bold">
                        {insights.impressions > 0 
                          ? formatPercentage((insights.reach / insights.impressions) * 100)
                          : '-'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentual de alcance único
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!insights && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum dado de performance disponível para esta campanha.
                </p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={openInMetaAdsManager}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Meta Ads Manager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
