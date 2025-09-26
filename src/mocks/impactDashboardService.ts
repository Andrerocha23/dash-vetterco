export interface HealthScore {
  score: number;
  factors: {
    contasSaldoBaixo: number;
    contasSemLeads48h: number;
    campanhasPausadas: number;
    contasSemRastreamento: number;
  };
}

export interface LeadsMetrics {
  current: number;
  previous: number;
  variation: number;
}

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
    lastLeadDate: string;
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
  hour: number;
  day: string;
  leads: number;
}

export interface LeadsTrend {
  data: Array<{
    date: string;
    leads: number;
  }>;
  variation: number;
}

export interface Alert {
  id: string;
  type: 'saldo_critico' | 'zero_leads' | 'campanhas_pausadas' | 'rastreamento_pendente' | 'erro_sync';
  severity: 'alta' | 'media' | 'baixa';
  title: string;
  description: string;
  count?: number;
  action: string;
  actionUrl: string;
}

import { supabase } from "@/integrations/supabase/client";

// Função para calcular health score baseado em dados reais
const calculateHealthScore = (clients: any[]): HealthScore => {
  const totalClients = clients.length;
  if (totalClients === 0) return { score: 100, factors: { contasSaldoBaixo: 0, contasSemLeads48h: 0, campanhasPausadas: 0, contasSemRastreamento: 0 } };

  const contasSaldoBaixo = clients.filter(c => c.usa_meta_ads && (c.saldo_meta || 0) < (c.alerta_saldo_baixo || 100)).length;
  const contasSemRastreamento = clients.filter(c => !c.traqueamento_ativo).length;
  
  // Por enquanto, simulamos dados de leads e campanhas pausadas (serão implementados quando tivermos as tabelas)
  const contasSemLeads48h = Math.floor(totalClients * 0.1); // 10% das contas
  const campanhasPausadas = Math.floor(totalClients * 0.15); // 15% das contas

  const factors = {
    contasSaldoBaixo: contasSaldoBaixo / totalClients,
    contasSemLeads48h: contasSemLeads48h / totalClients,
    campanhasPausadas: campanhasPausadas / totalClients,
    contasSemRastreamento: contasSemRastreamento / totalClients
  };

  const score = Math.round(100 - (
    25 * factors.contasSaldoBaixo +
    25 * factors.contasSemLeads48h +
    25 * factors.campanhasPausadas +
    25 * factors.contasSemRastreamento
  ));

  return { score: Math.max(0, score), factors };
};

const generateHeatmapData = (): HeatmapData[] => {
  const data: HeatmapData[] = [];
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const isBusinessHour = hour >= 8 && hour <= 18;
      const isWeekday = day < 5;
      const baseLeads = isBusinessHour && isWeekday ? 8 : 2;
      
      data.push({
        hour,
        day: days[day],
        leads: Math.floor(Math.random() * baseLeads) + (isBusinessHour && isWeekday ? 2 : 0)
      });
    }
  }
  
  return data;
};

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'saldo_critico',
    severity: 'alta',
    title: 'Saldo Crítico',
    description: '3 contas com saldo abaixo de R$ 100',
    count: 3,
    action: 'Ver contas',
    actionUrl: '/clientes?filter=saldo-baixo'
  },
  {
    id: '2',
    type: 'zero_leads',
    severity: 'alta',
    title: 'Sem Leads 48h',
    description: '2 contas ativas sem leads recentes',
    count: 2,
    action: 'Verificar campanhas',
    actionUrl: '/clientes?filter=sem-leads'
  },
  {
    id: '3',
    type: 'campanhas_pausadas',
    severity: 'media',
    title: 'Campanhas Pausadas',
    description: '5 campanhas Meta pausadas',
    count: 5,
    action: 'Revisar campanhas',
    actionUrl: '/clientes?canal=meta&status=pausada'
  },
  {
    id: '4',
    type: 'rastreamento_pendente',
    severity: 'baixa',
    title: 'Rastreamento Pendente',
    description: '1 conta sem Pixel ou GA4 configurado',
    count: 1,
    action: 'Configurar',
    actionUrl: '/clientes?filter=sem-rastreamento'
  },
  {
    id: '5',
    type: 'erro_sync',
    severity: 'media',
    title: 'Erro de Sincronização',
    description: '2 webhooks com falhas nas últimas 24h',
    count: 2,
    action: 'Verificar logs',
    actionUrl: '/settings?tab=webhooks'
  }
];

export const impactDashboardService = {
  async getHealthScore(): Promise<HealthScore> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('status', 'Ativo');

      if (error) throw error;
      
      return calculateHealthScore(accounts || []);
    } catch (error) {
      console.error('Erro ao buscar health score:', error);
      return { score: 0, factors: { contasSaldoBaixo: 0, contasSemLeads48h: 0, campanhasPausadas: 0, contasSemRastreamento: 0 } };
    }
  },

  async getLeadsMetrics(period: string): Promise<LeadsMetrics> {
    // TODO: Implementar quando tivermos tabela de leads
    // Por enquanto retorna dados simulados baseados no período
    const baseLeads = period === 'today' ? 45 : period === 'yesterday' ? 38 : 
                     period === '7d' ? 280 : period === '15d' ? 650 : 1240;
    
    const variation = (Math.random() - 0.4) * 30;
    
    return {
      current: baseLeads,
      previous: Math.floor(baseLeads / (1 + variation / 100)),
      variation: Math.round(variation * 10) / 10
    };
  },

  async getAccountsWithLowBalance(): Promise<AccountsWithLowBalance> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('id, nome_cliente, saldo_meta, alerta_saldo_baixo, usa_meta_ads')
        .eq('status', 'Ativo')
        .eq('usa_meta_ads', true);

      if (error) throw error;

      const lowBalanceAccounts = (accounts || []).filter(account => {
        const balance = (account.saldo_meta || 0) / 100; // Convertendo de centavos para reais
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
      const percentage = totalAccounts > 0 ? (withoutLeadsCount / totalAccounts) * 100 : 0;

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
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        leads: Math.floor(Math.random() * 60) + 20
      });
    }
    
    return {
      data,
      variation: Math.round((Math.random() - 0.3) * 25 * 10) / 10
    };
  },

  async getAlerts(): Promise<Alert[]> {
    try {
      const alerts: Alert[] = [];

      // Buscar contas com saldo baixo
      const { data: lowBalanceClients } = await supabase
        .from('clients')
        .select('id, nome_cliente, saldo_meta, alerta_saldo_baixo')
        .eq('status', 'Ativo')
        .eq('usa_meta_ads', true);

      const lowBalance = (lowBalanceClients || []).filter(c => 
        (c.saldo_meta || 0) < (c.alerta_saldo_baixo || 100)
      );

      if (lowBalance.length > 0) {
        alerts.push({
          id: 'saldo-baixo',
          type: 'saldo_critico',
          severity: 'alta',
          title: 'Saldo Crítico',
          description: `${lowBalance.length} conta(s) com saldo abaixo do limite`,
          count: lowBalance.length,
          action: 'Ver contas',
          actionUrl: '/clientes?filter=saldo-baixo'
        });
      }

      // Buscar contas sem rastreamento
      const { data: noTrackingClients } = await supabase
        .from('clients')
        .select('id, nome_cliente')
        .eq('status', 'Ativo')
        .eq('traqueamento_ativo', false);

      if (noTrackingClients && noTrackingClients.length > 0) {
        alerts.push({
          id: 'sem-rastreamento',
          type: 'rastreamento_pendente',
          severity: 'media',
          title: 'Rastreamento Pendente',
          description: `${noTrackingClients.length} conta(s) sem rastreamento configurado`,
          count: noTrackingClients.length,
          action: 'Configurar',
          actionUrl: '/clientes?filter=sem-rastreamento'
        });
      }

      // Buscar clientes pausados
      const { data: pausedClients } = await supabase
        .from('clients')
        .select('id, nome_cliente')
        .eq('status', 'Pausado');

      if (pausedClients && pausedClients.length > 0) {
        alerts.push({
          id: 'pausados',
          type: 'campanhas_pausadas',
          severity: 'media',
          title: 'Contas Pausadas',
          description: `${pausedClients.length} conta(s) pausada(s)`,
          count: pausedClients.length,
          action: 'Revisar contas',
          actionUrl: '/clientes?status=pausado'
        });
      }

      return alerts.slice(0, 5);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  }
};