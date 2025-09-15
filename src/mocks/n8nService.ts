import { RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";
import { supabase } from "@/integrations/supabase/client";

export const n8nService = {
  async listRelatorios(filters: RelatorioFilters = {}): Promise<RelatorioN8n[]> {
    // Query com JOIN para pegar dados completos
    const { data: results, error } = await supabase
      .from('clients')
      .select(`
        id,
        nome_cliente,
        nome_empresa,
        id_grupo,
        meta_account_id,
        google_ads_id,
        status,
        relatorio_config:relatorio_config!inner(
          ativo,
          horario_disparo
        ),
        relatorio_disparos!left(
          status,
          horario_disparo,
          data_disparo
        )
      `)
      .eq('status', 'Ativo')
      .eq('relatorio_disparos.data_disparo', new Date().toISOString().split('T')[0]);

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    let relatorios: RelatorioN8n[] = (results || []).map(client => {
      const config = Array.isArray(client.relatorio_config) ? client.relatorio_config[0] : client.relatorio_config;
      const disparo = Array.isArray(client.relatorio_disparos) ? client.relatorio_disparos[0] : client.relatorio_disparos;
      
      return {
        contaId: client.id,
        contaNome: client.nome_cliente,
        idGrupo: client.id_grupo || "",
        metaAccountId: client.meta_account_id || "",
        googleAdsId: client.google_ads_id || "",
        ativo: config?.ativo ?? false,
        ultimoEnvio: disparo?.horario_disparo || null,
        statusEnvio: disparo?.status || null,
        horarioPadrao: config?.horario_disparo || "09:00"
      };
    });

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

  async toggleAtivo(contaId: string): Promise<boolean> {
    // Primeiro, buscar o estado atual
    const { data: currentConfig, error: fetchError } = await supabase
      .from('relatorio_config')
      .select('ativo')
      .eq('client_id', contaId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current config: ${fetchError.message}`);
    }

    const novoStatus = !currentConfig.ativo;

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('relatorio_config')
      .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
      .eq('client_id', contaId);

    if (updateError) {
      throw new Error(`Failed to update config: ${updateError.message}`);
    }

    return novoStatus;
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
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        id_grupo: payload.idGrupo,
      })
      .eq('id', contaId);

    if (clientError) {
      throw new Error(`Failed to update client: ${clientError.message}`);
    }

    // Atualizar horário na configuração
    const { error: configError } = await supabase
      .from('relatorio_config')
      .update({
        horario_disparo: payload.horarioPadrao,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', contaId);

    if (configError) {
      throw new Error(`Failed to update config: ${configError.message}`);
    }
  }
};