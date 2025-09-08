import { RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";

// Mock data
const mockRelatorios: RelatorioN8n[] = [
  {
    contaId: "cli_001",
    contaNome: "House Gestão",
    idGrupo: "120363042@g.us",
    canal: "WhatsApp",
    ativo: true,
    ultimoEnvio: "2024-01-15T09:00:00Z",
    horarioPadrao: "09:00"
  },
  {
    contaId: "cli_002", 
    contaNome: "Construtora Alpha",
    idGrupo: "120363043@g.us",
    canal: "Ambos",
    ativo: true,
    ultimoEnvio: "2024-01-15T08:30:00Z",
    horarioPadrao: "08:30"
  },
  {
    contaId: "cli_003",
    contaNome: "Imóveis Beta",
    idGrupo: "120363044@g.us", 
    canal: "Email",
    ativo: false,
    ultimoEnvio: "2024-01-10T09:15:00Z",
    horarioPadrao: "09:15"
  }
];

// Função para simular delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const n8nService = {
  async listRelatorios(filters: RelatorioFilters = {}): Promise<RelatorioN8n[]> {
    await delay(300);
    
    let filteredRelatorios = [...mockRelatorios];
    
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      filteredRelatorios = filteredRelatorios.filter(relatorio =>
        relatorio.contaNome.toLowerCase().includes(searchTerm) ||
        relatorio.idGrupo.includes(searchTerm)
      );
    }
    
    if (filters.status && filters.status !== "Todos") {
      const isAtivo = filters.status === "Ativo";
      filteredRelatorios = filteredRelatorios.filter(relatorio => relatorio.ativo === isAtivo);
    }
    
    return filteredRelatorios.sort((a, b) => a.contaNome.localeCompare(b.contaNome));
  },

  async updateRelatorio(contaId: string, payload: Partial<RelatorioN8n>): Promise<void> {
    await delay(400);
    
    const relatorioIndex = mockRelatorios.findIndex(rel => rel.contaId === contaId);
    if (relatorioIndex !== -1) {
      mockRelatorios[relatorioIndex] = {
        ...mockRelatorios[relatorioIndex],
        ...payload
      };
    }
  },

  async testarDisparo(contaId: string): Promise<{ ok: boolean; message: string }> {
    await delay(600);
    
    const relatorio = mockRelatorios.find(rel => rel.contaId === contaId);
    if (!relatorio) {
      return { ok: false, message: "Conta não encontrada" };
    }
    
    if (!relatorio.ativo) {
      return { ok: false, message: "Disparo inativo para esta conta" };
    }
    
    // Simular sucesso/erro aleatório
    const success = Math.random() > 0.2; // 80% de sucesso
    
    if (success) {
      return { 
        ok: true, 
        message: `Disparo teste enviado para ${relatorio.contaNome} via ${relatorio.canal}`
      };
    } else {
      return { 
        ok: false, 
        message: "Erro na comunicação com n8n. Tente novamente."
      };
    }
  },

  async configurarDisparo(contaId: string, payload: ConfigurarDisparoPayload): Promise<void> {
    await delay(500);
    
    const relatorioIndex = mockRelatorios.findIndex(rel => rel.contaId === contaId);
    if (relatorioIndex !== -1) {
      mockRelatorios[relatorioIndex] = {
        ...mockRelatorios[relatorioIndex],
        idGrupo: payload.idGrupo,
        canal: payload.canal,
        horarioPadrao: payload.horarioPadrao
      };
    }
  },

  async toggleAtivo(contaId: string): Promise<boolean> {
    await delay(200);
    
    const relatorioIndex = mockRelatorios.findIndex(rel => rel.contaId === contaId);
    if (relatorioIndex !== -1) {
      mockRelatorios[relatorioIndex].ativo = !mockRelatorios[relatorioIndex].ativo;
      return mockRelatorios[relatorioIndex].ativo;
    }
    return false;
  }
};