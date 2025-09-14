// SUBSTITUA o método getClients() no seu clientsService.ts existente

async getClients(): Promise<ClientWithManager[]> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      manager:managers!clients_gestor_id_fkey (
        id,
        name,
        email,
        avatar_url,
        department
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(`Failed to fetch clients: ${error.message}`);
  }

  // Transform data to match the expected format
  return (data || []).map(client => ({
    id: client.id,
    name: client.nome_cliente,
    manager: {
      id: client.manager?.id || '',
      name: client.manager?.name || 'Gestor não encontrado',
      avatar_url: client.manager?.avatar_url,
      email: client.manager?.email
    },
    channels: client.canais as ('Meta' | 'Google')[],
    status: client.status === 'Ativo' ? 'Active' : 
            client.status === 'Pausado' ? 'Paused' : 'Archived',
    activeCampaigns: Math.floor(Math.random() * 10) + 1, // Random for demo
    metaBalance: (client.saldo_meta || 0) / 100,
    createdOn: client.created_at,
    rawData: client
  }));
},

// SUBSTITUA também o método create() para usar gestores reais

async create(clientData: ClienteFormData): Promise<ClientWithManager> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      nome_cliente: clientData.nomeCliente,
      nome_empresa: clientData.nomeEmpresa,
      telefone: clientData.telefone,
      email: clientData.email,
      gestor_id: clientData.gestorId, // Agora é UUID do gestor real
      canais: clientData.canais,
      status: clientData.status,
      observacoes: clientData.observacoes,
      usa_meta_ads: clientData.usaMetaAds,
      usa_google_ads: clientData.usaGoogleAds,
      traqueamento_ativo: clientData.traqueamentoAtivo,
      saldo_meta: clientData.saldoMeta ? clientData.saldoMeta * 100 : null,
      budget_mensal_meta: clientData.budgetMensalMeta,
      budget_mensal_google: clientData.budgetMensalGoogle,
    })
    .select(`
      *,
      manager:managers!clients_gestor_id_fkey (
        id,
        name,
        email,
        avatar_url,
        department
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  // Transform and return in expected format
  return {
    id: data.id,
    name: data.nome_cliente,
    manager: {
      id: data.manager?.id || '',
      name: data.manager?.name || 'Gestor não encontrado',
      avatar_url: data.manager?.avatar_url,
      email: data.manager?.email
    },
    channels: data.canais as ('Meta' | 'Google')[],
    status: data.status === 'Ativo' ? 'Active' : 
            data.status === 'Pausado' ? 'Paused' : 'Archived',
    activeCampaigns: Math.floor(Math.random() * 10) + 1,
    metaBalance: (data.saldo_meta || 0) / 100,
    createdOn: data.created_at,
    rawData: data
  };
},
