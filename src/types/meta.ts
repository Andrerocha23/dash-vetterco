export interface MetaInsights {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cost_per_conversion?: number | null;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
  objective: string;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  insights: MetaInsights | null;
}

export interface MetaAccountMetrics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  total_conversions: number;
}

export interface MetaAdsResponse {
  success: boolean;
  account_id: string;
  campaigns: MetaCampaign[];
  account_metrics: MetaAccountMetrics | null;
  fetched_at: string;
  error?: string;
  error_code?: string;
}
