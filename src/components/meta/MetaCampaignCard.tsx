import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { MetaStatusBadge } from "./MetaStatusBadge";
import type { MetaCampaign } from "@/types/meta";

interface MetaCampaignCardProps {
  campaign: MetaCampaign;
}

export function MetaCampaignCard({ campaign }: MetaCampaignCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const openInMetaAdsManager = () => {
    window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${campaign.id}`, '_blank');
  };

  return (
    <Card className="surface-elevated">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate mb-1">
              {campaign.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {campaign.objective}
            </p>
          </div>
          <MetaStatusBadge status={campaign.status} />
        </div>

        {campaign.insights && (
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div>
              <p className="text-muted-foreground">Gasto</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(campaign.insights.spend)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Impressões</p>
              <p className="font-semibold text-foreground">
                {formatNumber(campaign.insights.impressions)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cliques</p>
              <p className="font-semibold text-foreground">
                {formatNumber(campaign.insights.clicks)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">CTR</p>
              <p className="font-semibold text-foreground">
                {campaign.insights.ctr.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">CPC</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(campaign.insights.cpc)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversões</p>
              <p className="font-semibold text-foreground">
                {formatNumber(campaign.insights.conversions)}
              </p>
            </div>
          </div>
        )}

        {(campaign.daily_budget || campaign.lifetime_budget) && (
          <div className="mb-3 pb-3 border-b border-border">
            <p className="text-sm text-muted-foreground">Orçamento</p>
            <p className="text-sm font-semibold text-foreground">
              {campaign.daily_budget 
                ? `${formatCurrency(campaign.daily_budget)}/dia`
                : campaign.lifetime_budget 
                  ? `${formatCurrency(campaign.lifetime_budget)} (total)`
                  : '-'
              }
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={openInMetaAdsManager}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir no Meta Ads Manager
        </Button>
      </CardContent>
    </Card>
  );
}
