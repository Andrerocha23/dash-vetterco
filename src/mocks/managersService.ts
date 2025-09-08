// Managers Service - Manager performance and client assignments

export interface Manager {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  clientsCount: number;
  totalLeads: number;
  avgCPL: number;
  avgCTR: number;
  satisfaction: "excellent" | "good" | "average" | "poor";
  satisfactionScore: number;
  joinedAt: string;
  lastActivity: string;
}

export interface ManagerPerformance {
  managerId: string;
  period: string;
  metrics: {
    clients: number;
    leads: number;
    investment: number;
    cpl: number;
    ctr: number;
    satisfaction: number;
  };
  trends: {
    leads: { value: number; isPositive: boolean };
    cpl: { value: number; isPositive: boolean };
    ctr: { value: number; isPositive: boolean };
  };
}

const mockManagers: Manager[] = [
  {
    id: "manager-1",
    name: "Ana Silva",
    email: "ana.silva@metaflow.com",
    avatar: "/api/placeholder/80/80",
    clientsCount: 8,
    totalLeads: 1250,
    avgCPL: 42.50,
    avgCTR: 3.8,
    satisfaction: "excellent",
    satisfactionScore: 94,
    joinedAt: "2023-03-15",
    lastActivity: "2024-01-26T14:30:00"
  },
  {
    id: "manager-2",
    name: "Carlos Santos", 
    email: "carlos.santos@metaflow.com",
    avatar: "/api/placeholder/80/80",
    clientsCount: 6,
    totalLeads: 890,
    avgCPL: 48.30,
    avgCTR: 3.2,
    satisfaction: "good",
    satisfactionScore: 87,
    joinedAt: "2023-07-20",
    lastActivity: "2024-01-26T09:15:00"
  },
  {
    id: "manager-3",
    name: "Mariana Costa",
    email: "mariana.costa@metaflow.com", 
    avatar: "/api/placeholder/80/80",
    clientsCount: 5,
    totalLeads: 720,
    avgCPL: 39.80,
    avgCTR: 4.1,
    satisfaction: "excellent",
    satisfactionScore: 96,
    joinedAt: "2023-01-10",
    lastActivity: "2024-01-26T16:45:00"
  },
  {
    id: "manager-4",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@metaflow.com",
    avatar: "/api/placeholder/80/80", 
    clientsCount: 4,
    totalLeads: 580,
    avgCPL: 52.10,
    avgCTR: 2.9,
    satisfaction: "average",
    satisfactionScore: 78,
    joinedAt: "2023-11-05",
    lastActivity: "2024-01-25T18:20:00"
  }
];

class ManagersService {
  async getManagers(): Promise<Manager[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    return [...mockManagers];
  }

  async getManager(id: string): Promise<Manager | null> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockManagers.find(m => m.id === id) || null;
  }

  async getManagerPerformance(managerId: string, period: string): Promise<ManagerPerformance> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const manager = mockManagers.find(m => m.id === managerId);
    if (!manager) throw new Error('Manager not found');

    const multiplier = this.getPeriodMultiplier(period);

    return {
      managerId,
      period,
      metrics: {
        clients: manager.clientsCount,
        leads: Math.round(manager.totalLeads * multiplier),
        investment: Math.round(manager.totalLeads * manager.avgCPL * multiplier),
        cpl: manager.avgCPL,
        ctr: manager.avgCTR,
        satisfaction: manager.satisfactionScore
      },
      trends: {
        leads: { value: Math.random() * 20 - 5, isPositive: Math.random() > 0.3 },
        cpl: { value: Math.random() * 10 - 5, isPositive: Math.random() > 0.6 },
        ctr: { value: Math.random() * 2 - 1, isPositive: Math.random() > 0.4 }
      }
    };
  }

  async assignClientToManager(clientId: string, managerId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock assignment - in real app would update database
    console.log(`Assigned client ${clientId} to manager ${managerId}`);
  }

  async getUnassignedClients(): Promise<{id: string; name: string}[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock unassigned clients
    return [
      { id: "client-unassigned-1", name: "SportGear" },
      { id: "client-unassigned-2", name: "CoffeeShop" },
      { id: "client-unassigned-3", name: "BookStore" }
    ];
  }

  async updateManagerSatisfaction(managerId: string, score: number): Promise<Manager> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const manager = mockManagers.find(m => m.id === managerId);
    if (!manager) throw new Error('Manager not found');

    manager.satisfactionScore = score;
    
    if (score >= 90) manager.satisfaction = "excellent";
    else if (score >= 80) manager.satisfaction = "good"; 
    else if (score >= 70) manager.satisfaction = "average";
    else manager.satisfaction = "poor";

    return manager;
  }

  async getManagerRanking(): Promise<Manager[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [...mockManagers].sort((a, b) => {
      // Sort by satisfaction score, then by CTR, then by inverse CPL
      const satisfactionDiff = b.satisfactionScore - a.satisfactionScore;
      if (satisfactionDiff !== 0) return satisfactionDiff;
      
      const ctrDiff = b.avgCTR - a.avgCTR;
      if (ctrDiff !== 0) return ctrDiff;
      
      return a.avgCPL - b.avgCPL; // Lower CPL is better
    });
  }

  private getPeriodMultiplier(period: string): number {
    switch (period) {
      case "today": return 0.033;
      case "7d": return 0.23;
      case "15d": return 0.5;
      case "30d": return 1;
      default: return 1;
    }
  }
}

export const managersService = new ManagersService();