import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_BASE_URL = 'https://graph.facebook.com/v18.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { account_id } = await req.json();
    
    // Se não passar account_id, sincroniza TODAS as contas ativas com Meta
    let accountsToSync = [];
    
    if (account_id) {
      const { data } = await supabaseClient
        .from('accounts')
        .select('id, meta_account_id, nome_cliente')
        .eq('id', account_id)
        .eq('usa_meta_ads', true)
        .single();
      
      if (data) accountsToSync = [data];
    } else {
      const { data } = await supabaseClient
        .from('accounts')
        .select('id, meta_account_id, nome_cliente')
        .eq('usa_meta_ads', true)
        .eq('status', 'Ativo')
        .not('meta_account_id', 'is', null);
      
      accountsToSync = data || [];
    }

    console.log(`Syncing ${accountsToSync.length} accounts`);

    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN not configured');
    }

    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const account of accountsToSync) {
      try {
        // Buscar campanhas dos últimos 7 dias
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const campaignsUrl = `${META_BASE_URL}/act_${account.meta_account_id}/campaigns?fields=id,name,status,objective&access_token=${accessToken}`;
        const campaignsResponse = await fetch(campaignsUrl);
        const campaignsData = await campaignsResponse.json();

        if (!campaignsData.data) continue;

        for (const campaign of campaignsData.data) {
          // Buscar insights da campanha
          const insightsUrl = `${META_BASE_URL}/${campaign.id}/insights?fields=impressions,reach,frequency,clicks,spend,ctr,cpc,cpm,actions,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_avg_time_watched_actions&time_range={"since":"${since}","until":"${today}"}&breakdowns=&access_token=${accessToken}`;
          
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();

          if (!insightsData.data || insightsData.data.length === 0) continue;

          const insights = insightsData.data[0];

          // Calcular conversões (leads)
          let conversions = 0;
          if (insights.actions) {
            const leadActions = insights.actions.filter((action: any) => 
              action.action_type === 'lead' ||
              action.action_type === 'offsite_conversion.fb_pixel_lead' ||
              action.action_type === 'onsite_conversion.lead'
            );
            conversions = leadActions.reduce((sum, action) => sum + parseInt(action.value || '0'), 0);
          }

          // Calcular métricas de vídeo
          let threeSecondViews = 0;
          let thruPlays = 0;
          let p25 = 0, p50 = 0, p75 = 0, p100 = 0;
          let avgWatchTime = 0;

          if (insights.video_play_actions) {
            const threeSecAction = insights.video_play_actions.find((a: any) => a.action_type === 'video_view');
            threeSecondViews = threeSecAction ? parseInt(threeSecAction.value) : 0;
          }

          if (insights.video_p25_watched_actions) {
            p25 = parseInt(insights.video_p25_watched_actions[0]?.value || '0');
          }
          if (insights.video_p50_watched_actions) {
            p50 = parseInt(insights.video_p50_watched_actions[0]?.value || '0');
          }
          if (insights.video_p75_watched_actions) {
            p75 = parseInt(insights.video_p75_watched_actions[0]?.value || '0');
          }
          if (insights.video_p100_watched_actions) {
            p100 = parseInt(insights.video_p100_watched_actions[0]?.value || '0');
            thruPlays = p100; // ThruPlay = assistiu até o final
          }

          if (insights.video_avg_time_watched_actions) {
            avgWatchTime = parseFloat(insights.video_avg_time_watched_actions[0]?.value || '0');
          }

          const impressions = parseInt(insights.impressions || '0');
          const reach = parseInt(insights.reach || '0');
          const frequency = reach > 0 ? impressions / reach : 0;
          const hookRate = impressions > 0 ? (threeSecondViews / impressions) * 100 : 0;
          const holdRate = impressions > 0 ? (thruPlays / impressions) * 100 : 0;

          // Inserir ou atualizar no banco
          const { error: upsertError } = await supabaseClient
            .from('campaign_leads_daily')
            .upsert({
              client_id: account.id,
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              platform: 'Meta',
              date: today,
              
              // Básico
              spend: parseFloat(insights.spend || '0'),
              impressions: impressions,
              clicks: parseInt(insights.clicks || '0'),
              ctr: parseFloat(insights.ctr || '0'),
              cpc: parseFloat(insights.cpc || '0'),
              cpm: parseFloat(insights.cpm || '0'),
              leads_count: conversions,
              
              // Alcance
              reach: reach,
              frequency: frequency,
              
              // Vídeo
              hook_rate: hookRate,
              hold_rate: holdRate,
              video_avg_watch_time: avgWatchTime,
              three_second_video_views: threeSecondViews,
              thru_plays: thruPlays,
              video_p25_watched: p25,
              video_p50_watched: p50,
              video_p75_watched: p75,
              video_p100_watched: p100,
              
              // Meta
              objective: campaign.objective,
              delivery_status: campaign.status,
            }, {
              onConflict: 'client_id,campaign_id,date',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('Error upserting campaign data:', upsertError);
          }
        }

        results.push({
          account_id: account.id,
          account_name: account.nome_cliente,
          success: true,
          campaigns_synced: campaignsData.data.length
        });

      } catch (error: any) {
        console.error(`Error syncing account ${account.id}:`, error);
        results.push({
          account_id: account.id,
          account_name: account.nome_cliente,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_accounts: results.length,
        results: results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});