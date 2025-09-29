import { RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";
import { supabase } from "@/integrations/supabase/client";

export const n8nService = {
  async listRelatorios(filters: RelatorioFilters = {}): Promise<RelatorioN8n[]> {
    try {
      // Query simples - sem joins complexos
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, nome_cliente, id_grupo, meta_account_id, google_ads_id, status')
        .eq('status', 'Ativo')
        .order('nome_cliente');

      if (accountsError) {
        throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
      }

      // Buscar configurações separadamente
      const { data: configsData } = await supabase
        .from('relatorio_config')
        .select('client_id, ativo_meta, ativo_google, horario_disparo');

      // Buscar últimos disparos separadamente
      const { data: disparosData } = await supabase
        .from('relatorio_disparos')
        .select('client_id, horario_disparo, data_disparo')
        .order('data_disparo', { ascending: false });

      // Processar dados
      let relatorios: RelatorioN8n[] = (accountsData || []).map(account => {
        // Encontrar config desta conta
        const config = configsData?.find(c => c.client_id === account.id);
        
        // Encontrar último disparo desta conta
        const ultimoDisparo = disparosData?.find(d => d.client_id === account.id);
        
        return {
          contaId: account.id,
          contaNome: account.nome_cliente,
          idGrupo: account.id_grupo || "",
          metaAccountId: account.meta_account_id || "",
          googleAdsId: account.google_ads_id || "",
          ativoMeta: config?.ativo_meta || false,
          ativoGoogle: config?.ativo_google || false,
          ultimoEnvio: ultimoDisparo?.data_disparo || null,
          horarioPadrao: config?.horario_disparo?.slice(0, 5) || "09:00"
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
        relatorios = relatorios.filter(relatorio => 
          relatorio.ativoMeta === isAtivo || relatorio.ativoGoogle === isAtivo
        );
      }
      
      return relatorios;
      
    } catch (error) {
      console.error('Erro em listRelatorios:', error);
      throw error;
    }
  },

  async toggleAtivoMeta(contaId: string): Promise<boolean> {
    try {
      // Buscar configuração atual
      const { data: currentConfig, error: fetchError } = await supabase
        .from('relatorio_config')
        .select('ativo_meta')
        .eq('client_id', contaId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch current config: ${fetchError.message}`);
      }

      const novoStatus = !currentConfig?.ativo_meta;

      if (currentConfig) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('relatorio_config')
          .update({ ativo_meta: novoStatus, updated_at: new Date().toISOString() })
          .eq('client_id', contaId);

        if (updateError) {
          throw new Error(`Failed to update config: ${updateError.message}`);
        }
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabase
          .from('relatorio_config')
          .insert({
            client_id: contaId,
            ativo_meta: novoStatus,
            ativo_google: true,
            horario_disparo: '09:00:00'
          });

        if (insertError) {
          throw new Error(`Failed to create config: ${insertError.message}`);
        }
      }

      return novoStatus;
      
    } catch (error) {
      console.error('Erro em toggleAtivoMeta:', error);
      throw error;
    }
  },

  async toggleAtivoGoogle(contaId: string): Promise<boolean> {
    try {
      // Buscar configuração atual
      const { data: currentConfig, error: fetchError } = await supabase
        .from('relatorio_config')
        .select('ativo_google')
        .eq('client_id', contaId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch current config: ${fetchError.message}`);
      }

      const novoStatus = !currentConfig?.ativo_google;

      if (currentConfig) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('relatorio_config')
          .update({ ativo_google: novoStatus, updated_at: new Date().toISOString() })
          .eq('client_id', contaId);

        if (updateError) {
          throw new Error(`Failed to update config: ${updateError.message}`);
        }
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabase
          .from('relatorio_config')
          .insert({
            client_id: contaId,
            ativo_meta: true,
            ativo_google: novoStatus,
            horario_disparo: '09:00:00'
          });

        if (insertError) {
          throw new Error(`Failed to create config: ${insertError.message}`);
        }
      }

      return novoStatus;
      
    } catch (error) {
      console.error('Erro em toggleAtivoGoogle:', error);
      throw error;
    }
  },

  async testarDisparo(contaId: string): Promise<{ ok: boolean; message: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
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
    } catch (error) {
      console.error('Erro em testarDisparo:', error);
      return { 
        ok: false, 
        message: "Erro interno. Tente novamente."
      };
    }
  },

  async configurarDisparo(contaId: string, payload: ConfigurarDisparoPayload): Promise<void> {
    try {
      // Atualizar id_grupo na conta
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

      // Verificar se configuração existe
      const { data: existingConfig } = await supabase
        .from('relatorio_config')
        .select('id')
        .eq('client_id', contaId)
        .single();

      if (existingConfig) {
        // Atualizar configuração existente
        const { error: configError } = await supabase
          .from('relatorio_config')
          .update({
            horario_disparo: payload.horarioPadrao + ':00',
            updated_at: new Date().toISOString()
          })
          .eq('client_id', contaId);

        if (configError) {
          throw new Error(`Failed to update config: ${configError.message}`);
        }
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabase
          .from('relatorio_config')
          .insert({
            client_id: contaId,
            horario_disparo: payload.horarioPadrao + ':00',
            ativo_meta: true,
            ativo_google: true
          });

        if (insertError) {
          throw new Error(`Failed to create config: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.error('Erro em configurarDisparo:', error);
      throw error;
    }
  }
};