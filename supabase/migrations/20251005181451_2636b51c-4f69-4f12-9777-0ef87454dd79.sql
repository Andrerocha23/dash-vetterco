-- Atualizar tabela public_client_registrations com todos os campos necessários
ALTER TABLE public.public_client_registrations
  DROP COLUMN IF EXISTS nome_completo,
  DROP COLUMN IF EXISTS nome_imobiliaria,
  DROP COLUMN IF EXISTS cnpj_creci,
  DROP COLUMN IF EXISTS tipo_imoveis,
  DROP COLUMN IF EXISTS publico_alvo,
  DROP COLUMN IF EXISTS diferenciais,
  DROP COLUMN IF EXISTS objetivos_marketing,
  DROP COLUMN IF EXISTS campanhas_detalhes,
  DROP COLUMN IF EXISTS nome_gestor_marketing,
  DROP COLUMN IF EXISTS forma_receber_relatorios,
  DROP COLUMN IF EXISTS ticket_medio,
  DROP COLUMN IF EXISTS meta_mensal_vendas,
  DROP COLUMN IF EXISTS num_imoveis_ativos,
  DROP COLUMN IF EXISTS valor_mensal_anuncios;

-- A. Identificação da empresa
ALTER TABLE public.public_client_registrations
  ADD COLUMN razao_social TEXT NOT NULL DEFAULT '',
  ADD COLUMN nome_fantasia TEXT,
  ADD COLUMN cnpj_cpf TEXT,
  ADD COLUMN site_url TEXT,
  ADD COLUMN instagram_handle TEXT;

-- B. Contato principal  
ALTER TABLE public.public_client_registrations
  ADD COLUMN responsavel_cargo TEXT;

-- C. Gestores
ALTER TABLE public.public_client_registrations
  ADD COLUMN tem_gestor_marketing BOOLEAN DEFAULT false,
  ADD COLUMN gestor_marketing_nome TEXT,
  ADD COLUMN gestor_marketing_email TEXT,
  ADD COLUMN gestor_marketing_whatsapp TEXT,
  ADD COLUMN tem_gestor_comercial BOOLEAN DEFAULT false,
  ADD COLUMN gestor_comercial_nome TEXT,
  ADD COLUMN gestor_comercial_email TEXT,
  ADD COLUMN gestor_comercial_whatsapp TEXT;

-- D. Nicho/Atuação
ALTER TABLE public.public_client_registrations
  ADD COLUMN nichos TEXT[] DEFAULT '{}';

-- E. Padrão/Segmento
ALTER TABLE public.public_client_registrations
  ADD COLUMN segmentos TEXT[] DEFAULT '{}';

-- F. Região de atuação
ALTER TABLE public.public_client_registrations
  ADD COLUMN cidades TEXT[] DEFAULT '{}',
  ADD COLUMN bairros_regioes TEXT[] DEFAULT '{}',
  ADD COLUMN estado TEXT;

-- G. Equipe
ALTER TABLE public.public_client_registrations
  ADD COLUMN tem_corretor_funcionario BOOLEAN DEFAULT false,
  ADD COLUMN qtd_corretores INTEGER DEFAULT 0,
  ADD COLUMN qtd_funcionarios INTEGER DEFAULT 0,
  ADD COLUMN estrutura_setores JSONB DEFAULT '{}',
  ADD COLUMN tem_sdr BOOLEAN DEFAULT false,
  ADD COLUMN qtd_sdr_total INTEGER DEFAULT 0;

-- H. Orçamento
ALTER TABLE public.public_client_registrations
  ADD COLUMN distribuicao_sugerida JSONB DEFAULT '{}';

-- I. Acessos e referências
ALTER TABLE public.public_client_registrations
  ADD COLUMN crm_url TEXT,
  ADD COLUMN meta_bm_id TEXT,
  ADD COLUMN google_ads_cid TEXT;

-- J. Preferências de contato
ALTER TABLE public.public_client_registrations
  ADD COLUMN contato_preferido TEXT,
  ADD COLUMN horarios_contato TEXT;

-- K. LGPD
ALTER TABLE public.public_client_registrations
  ADD COLUMN lgpd_consent BOOLEAN DEFAULT false;

-- Campos de aprovação
ALTER TABLE public.public_client_registrations
  ADD COLUMN approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN archived BOOLEAN DEFAULT false;

-- Remover constraint de NOT NULL dos campos antigos se existir
ALTER TABLE public.public_client_registrations
  ALTER COLUMN razao_social DROP NOT NULL;

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.public_client_registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_archived ON public.public_client_registrations(archived);

-- Atualizar RLS policies
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.public_client_registrations;
CREATE POLICY "Admins can view all registrations"
  ON public.public_client_registrations
  FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update registrations" ON public.public_client_registrations;
CREATE POLICY "Admins can update registrations"
  ON public.public_client_registrations
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Atualizar política de inserção para permitir sem autenticação
DROP POLICY IF EXISTS "Anyone can register as client" ON public.public_client_registrations;
CREATE POLICY "Public can create registrations"
  ON public.public_client_registrations
  FOR INSERT
  WITH CHECK (true);