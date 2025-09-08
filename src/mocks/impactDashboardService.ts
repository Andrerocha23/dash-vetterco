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

// Mock data generators
const generateLeadsMetrics = (period: string): LeadsMetrics => {
  const baseLeads = period === 'today' ? 45 : period === 'yesterday' ? 38 : 
                   period === '7d' ? 280 : period === '15d' ? 650 : 1240;
  
  const variation = (Math.random() - 0.4) * 30; // -12% to +18% bias positive
  
  return {
    current: baseLeads,
    previous: Math.floor(baseLeads / (1 + variation / 100)),
    variation: Math.round(variation * 10) / 10
  };
};

const generateHealthScore = (): HealthScore => {
  const factors = {
    contasSaldoBaixo: Math.random() * 0.3, // 0-30%
    contasSemLeads48h: Math.random() * 0.2, // 0-20%
    campanhasPausadas: Math.random() * 0.15, // 0-15%
    contasSemRastreamento: Math.random() * 0.25 // 0-25%
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
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateHealthScore();
  },

  async getLeadsMetrics(period: string): Promise<LeadsMetrics> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateLeadsMetrics(period);
  },

  async getAccountsWithLowBalance(): Promise<AccountsWithLowBalance> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      count: 3,
      accounts: [
        { id: '1', name: 'TechCorp', balance: 89.50, threshold: 100 },
        { id: '2', name: 'Urban Style', balance: 45.20, threshold: 200 },
        { id: '3', name: 'EcoHome', balance: 12.80, threshold: 150 }
      ]
    };
  },

  async getAccountsWithoutLeads(): Promise<AccountsWithoutLeads> {
    await new Promise(resolve => setTimeout(resolve, 350));
    return {
      count: 2,
      percentage: 16.7, // 2 de 12 contas
      accounts: [
        { id: '4', name: 'FashionBrand', lastLeadDate: '2024-01-04T10:00:00Z' },
        { id: '5', name: 'LocalBiz', lastLeadDate: '2024-01-03T15:30:00Z' }
      ]
    };
  },

  async getPausedCampaigns(): Promise<PausedCampaigns> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      count: 5,
      campaigns: [
        { id: '1', name: 'Summer Sale', accountName: 'TechCorp', pausedDate: '2024-01-05T09:00:00Z' },
        { id: '2', name: 'Brand Awareness', accountName: 'Urban Style', pausedDate: '2024-01-04T14:20:00Z' },
        { id: '3', name: 'Product Launch', accountName: 'EcoHome', pausedDate: '2024-01-04T11:15:00Z' }
      ]
    };
  },

  async getLeadsByChannel(period: string): Promise<LeadsByChannel> {
    await new Promise(resolve => setTimeout(resolve, 450));
    
    const multiplier = period === 'today' ? 0.1 : period === 'yesterday' ? 0.08 : 
                     period === '7d' ? 0.6 : period === '15d' ? 1.2 : 2;
    
    return {
      meta: Math.floor(680 * multiplier),
      google: Math.floor(420 * multiplier),
      organico: Math.floor(95 * multiplier),
      outro: Math.floor(45 * multiplier)
    };
  },

  async getHeatmapData(): Promise<HeatmapData[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return generateHeatmapData();
  },

  async getLeadsTrend(period: string): Promise<LeadsTrend> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
      variation: Math.round((Math.random() - 0.3) * 25 * 10) / 10 // -7.5% to +17.5%
    };
  },

  async getAlerts(): Promise<Alert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAlerts.slice(0, 5);
  }
};