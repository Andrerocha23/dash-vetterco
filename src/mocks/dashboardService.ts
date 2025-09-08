export interface KPIData {
  activeClientsMeta: number;
  activeClientsGoogle: number;
  totalSpend: number;
  leads: number;
  avgCTR: number;
  avgCPL: number;
}

export interface ChartDataPoint {
  date: string;
  leads: number;
  spend: number;
}

export interface CreativePerformance {
  id: string;
  name: string;
  ctr: number;
  hookRate: number;
}

export interface MetaAccount {
  id: string;
  name: string;
  balance: number;
  status: 'Active' | 'Low' | 'Depleted';
  trend: number[]; // sparkline data
}

export interface AutomationStats {
  whatsappSends: number;
  reportsSent: number;
  leadsSynced: number;
}

// Mock data generators
const generateChartData = (days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      leads: Math.floor(Math.random() * 50) + 20,
      spend: Math.floor(Math.random() * 1000) + 500
    });
  }
  
  return data;
};

const mockCreatives: CreativePerformance[] = [
  { id: '1', name: 'Spring Sale Video', ctr: 4.2, hookRate: 78.5 },
  { id: '2', name: 'Product Demo Carousel', ctr: 3.8, hookRate: 72.1 },
  { id: '3', name: 'Testimonial Story', ctr: 3.5, hookRate: 69.8 }
];

const mockMetaAccounts: MetaAccount[] = [
  {
    id: 'acc1',
    name: 'TechCorp Main',
    balance: 15420.50,
    status: 'Active',
    trend: [12000, 13500, 14200, 15420]
  },
  {
    id: 'acc2',
    name: 'Urban Fitness',
    balance: 8760.30,
    status: 'Active',
    trend: [9200, 8800, 8500, 8760]
  },
  {
    id: 'acc3',
    name: 'EcoHome',
    balance: 450.80,
    status: 'Low',
    trend: [2300, 1800, 1200, 451]
  }
];

// Service functions
export const dashboardService = {
  async getKPIData(period: string): Promise<KPIData> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate different data based on period
    const multiplier = period === '30d' ? 1 : period === '15d' ? 0.6 : period === '7d' ? 0.3 : 0.1;
    
    return {
      activeClientsMeta: 12,
      activeClientsGoogle: 8,
      totalSpend: Math.floor(45680 * multiplier),
      leads: Math.floor(1240 * multiplier),
      avgCTR: 3.2 + (Math.random() * 0.5 - 0.25),
      avgCPL: 18.50 + (Math.random() * 3 - 1.5)
    };
  },

  async getChartData(period: string): Promise<ChartDataPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const days = period === '30d' ? 30 : period === '15d' ? 15 : period === '7d' ? 7 : 1;
    return generateChartData(days);
  },

  async getTopCreatives(): Promise<CreativePerformance[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockCreatives;
  },

  async getMetaAccounts(): Promise<MetaAccount[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMetaAccounts;
  },

  async getAutomationStats(): Promise<AutomationStats> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      whatsappSends: 2340,
      reportsSent: 156,
      leadsSynced: 1890
    };
  }
};