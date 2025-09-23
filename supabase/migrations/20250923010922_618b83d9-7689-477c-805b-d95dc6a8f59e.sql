-- Criar view consolidada para relatórios N8N
CREATE OR REPLACE VIEW public.relatorio_n8n_consolidated AS
SELECT 
    c.id as conta_id,
    c.nome_cliente as conta_nome,
    c.id_grupo,
    c.meta_account_id,
    c.google_ads_id,
    rc.ativo,
    rc.horario_disparo as horario_padrao,
    rc.dias_semana,
    rd.horario_disparo as ultimo_envio,
    rd.status as ultimo_status,
    rd.mensagem_erro as ultimo_erro,
    -- Informações adicionais do cliente
    c.email,
    c.telefone,
    c.canal_relatorio,
    c.webhook_meta,
    c.webhook_google,
    c.status as cliente_status,
    -- Estatísticas básicas dos últimos 30 dias
    COALESCE(ls.total_leads, 0) as total_leads_30d,
    COALESCE(ls.leads_convertidos, 0) as leads_convertidos_30d,
    COALESCE(ls.valor_total_conversoes, 0) as valor_conversoes_30d,
    -- Configurações de notificação
    c.notificacao_leads_diarios,
    c.notificacao_saldo_baixo,
    c.notificacao_erro_sync,
    -- Timestamps
    rc.created_at as config_criado_em,
    rc.updated_at as config_atualizado_em
FROM 
    public.clients c
LEFT JOIN 
    public.relatorio_config rc ON c.id = rc.client_id
LEFT JOIN 
    public.relatorio_disparos rd ON c.id = rd.client_id 
    AND rd.data_disparo = (
        SELECT MAX(data_disparo) 
        FROM public.relatorio_disparos rd2 
        WHERE rd2.client_id = c.id
    )
LEFT JOIN 
    public.leads_stats ls ON c.id = ls.client_id
WHERE 
    c.status = 'Ativo';

-- Garantir que a view tenha RLS desabilitada para permitir acesso do n8n
ALTER VIEW public.relatorio_n8n_consolidated OWNER TO postgres;

-- Criar função para o n8n acessar os dados consolidados
CREATE OR REPLACE FUNCTION public.get_relatorio_n8n_data(
    client_id_param uuid DEFAULT NULL,
    only_active boolean DEFAULT true
)
RETURNS TABLE (
    conta_id uuid,
    conta_nome text,
    id_grupo text,
    meta_account_id text,
    google_ads_id text,
    ativo boolean,
    horario_padrao time,
    dias_semana integer[],
    ultimo_envio timestamp with time zone,
    ultimo_status text,
    ultimo_erro text,
    email text,
    telefone text,
    canal_relatorio text,
    webhook_meta text,
    webhook_google text,
    cliente_status text,
    total_leads_30d bigint,
    leads_convertidos_30d bigint,
    valor_conversoes_30d numeric,
    notificacao_leads_diarios boolean,
    notificacao_saldo_baixo boolean,
    notificacao_erro_sync boolean,
    config_criado_em timestamp with time zone,
    config_atualizado_em timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        r.conta_id,
        r.conta_nome,
        r.id_grupo,
        r.meta_account_id,
        r.google_ads_id,
        r.ativo,
        r.horario_padrao,
        r.dias_semana,
        r.ultimo_envio,
        r.ultimo_status,
        r.ultimo_erro,
        r.email,
        r.telefone,
        r.canal_relatorio,
        r.webhook_meta,
        r.webhook_google,
        r.cliente_status,
        r.total_leads_30d,
        r.leads_convertidos_30d,
        r.valor_conversoes_30d,
        r.notificacao_leads_diarios,
        r.notificacao_saldo_baixo,
        r.notificacao_erro_sync,
        r.config_criado_em,
        r.config_atualizado_em
    FROM public.relatorio_n8n_consolidated r
    WHERE 
        (client_id_param IS NULL OR r.conta_id = client_id_param)
        AND (only_active = false OR r.ativo = true);
$$;