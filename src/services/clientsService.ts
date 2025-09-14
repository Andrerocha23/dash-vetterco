// SUBSTITUA o método create() no seu clientsService.ts por este:

async create(clientData: ClienteFormData): Promise<any> {
  console.log('🔍 Dados do cliente para salvar:', clientData);
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      // Informações Básicas
      nome_cliente: clientData.nomeCliente,
      nome_empresa: clientData.nomeEmpresa,
      telefone: clientData.telefone,
      email: clientData.email,
      gestor_id: clientData.gestorId,
      canais: clientData.canais,
      status: clientData.status,
      observacoes: clientData.observacoes,
      id_grupo: clientData.idGrupo, // ← ESTA LINHA ESTAVA FALTANDO!
      usa_crm_externo: clientData.usaCrmExterno,
      url_crm: clientData.urlCrm,

      // Meta Ads
      usa_meta_ads: clientData.usaMetaAds,
      ativar_campanhas_meta: clientData.ativarCampanhasMeta,
      meta_account_id: clientData.metaAccountId,
      meta_business_id: clientData.metaBusinessId,
      meta_page_id: clientData.metaPageId,
      modo_saldo_meta: clientData.modoSaldoMeta,
      monitorar_saldo_meta: clientData.monitorarSaldoMeta,
      saldo_meta: clientData.saldoMeta ? clientData.saldoMeta * 100 : null, // Converter para centavos
      alerta_saldo_baixo: clientData.alertaSaldoBaixo ? clientData.alertaSaldoBaixo * 100 : null,
      budget_mensal_meta: clientData.budgetMensalMeta,
      link_meta: clientData.linkMeta,
      utm_padrao: clientData.utmPadrao,
      webhook_meta: clientData.webhookMeta,

      // Google Ads
      usa_google_ads: clientData.usaGoogleAds,
      google_ads_id: clientData.googleAdsId,
      budget_mensal_google: clientData.budgetMensalGoogle,
      conversoes: clientData.conversoes,
      link_google: clientData.linkGoogle,
      webhook_google: clientData.webhookGoogle,

      // Comunicação & Automação
      canal_relatorio: clientData.canalRelatorio,
      horario_relatorio: clientData.horarioRelatorio,
      templates_padrao: clientData.templatesPadrao,
      notificacao_saldo_baixo: clientData.notificacaoSaldoBaixo,
      notificacao_erro_sync: clientData.notificacaoErroSync,
      notificacao_leads_diarios: clientData.notificacaoLeadsDiarios,

      // Rastreamento & Analytics
      traqueamento_ativo: clientData.traqueamentoAtivo,
      pixel_meta: clientData.pixelMeta,
      ga4_stream_id: clientData.ga4StreamId,
      gtm_id: clientData.gtmId,
      typebot_ativo: clientData.typebotAtivo,
      typebot_url: clientData.typebotUrl,

      // Financeiro & Orçamento
      budget_mensal_global: clientData.budgetMensalGlobal,
      forma_pagamento: clientData.formaPagamento,
      centro_custo: clientData.centroCusto,
      contrato_inicio: clientData.contratoInicio,
      contrato_renovacao: clientData.contratoRenovacao,

      // Permissões & Atribuições
      papel_padrao: clientData.papelPadrao,
      usuarios_vinculados: clientData.usuariosVinculados,
      ocultar_ranking: clientData.ocultarRanking,
      somar_metricas: clientData.somarMetricas,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar cliente:', error);
    throw new Error(`Failed to create client: ${error.message}`);
  }

  console.log('✅ Cliente criado com sucesso:', data);

  // Transform and return in expected format
  return {
    id: data.id,
    name: data.nome_cliente,
    manager: { id: data.gestor_id, name: 'Gestor', avatar: '👨‍💼' }, // Temporário
    channels: data.canais as ('Meta' | 'Google')[],
    status: data.status === 'Ativo' ? 'Active' : 
            data.status === 'Pausado' ? 'Paused' : 'Archived',
    activeCampaigns: Math.floor(Math.random() * 10) + 1,
    metaBalance: (data.saldo_meta || 0) / 100,
    createdOn: data.created_at,
    rawData: data
  };
},

// TAMBÉM ATUALIZE o método update() para incluir id_grupo:

async update(id: string, clientData: ClienteFormData): Promise<void> {
  console.log('🔍 Atualizando cliente:', id, clientData);
  
  const { error } = await supabase
    .from('clients')
    .update({
      // Informações Básicas
      nome_cliente: clientData.nomeCliente,
      nome_empresa: clientData.nomeEmpresa,
      telefone: clientData.telefone,
      email: clientData.email,
      gestor_id: clientData.gestorId,
      canais: clientData.canais,
      status: clientData.status,
      observacoes: clientData.observacoes,
      id_grupo: clientData.idGrupo, // ← ESTA LINHA TAMBÉM ESTAVA FALTANDO!
      usa_crm_externo: clientData.usaCrmExterno,
      url_crm: clientData.urlCrm,

      // Meta Ads
      usa_meta_ads: clientData.usaMetaAds,
      ativar_campanhas_meta: clientData.ativarCampanhasMeta,
      meta_account_id: clientData.metaAccountId,
      meta_business_id: clientData.metaBusinessId,
      meta_page_id: clientData.metaPageId,
      modo_saldo_meta: clientData.modoSaldoMeta,
      monitorar_saldo_meta: clientData.monitorarSaldoMeta,
      saldo_meta: clientData.saldoMeta ? clientData.saldoMeta * 100 : null,
      alerta_saldo_baixo: clientData.alertaSaldoBaixo ? clientData.alertaSaldoBaixo * 100 : null,
      budget_mensal_meta: clientData.budgetMensalMeta,
      link_meta: clientData.linkMeta,
      utm_padrao: clientData.utmPadrao,
      webhook_meta: clientData.webhookMeta,

      // Google Ads
      usa_google_ads: clientData.usaGoogleAds,
      google_ads_id: clientData.googleAdsId,
      budget_mensal_google: clientData.budgetMensalGoogle,
      conversoes: clientData.conversoes,
      link_google: clientData.linkGoogle,
      webhook_google: clientData.webhookGoogle,

      // Comunicação & Automação
      canal_relatorio: clientData.canalRelatorio,
      horario_relatorio: clientData.horarioRelatorio,
      templates_padrao: clientData.templatesPadrao,
      notificacao_saldo_baixo: clientData.notificacaoSaldoBaixo,
      notificacao_erro_sync: clientData.notificacaoErroSync,
      notificacao_leads_diarios: clientData.notificacaoLeadsDiarios,

      // Rastreamento & Analytics
      traqueamento_ativo: clientData.traqueamentoAtivo,
      pixel_meta: clientData.pixelMeta,
      ga4_stream_id: clientData.ga4StreamId,
      gtm_id: clientData.gtmId,
      typebot_ativo: clientData.typebotAtivo,
      typebot_url: clientData.typebotUrl,

      // Financeiro & Orçamento
      budget_mensal_global: clientData.budgetMensalGlobal,
      forma_pagamento: clientData.formaPagamento,
      centro_custo: clientData.centroCusto,
      contrato_inicio: clientData.contratoInicio,
      contrato_renovacao: clientData.contratoRenovacao,

      // Permissões & Atribuições
      papel_padrao: clientData.papelPadrao,
      usuarios_vinculados: clientData.usuariosVinculados,
      ocultar_ranking: clientData.ocultarRanking,
      somar_metricas: clientData.somarMetricas,

      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    throw new Error(`Failed to update client: ${error.message}`);
  }

  console.log('✅ Cliente atualizado com sucesso');
},