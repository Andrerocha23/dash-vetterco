import { supabase } from '@/lib/supabase';

// Types para o dashboard de impacto
export interface AccountsWithLowBalance {
  count: number;
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    threshold: number;
  }>;
}

export interface AccountsWithoutLeads {
  count: number;
  percentage: number;
  accounts: Array<{
    id: string;
    name: string;
  }>;
}

export interface PausedCampaigns {
  count: number;
  campaigns: Array<{
    id: string;
    name: string;
    accountName: string;
    pausedDate: string;
  }>;
}

export interface LeadsByChannel {
  meta: number;
  google: number;
  organico: number;
  outro: number;
}

export interface HeatmapData {
  hour: string;
  leads: number;
}

export interface LeadsTrend {
  current: number;
  previous: number;
  variation: number;
}

// Função para gerar dados do heatmap (simulado)
function generateHeatmapData(): HeatmapData[] {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: i.toString().padStart(2, '0') + ':00',
      leads: Math.floor(Math.random() * 20) + 1
    });
  }
  return hours;
}

export const impactDashboardService = {
  async getAccountsWithLowBalance(): Promise<AccountsWithLowBalance> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, nome_cliente, saldo_meta, alerta_saldo_baixo, usa_meta_ads')
        .eq('status', 'Ativo')
        .eq('usa_meta_ads', true);

      if (error) throw error;

      const lowBalanceAccounts = (accounts || []).filter(account => {
        const balance = (account.saldo_meta || 0) / 100;
        const threshold = (account.alerta_saldo_baixo || 100) / 100;
        return balance < threshold;
      });

      return {
        count: lowBalanceAccounts.length,
        accounts: lowBalanceAccounts.map(account => ({
          id: account.id,
          name: account.nome_cliente,
          balance: (account.saldo_meta || 0) / 100,
          threshold: (account.alerta_saldo_baixo || 100) / 100
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar contas com saldo baixo:', error);
      return { count: 0, accounts: [] };
    }
  },

  async getAccountsWithoutLeads(): Promise<AccountsWithoutLeads> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, nome_cliente')
        .eq('status', 'Ativo');

      if (error) throw error;

      const totalAccounts = accounts?.length || 0;
      
      // TODO: Implementar quando tivermos tabela de leads
      // Por enquanto simula 10% das contas sem leads
      const withoutLeadsCount = Math.floor(totalAccounts * 0.1);
      const percentage = totalAccounts > 0 ? 
        (withoutLeadsCount / totalAccounts) * 100 : 0;

      return {
        count: withoutLeadsCount,
        percentage,
        accounts: [] // Será preenchido quando tivermos dados reais de leads
      };
    } catch (error) {
      console.error('Erro ao buscar contas sem leads:', error);
      return { count: 0, percentage: 0, accounts: [] };
    }
  },

  async getPausedCampaigns(): Promise<PausedCampaigns> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, nome_cliente')
        .eq('status', 'Pausado');

      if (error) throw error;

      // TODO: Implementar quando tivermos tabela de campanhas
      // Por enquanto considera contas pausadas como campanhas pausadas
      return {
        count: accounts?.length || 0,
        campaigns: (accounts || []).map(account => ({
          id: account.id,
          name: 'Campanha Principal',
          accountName: account.nome_cliente,
          pausedDate: new Date().toISOString()
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar campanhas pausadas:', error);
      return { count: 0, campaigns: [] };
    }
  },

  async getLeadsByChannel(period: string): Promise<LeadsByChannel> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('canais')
        .eq('status', 'Ativo');

      if (error) throw error;

      // Conta quantas contas usam cada canal
      const channelCounts = {
        meta: 0,
        google: 0,
        organico: 0,
        outro: 0
      };

      (accounts || []).forEach(account => {
        const canais = account.canais || [];
        if (canais.includes('Meta')) channelCounts.meta++;
        if (canais.includes('Google')) channelCounts.google++;
        if (canais.includes('Orgânico')) channelCounts.organico++;
        if (canais.includes('Outro')) channelCounts.outro++;
      });

      // Multiplica por um fator baseado no período para simular leads
      const multiplier = period === 'today' ? 5 : period === 'yesterday' ? 4 : 
                        period === '7d' ? 35 : period === '15d' ? 75 : 150;

      return {
        meta: channelCounts.meta * multiplier,
        google: channelCounts.google * multiplier,
        organico: channelCounts.organico * multiplier,
        outro: channelCounts.outro * multiplier
      };
    } catch (error) {
      console.error('Erro ao buscar leads por canal:', error);
      return { meta: 0, google: 0, organico: 0, outro: 0 };
    }
  },

  async getHeatmapData(): Promise<HeatmapData[]> {
    // TODO: Implementar quando tivermos dados de leads com timestamp
    return generateHeatmapData();
  },

  async getLeadsTrend(period: string): Promise<LeadsTrend> {
    // TODO: Implementar quando tivermos tabela de leads
    const days = period === '7d' ? 7 : period === '15d' ? 15 : period === '30d' ? 30 : 1;
    
    const baseLeads = period === 'today' ? 45 : period === 'yesterday' ? 38 : 
                     period === '7d' ? 280 : period === '15d' ? 650 : 1240;
    
    const variation = (Math.random() - 0.4) * 30;
    
    return {
      current: baseLeads,
      previous: Math.floor(baseLeads / (1 + variation / 100)),
      variation: Math.round(variation * 10) / 10
    };
  }
};