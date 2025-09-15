-- Fix the security issue by ensuring views use SECURITY INVOKER (default behavior)
-- This is just a verification - the views are already safe since they don't use SECURITY DEFINER

-- Recreate the views explicitly with SECURITY INVOKER to be absolutely clear about permissions
DROP VIEW IF EXISTS public.campaign_performance_stats;
DROP VIEW IF EXISTS public.leads_stats;

-- Recreate campaign_performance_stats view with explicit SECURITY INVOKER
CREATE VIEW public.campaign_performance_stats 
WITH (security_invoker = true) AS
SELECT c.id AS client_id,
    c.nome_cliente,
    count(cl.id) AS total_campaign_days,
    sum(cl.leads_count) AS total_leads,
    sum(cl.qualified_leads) AS total_qualified,
    sum(cl.disqualified_leads) AS total_disqualified,
    sum(cl.converted_leads) AS total_converted,
    sum(cl.spend) AS total_spend,
    CASE
        WHEN (sum(cl.leads_count) > 0) THEN round((((sum(cl.qualified_leads))::numeric / (sum(cl.leads_count))::numeric) * (100)::numeric), 2)
        ELSE (0)::numeric
    END AS qualification_rate,
    CASE
        WHEN (sum(cl.qualified_leads) > 0) THEN round((((sum(cl.converted_leads))::numeric / (sum(cl.qualified_leads))::numeric) * (100)::numeric), 2)
        ELSE (0)::numeric
    END AS conversion_rate,
    avg(cl.quality_score) AS avg_quality_score,
    count(
        CASE
            WHEN (cl.feedback_status = 'Pendente'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_feedback
FROM (clients c
    LEFT JOIN campaign_leads_daily cl ON ((c.id = cl.client_id)))
GROUP BY c.id, c.nome_cliente;

-- Recreate leads_stats view with explicit SECURITY INVOKER
CREATE VIEW public.leads_stats 
WITH (security_invoker = true) AS
SELECT c.id AS client_id,
    c.nome_cliente,
    count(l.id) AS total_leads,
    count(
        CASE
            WHEN (l.status = 'Novo'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_novos,
    count(
        CASE
            WHEN (l.status = 'Contatado'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_contatados,
    count(
        CASE
            WHEN (l.status = 'Qualificado'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_qualificados,
    count(
        CASE
            WHEN (l.status = 'Convertido'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_convertidos,
    count(
        CASE
            WHEN (l.status = 'Desqualificado'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_desqualificados,
    count(
        CASE
            WHEN (l.origem = 'Meta'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_meta,
    count(
        CASE
            WHEN (l.origem = 'Google'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_google,
    count(
        CASE
            WHEN (l.origem = 'Orgânico'::text) THEN 1
            ELSE NULL::integer
        END) AS leads_organico,
    avg(l.nota_qualificacao) AS nota_media,
    sum(l.valor_conversao) AS valor_total_conversoes
FROM (clients c
    LEFT JOIN leads l ON ((c.id = l.client_id)))
GROUP BY c.id, c.nome_cliente;