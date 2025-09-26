// src/pages/RelatorioN8n.tsx - MUDANÇA MÍNIMA: só trocar 'clients' → 'accounts'
// (manter todo o resto do layout igual)

// Encontre a função loadClientsData e substitua apenas esta parte:

const loadClientsData = async () => {
  try {
    setLoading(true);

    // 🔧 ÚNICA MUDANÇA: clients → accounts
    const { data: clientsData, error: clientsError } = await supabase
      .from('accounts') // ← MUDANÇA AQUI
      .select(`
        id,
        nome_cliente,
        nome_empresa,
        id_grupo,
        meta_account_id,
        google_ads_id,
        status
      `)
      .eq('status', 'Ativo')
      .order('nome_cliente');

    if (clientsError) throw clientsError;

    // Todo o resto permanece IGUAL
    // Buscar configurações de relatório
    const { data: configsData, error: configsError } = await supabase
      .from('relatorio_config')
      .select('*');

    if (configsError) throw configsError;

    // Buscar últimos disparos
    const { data: disparosData, error: disparosError } = await supabase
      .from('relatorio_disparos')
      .select('*')
      .order('data_disparo', { ascending: false });

    if (disparosError) throw disparosError;

    // Buscar stats dos clientes
    const { data: statsData, error: statsError } = await supabase
      .from('leads_stats')
      .select('client_id, total_leads, leads_convertidos');

    if (statsError) throw statsError;

    // Processar dados (TODO RESTO IGUAL)
    const processedClients: ClientReport[] = (clientsData || []).map(client => {
      const config = configsData?.find(c => c.client_id === client.id);
      const stats = statsData?.find(s => s.client_id === client.id);
      
      // Encontrar último disparo do cliente
      const ultimoDisparo = disparosData?.find(d => d.client_id === client.id);

      return {
        id: client.id,
        nome_cliente: client.nome_cliente,
        nome_empresa: client.nome_empresa,
        id_grupo: client.id_grupo,
        meta_account_id: client.meta_account_id,
        google_ads_id: client.google_ads_id,
        status: client.status,
        config: config ? {
          ativo: config.ativo || false,
          horario_disparo: config.horario_disparo,
          dias_semana: config.dias_semana || [1, 2, 3, 4, 5]
        } : undefined,
        ultimo_disparo: ultimoDisparo ? {
          data_disparo: ultimoDisparo.data_disparo,
          status: ultimoDisparo.status,
          mensagem_erro: ultimoDisparo.mensagem_erro
        } : undefined,
        stats: stats ? {
          total_leads: stats.total_leads || 0,
          leads_convertidos: stats.leads_convertidos || 0
        } : undefined
      };
    });

    setClients(processedClients);

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os dados dos relatórios",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};