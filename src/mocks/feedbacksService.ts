import { Lead, LeadFilters, FeedbackPayload, LeadStatus, Origem } from "@/types/feedback";

// Mock data
const mockLeads: Lead[] = [
  {
    id: "lead_001",
    contaId: "cli_001",
    nome: "João Silva",
    telefone: "(11) 99999-1111",
    email: "joao@email.com",
    origem: "Meta",
    campanha: "Campanha Imóveis Q4",
    criadoEm: "2024-01-15T09:30:00Z",
    responsavelId: "usr_002",
    status: "Qualificado",
    feedback: {
      status: "Qualificado",
      etapa: "Contato",
      nota: 4,
      tags: ["Urgente", "VIP"],
      comentario: "Cliente interessado em apartamento na Zona Sul",
      anexos: ["contrato_preliminar.pdf"],
      atualizadoEm: "2024-01-15T14:30:00Z",
      atualizadoPor: "usr_002"
    }
  },
  {
    id: "lead_002",
    contaId: "cli_001",
    nome: "Maria Santos",
    telefone: "(11) 99999-2222",
    email: "maria@email.com",
    origem: "Google",
    campanha: "Busca - Casa Própria",
    criadoEm: "2024-01-14T16:45:00Z",
    responsavelId: "usr_003",
    status: "Desqualificado",
    feedback: {
      status: "Desqualificado",
      motivo: ["Fora do perfil", "Preço"],
      etapa: "Novo",
      nota: 2,
      tags: ["Recontato"],
      comentario: "Orçamento muito baixo para região desejada",
      anexos: [],
      atualizadoEm: "2024-01-14T17:30:00Z",
      atualizadoPor: "usr_003"
    }
  },
  {
    id: "lead_003",
    contaId: "cli_002",
    nome: "Carlos Oliveira",
    telefone: "(11) 99999-3333",
    email: "carlos@email.com",
    origem: "Orgânico",
    campanha: "—",
    criadoEm: "2024-01-13T11:20:00Z",
    status: "Pendente"
  },
  {
    id: "lead_004",
    contaId: "cli_001",
    nome: "Ana Costa",
    telefone: "(11) 99999-4444",
    email: "ana@email.com",
    origem: "Meta",
    campanha: "Lançamento Torres",
    criadoEm: "2024-01-12T08:15:00Z",
    responsavelId: "usr_002",
    status: "Convertido",
    feedback: {
      status: "Convertido",
      etapa: "Proposta",
      nota: 5,
      tags: ["VIP"],
      comentario: "Fechou apartamento de 3 quartos",
      anexos: ["contrato_final.pdf", "vistoria.pdf"],
      atualizadoEm: "2024-01-12T15:45:00Z",
      atualizadoPor: "usr_002"
    }
  }
];

// Função para simular delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const feedbacksService = {
  async listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    await delay(300);
    
    let filteredLeads = [...mockLeads];
    
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.nome.toLowerCase().includes(searchTerm) ||
        lead.telefone?.includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.contaId) {
      filteredLeads = filteredLeads.filter(lead => lead.contaId === filters.contaId);
    }
    
    if (filters.status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
    }
    
    if (filters.origem) {
      filteredLeads = filteredLeads.filter(lead => lead.origem === filters.origem);
    }
    
    if (filters.responsavelId) {
      filteredLeads = filteredLeads.filter(lead => lead.responsavelId === filters.responsavelId);
    }
    
    return filteredLeads.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  },

  async getLead(id: string): Promise<Lead | null> {
    await delay(200);
    return mockLeads.find(lead => lead.id === id) || null;
  },

  async updateFeedback(id: string, payload: FeedbackPayload): Promise<void> {
    await delay(400);
    
    const leadIndex = mockLeads.findIndex(lead => lead.id === id);
    if (leadIndex !== -1) {
      const lead = mockLeads[leadIndex];
      lead.status = payload.status;
      lead.feedback = {
        ...payload,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: "current_user_id" // Mock current user
      };
    }
  },

  async exportCsv(filters: LeadFilters = {}): Promise<string> {
    await delay(500);
    const leads = await this.listLeads(filters);
    
    // Simular geração de CSV
    const csvHeader = "Nome,Telefone,Email,Origem,Campanha,Status,Criado Em";
    const csvRows = leads.map(lead => 
      `${lead.nome},${lead.telefone || ""},${lead.email || ""},${lead.origem},${lead.campanha || ""},${lead.status},${lead.criadoEm}`
    );
    
    return [csvHeader, ...csvRows].join('\n');
  },

  async getLeadStats(filters: LeadFilters = {}) {
    await delay(250);
    const leads = await this.listLeads(filters);
    
    return {
      total: leads.length,
      qualificados: leads.filter(l => l.status === "Qualificado").length,
      desqualificados: leads.filter(l => l.status === "Desqualificado").length,
      convertidos: leads.filter(l => l.status === "Convertido").length,
      pendentes: leads.filter(l => l.status === "Pendente").length
    };
  }
};