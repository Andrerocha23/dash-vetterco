export interface Client {
  id: string;
  name: string;
  manager: {
    name: string;
    avatar: string;
  };
  channels: ('Meta' | 'Google')[];
  status: 'Active' | 'Archived';
  createdOn: string;
  metaBalance: number;
  activeCampaigns: number;
  currentSpend: number;
  leads: number;
  ctr: number;
  cpl: number;
  hookRate: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Active' | 'Paused';
  dailyBudget: number;
  reach: number;
  impressions: number;
  linkClicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  leads: number;
  cpl: number;
}

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    manager: {
      name: 'Sarah Chen',
      avatar: '👩‍💼'
    },
    channels: ['Meta', 'Google'],
    status: 'Active',
    createdOn: '2024-01-15',
    metaBalance: 15420.50,
    activeCampaigns: 8,
    currentSpend: 2340.80,
    leads: 156,
    ctr: 3.2,
    cpl: 15.20,
    hookRate: 68.5
  },
  {
    id: '2',
    name: 'Urban Fitness Co',
    manager: {
      name: 'Marcus Johnson',
      avatar: '👨‍💼'
    },
    channels: ['Meta'],
    status: 'Active',
    createdOn: '2024-02-03',
    metaBalance: 8760.30,
    activeCampaigns: 4,
    currentSpend: 1820.40,
    leads: 89,
    ctr: 2.8,
    cpl: 20.45,
    hookRate: 72.1
  },
  {
    id: '3',
    name: 'EcoHome Supplies',
    manager: {
      name: 'Elena Rodriguez',
      avatar: '👩‍💼'
    },
    channels: ['Google'],
    status: 'Active',
    createdOn: '2024-01-28',
    metaBalance: 0,
    activeCampaigns: 3,
    currentSpend: 980.60,
    leads: 42,
    ctr: 4.1,
    cpl: 23.35,
    hookRate: 0
  },
  {
    id: '4',
    name: 'Digital Boost Agency',
    manager: {
      name: 'Alex Kim',
      avatar: '👨‍💼'
    },
    channels: ['Meta', 'Google'],
    status: 'Archived',
    createdOn: '2023-11-12',
    metaBalance: 2340.80,
    activeCampaigns: 0,
    currentSpend: 0,
    leads: 0,
    ctr: 0,
    cpl: 0,
    hookRate: 0
  }
];

const mockCampaigns: { [clientId: string]: Campaign[] } = {
  '1': [
    {
      id: 'c1',
      name: 'Q1 Product Launch',
      status: 'Active',
      dailyBudget: 250,
      reach: 45230,
      impressions: 120450,
      linkClicks: 3850,
      ctr: 3.2,
      cpm: 12.50,
      cpc: 0.85,
      leads: 78,
      cpl: 14.20
    },
    {
      id: 'c2',
      name: 'Brand Awareness Campaign',
      status: 'Active',
      dailyBudget: 180,
      reach: 38920,
      impressions: 89340,
      linkClicks: 2670,
      ctr: 2.99,
      cpm: 14.80,
      cpc: 0.92,
      leads: 45,
      cpl: 18.40
    }
  ],
  '2': [
    {
      id: 'c3',
      name: 'Summer Membership Drive',
      status: 'Active',
      dailyBudget: 120,
      reach: 28450,
      impressions: 67890,
      linkClicks: 1890,
      ctr: 2.78,
      cpm: 16.20,
      cpc: 1.15,
      leads: 34,
      cpl: 22.30
    }
  ]
};

// Service functions
export const clientsService = {
  async getClients(): Promise<Client[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockClients;
  },

  async getClient(id: string): Promise<Client | null> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockClients.find(client => client.id === id) || null;
  },

  async getCampaigns(clientId: string): Promise<Campaign[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockCampaigns[clientId] || [];
  },

  async create(clientData: any): Promise<Client> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: clientData.nomeCliente || 'New Client',
      manager: { name: 'Sarah Chen', avatar: '👩‍💼' },
      channels: clientData.canais || [],
      status: clientData.status === 'Ativo' ? 'Active' : 'Archived',
      createdOn: new Date().toISOString().split('T')[0],
      metaBalance: (clientData.saldoMeta || 0) / 100,
      activeCampaigns: 0,
      currentSpend: 0,
      leads: 0,
      ctr: 0,
      cpl: 0,
      hookRate: 0
    };
    
    mockClients.unshift(newClient); // Adiciona no topo
    return newClient;
  },

  async update(id: string, clientData: any): Promise<Client> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex === -1) throw new Error('Client not found');
    
    const updatedClient: Client = {
      ...mockClients[clientIndex],
      name: clientData.nomeCliente,
      channels: clientData.canais,
      status: clientData.status === 'Ativo' ? 'Active' : 'Archived',
      metaBalance: (clientData.saldoMeta || 0) / 100,
    };
    
    mockClients[clientIndex] = updatedClient;
    return updatedClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex === -1) throw new Error('Client not found');
    
    mockClients[clientIndex] = { ...mockClients[clientIndex], ...updates };
    return mockClients[clientIndex];
  },

  async archiveClient(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const client = mockClients.find(client => client.id === id);
    if (client) {
      client.status = 'Archived';
    }
  }
};