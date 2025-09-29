-- Adicionar novas colunas para separar ativo_meta e ativo_google
ALTER TABLE public.relatorio_config 
ADD COLUMN IF NOT EXISTS ativo_meta boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ativo_google boolean DEFAULT true;

-- Migrar dados existentes: se ativo era true, ambos ficam true
UPDATE public.relatorio_config 
SET ativo_meta = ativo, ativo_google = ativo
WHERE ativo_meta IS NULL OR ativo_google IS NULL;

-- Primeiro, dropar a view que depende da coluna ativo
DROP VIEW IF EXISTS public.relatorio_n8n_consolidated CASCADE;

-- Remover a coluna ativo
ALTER TABLE public.relatorio_config 
DROP COLUMN ativo;

-- Recriar a view sem a coluna ativo, usando ativo_meta e ativo_google
CREATE OR REPLACE VIEW public.relatorio_n8n_consolidated AS
SELECT 
    a.id as conta_id,
    a.nome_cliente as conta_nome,
    a.id_grupo,
    a.meta_account_id,
    a.google_ads_id,
    rc.ativo_meta,
    rc.ativo_google,
    rc.horario_disparo as horario_padrao,
    rc.dias_semana,
    rd_last.data_disparo::date as ultimo_envio,
    rd_last.status as ultimo_status,
    rd_last.mensagem_erro as ultimo_erro,
    a.email,
    a.telefone,
    a.canal_relatorio,
    a.webhook_meta,
    a.webhook_google,
    a.status as cliente_status,
    COALESCE(leads_30d.total_leads, 0) as total_leads_30d,
    COALESCE(leads_30d.leads_convertidos, 0) as leads_convertidos_30d,
    COALESCE(leads_30d.valor_conversoes, 0) as valor_conversoes_30d,
    a.notificacao_leads_diarios,
    a.notificacao_saldo_baixo,
    a.notificacao_erro_sync,
    rc.created_at as config_criado_em,
    rc.updated_at as config_atualizado_em
FROM public.accounts a
LEFT JOIN public.relatorio_config rc ON a.id = rc.client_id
LEFT JOIN (
    SELECT DISTINCT ON (client_id) 
        client_id, 
        data_disparo, 
        status, 
        mensagem_erro,
        created_at
    FROM public.relatorio_disparos
    ORDER BY client_id, created_at DESC
) rd_last ON a.id = rd_last.client_id
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'Convertido') as leads_convertidos,
        SUM(valor_conversao) FILTER (WHERE status = 'Convertido') as valor_conversoes
    FROM public.leads
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY client_id
) leads_30d ON a.id = leads_30d.client_id;