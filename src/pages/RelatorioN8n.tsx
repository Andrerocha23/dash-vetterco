// src/mocks/n8nService.ts - Atualizado para usar 'accounts'
import { RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";
import { supabase } from "@/integrations/supabase/accounts";

export const n8nService = {
  async listRelatorios(filters: RelatorioFilters = {}): Promise<RelatorioN8n[]> {
    // Query atualizada para usar 'accounts'
    const { data: results, error } = await supabase
      .from('accounts') // Mudança aqui: clients → accounts
      .select(`
        id,
        nome_cliente,
        nome_empresa,
        id_grupo,
        meta_account_id,
        google_ads_id,
        status,
        relatorio_config!inner(
          ativo,
          horario_disparo
        )
      `)
      .eq('status', 'Ativo')
      .order('nome_cliente');

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    // Buscar último disparo separadamente para evitar problemas de JOIN
    const { data: ultimosDisparos } = await supabase
      .from('relatorio_disparos')
      .select('client_id, horario_disparo, status')
      .order('horario_disparo', { ascending: false });

    // Criar mapa dos últimos disparos por conta
    const disparosMap = new Map();
    ultimosDisparos?.forEach(disparo => {
      if (!disparosMap.has(disparo.client_id)) {
        disparosMap.set(disparo.client_id, disparo);
      }
    });

    let relatorios: RelatorioN8n[] = (results || []).map(account => {
      const config = Array.isArray(account.relatorio_config) ? 
        account.relatorio_config[0] : account.relatorio_config;
      const ultimoDisparo = disparosMap.get(account.id);
      
      return {
        contaId: account.id,
        contaNome: account.nome_cliente,
        idGrupo: account.id_grupo || "",
        metaAccountId: account.meta_account_id || "",
        googleAdsId: account.google_ads_id || "",
        ativo: config?.ativo ?? true,
        ultimoEnvio: ultimoDisparo?.horario_disparo || null,
        horarioPadrao: config?.horario_disparo?.toString().slice(0, 5) || "09:00"
      };
    });

    // Aplicar filtros
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      relatorios = relatorios.filter(relatorio =>
        relatorio.contaNome.toLowerCase().includes(searchTerm) ||
        relatorio.idGrupo.toLowerCase().includes(searchTerm) ||
        (relatorio.metaAccountId && relatorio.metaAccountId.toLowerCase().includes(searchTerm)) ||
        (relatorio.googleAdsId && relatorio.googleAdsId.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.status && filters.status !== "Todos") {
      const isAtivo = filters.status === "Ativo";
      relatorios = relatorios.filter(relatorio => relatorio.ativo === isAtivo);
    }
    
    return relatorios;
  },

  async toggleAtivo(contaId: string): Promise<boolean> {
    // Primeiro, buscar o estado atual
    const { data: currentConfig, error: fetchError } = await supabase
      .from('relatorio_config')
      .select('ativo')
      .eq('client_id', contaId) // Mantém client_id pois é FK
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current config: ${fetchError.message}`);
    }

    const novoStatus = !currentConfig.ativo;

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('relatorio_config')
      .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
      .eq('client_id', contaId); // Mantém client_id pois é FK

    if (updateError) {
      throw new Error(`Failed to update config: ${updateError.message}`);
    }

    return novoStatus;
  },

  async testarDisparo(contaId: string): Promise<{ ok: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mudança aqui: buscar da tabela 'accounts'
    const { data: account } = await supabase
      .from('accounts')
      .select('nome_cliente')
      .eq('id', contaId)
      .single();
    
    if (!account) {
      return { ok: false, message: "Conta não encontrada" };
    }
    
    const success = Math.random() > 0.2; // 80% de sucesso
    
    if (success) {
      return { 
        ok: true, 
        message: `Disparo teste enviado para ${account.nome_cliente}`
      };
    } else {
      return { 
        ok: false, 
        message: "Erro na comunicação com n8n. Tente novamente."
      };
    }
  },

  async configurarDisparo(contaId: string, payload: ConfigurarDisparoPayload): Promise<void> {
    // Atualizar o id_grupo na tabela accounts (não mais clients)
    const { error: accountError } = await supabase
      .from('accounts')
      .update({
        id_grupo: payload.idGrupo,
        updated_at: new Date().toISOString()
      })
      .eq('id', contaId);

    if (accountError) {
      throw new Error(`Failed to update account: ${accountError.message}`);
    }

    // Atualizar horário na configuração - verificar se existe primeiro
    const { data: existingConfig } = await supabase
      .from('relatorio_config')
      .select('id')
      .eq('client_id', contaId) // Mantém client_id pois é FK
      .single();

    if (existingConfig) {
      // Atualizar configuração existente
      const { error: configError } = await supabase
        .from('relatorio_config')
        .update({
          horario_disparo: payload.horarioPadrao + ':00',
          updated_at: new Date().toISOString()
        })
        .eq('client_id', contaId); // Mantém client_id pois é FK

      if (configError) {
        throw new Error(`Failed to update config: ${configError.message}`);
      }
    } else {
      // Criar nova configuração se não existir
      const { error: insertError } = await supabase
        .from('relatorio_config')
        .insert({
          client_id: contaId, // Mantém client_id pois é FK
          horario_disparo: payload.horarioPadrao + ':00',
          ativo: true
        });

      if (insertError) {
        throw new Error(`Failed to create config: ${insertError.message}`);
      }
    }
  }
};