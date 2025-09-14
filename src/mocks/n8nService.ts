import { RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";
import { supabase } from "@/integrations/supabase/client";

export const n8nService = {
  async listRelatorios(filters: RelatorioFilters = {}): Promise<RelatorioN8n[]> {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, nome_cliente, nome_empresa, id_grupo, meta_account_id, google_ads_id, status')
      .eq('status', 'Ativo');

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    let relatorios: RelatorioN8n[] = (clients || []).map(client => ({
      contaId: client.id,
      contaNome: client.nome_cliente,
      idGrupo: client.id_grupo || "",
      metaAccountId: client.meta_account_id || "",
      googleAdsId: client.google_ads_id || "",
      ativo: true, // Por padrão ativo
      ultimoEnvio: null,
      horarioPadrao: "09:00"
    }));

    // Aplicar filtros
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      relatorios = relatorios.filter(relatorio =>
        relatorio.contaNome.toLowerCase().includes(searchTerm) ||
        relatorio.idGrupo.includes(searchTerm) ||
        (relatorio.metaAccountId && relatorio.metaAccountId.includes(searchTerm)) ||
        (relatorio.googleAdsId && relatorio.googleAdsId.includes(searchTerm))
      );
    }
    
    if (filters.status && filters.status !== "Todos") {
      const isAtivo = filters.status === "Ativo";
      relatorios = relatorios.filter(relatorio => relatorio.ativo === isAtivo);
    }
    
    return relatorios.sort((a, b) => a.contaNome.localeCompare(b.contaNome));
  },

  async updateRelatorio(contaId: string, payload: Partial<RelatorioN8n>): Promise<void> {
    // Para este mock, não fazemos nada por enquanto
    // Em uma implementação real, atualizaríamos uma tabela de configurações n8n
    await new Promise(resolve => setTimeout(resolve, 400));
  },

  async testarDisparo(contaId: string): Promise<{ ok: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const { data: client } = await supabase
      .from('clients')
      .select('nome_cliente')
      .eq('id', contaId)
      .single();
    
    if (!client) {
      return { ok: false, message: "Conta não encontrada" };
    }
    
    // Simular sucesso/erro aleatório
    const success = Math.random() > 0.2; // 80% de sucesso
    
    if (success) {
      return { 
        ok: true, 
        message: `Disparo teste enviado para ${client.nome_cliente}`
      };
    } else {
      return { 
        ok: false, 
        message: "Erro na comunicação com n8n. Tente novamente."
      };
    }
  },

  async configurarDisparo(contaId: string, payload: ConfigurarDisparoPayload): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Atualizar o id_grupo na tabela clients
    const { error } = await supabase
      .from('clients')
      .update({
        id_grupo: payload.idGrupo,
        // horario_relatorio poderia ser adicionado à tabela se necessário
      })
      .eq('id', contaId);

    if (error) {
      throw new Error(`Failed to update client configuration: ${error.message}`);
    }
  },

  async toggleAtivo(contaId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Para este mock, sempre retorna o oposto do estado atual
    // Em uma implementação real, isso seria armazenado em uma tabela de configurações
    return Math.random() > 0.5;
  }
};