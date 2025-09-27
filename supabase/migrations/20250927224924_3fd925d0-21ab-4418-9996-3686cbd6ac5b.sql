-- Drop and recreate the view with all necessary fields including ultimo_envio
DROP VIEW IF EXISTS public.relatorio_n8n_consolidated;

CREATE VIEW public.relatorio_n8n_consolidated AS
SELECT 
    a.id as conta_id,
    a.nome_cliente as conta_nome,
    a.id_grupo,
    a.meta_account_id,
    a.google_ads_id,
    a.status as cliente_status,
    a.email,
    a.telefone,
    a.canal_relatorio,
    a.webhook_meta,
    a.webhook_google,
    COALESCE(rc.ativo, false) as ativo,
    COALESCE(rc.horario_disparo, '09:00:00'::time) as horario_padrao,
    COALESCE(rc.dias_semana, ARRAY[1,2,3,4,5]) as dias_semana,
    rd.data_disparo as ultimo_envio,
    rd.status as ultimo_status,
    rd.mensagem_erro as ultimo_erro,
    0::bigint as total_leads_30d,
    0::bigint as leads_convertidos_30d,
    0::numeric as valor_conversoes_30d,
    COALESCE(a.notificacao_leads_diarios, false) as notificacao_leads_diarios,
    COALESCE(a.notificacao_saldo_baixo, false) as notificacao_saldo_baixo,
    COALESCE(a.notificacao_erro_sync, false) as notificacao_erro_sync,
    rc.created_at as config_criado_em,
    rc.updated_at as config_atualizado_em
FROM public.accounts a
LEFT JOIN public.relatorio_config rc ON a.id = rc.client_id
LEFT JOIN LATERAL (
    SELECT rd.data_disparo, rd.status, rd.mensagem_erro
    FROM public.relatorio_disparos rd
    WHERE rd.client_id = a.id
    ORDER BY rd.data_disparo DESC
    LIMIT 1
) rd ON true
WHERE a.status = 'Ativo';