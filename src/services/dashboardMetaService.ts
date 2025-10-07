import { supabase } from "@/integrations/supabase/client";
import type { MetaAdsResponse } from "@/types/meta";

/**
 * Fetches yesterday's Meta Ads data for all active accounts
 */
export const fetchAllAccountsMetaData = async (): Promise<{
  totalSpend: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  avgCPL: number;
  activeCampaigns: number;
  accountsWithData: number;
  accountsData: Array<{
    accountId: string;
    accountName: string;
    spend: number;
    leads: number;
    impressions: number;
    clicks: number;
  }>;
}> => {
  try {
    // Fetch all active accounts with Meta Ads enabled
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, nome_cliente, meta_account_id, status")
      .eq("usa_meta_ads", true)
      .eq("status", "Ativo")
      .not("meta_account_id", "is", null);

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      return {
        totalSpend: 0,
        totalLeads: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCTR: 0,
        avgCPL: 0,
        activeCampaigns: 0,
        accountsWithData: 0,
        accountsData: [],
      };
    }

    console.log(`Fetching Meta data for ${accounts.length} accounts...`);

    // Fetch yesterday's data for each account in parallel
    const fetchPromises = accounts.map(async (account) => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-meta-campaigns", {
          body: {
            meta_account_id: account.meta_account_id,
            period: "yesterday",
          },
        });

        if (error) {
          console.error(`Error fetching Meta data for account ${account.nome_cliente}:`, error);
          return null;
        }

        const metaData = data as MetaAdsResponse;

        if (!metaData.success || !metaData.account_metrics) {
          return null;
        }

        const metrics = metaData.account_metrics;
        const campaignsWithInsights = metaData.campaigns.filter((c) => c.insights && c.status === "ACTIVE");

        return {
          accountId: account.id,
          accountName: account.nome_cliente,
          spend: metrics.total_spend,
          leads: metrics.total_conversions,
          impressions: metrics.total_impressions,
          clicks: metrics.total_clicks,
          activeCampaigns: campaignsWithInsights.length,
        };
      } catch (err) {
        console.error(`Exception fetching data for ${account.nome_cliente}:`, err);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    const validResults = results.filter((r) => r !== null);

    // Aggregate data
    const totalSpend = validResults.reduce((sum, r) => sum + r.spend, 0);
    const totalLeads = validResults.reduce((sum, r) => sum + r.leads, 0);
    const totalImpressions = validResults.reduce((sum, r) => sum + r.impressions, 0);
    const totalClicks = validResults.reduce((sum, r) => sum + r.clicks, 0);
    const activeCampaigns = validResults.reduce((sum, r) => sum + r.activeCampaigns, 0);

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

    console.log(`Successfully fetched data from ${validResults.length}/${accounts.length} accounts`);

    return {
      totalSpend,
      totalLeads,
      totalImpressions,
      totalClicks,
      avgCTR,
      avgCPL,
      activeCampaigns,
      accountsWithData: validResults.length,
      accountsData: validResults,
    };
  } catch (error) {
    console.error("Error in fetchAllAccountsMetaData:", error);
    throw error;
  }
};
