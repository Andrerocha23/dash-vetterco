-- Create accounts table for each client
CREATE TABLE public.client_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'Meta Ads', 'Google Ads', 'TikTok Ads', etc.
  account_id text NOT NULL, -- ID da conta na plataforma
  status text NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Pausado', 'Arquivado'
  observacoes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(client_id, tipo, account_id)
);

-- Enable RLS on client_accounts
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for client_accounts
CREATE POLICY "Users can view accounts from their clients" 
ON public.client_accounts FOR SELECT 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create accounts for their clients" 
ON public.client_accounts FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update accounts from their clients" 
ON public.client_accounts FOR UPDATE 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete accounts from their clients" 
ON public.client_accounts FOR DELETE 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_client_accounts_updated_at
BEFORE UPDATE ON public.client_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create public_client_registrations table for public form
CREATE TABLE public.public_client_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados principais
  nome_completo text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  instagram text,
  nome_imobiliaria text NOT NULL,
  cnpj_creci text,
  site_institucional text,
  
  -- Atuação e mercado
  cidade_regiao text NOT NULL,
  tipo_imoveis text NOT NULL,
  publico_alvo text NOT NULL,
  num_imoveis_ativos integer,
  diferenciais text,
  
  -- Investimento e objetivos
  valor_mensal_anuncios numeric,
  objetivos_marketing text,
  ticket_medio numeric,
  meta_mensal_vendas integer,
  
  -- Presença digital
  redes_sociais_adicionais text[],
  campanhas_ativas boolean DEFAULT false,
  campanhas_detalhes text,
  pixel_analytics_configurado boolean DEFAULT false,
  crm_utilizado text,
  
  -- Gestão e relacionamento
  nome_gestor_marketing text,
  forma_receber_relatorios text,
  observacoes_adicionais text,
  
  -- Status
  status text DEFAULT 'Pendente', -- 'Pendente', 'Processado', 'Cliente'
  processed_at timestamp with time zone,
  client_id uuid REFERENCES public.clients(id),
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on public_client_registrations but allow public read/write for registration
ALTER TABLE public.public_client_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can register as client" 
ON public.public_client_registrations FOR INSERT 
WITH CHECK (true);

-- Only authenticated users can view/update registrations
CREATE POLICY "Users can view all registrations" 
ON public.public_client_registrations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update registrations" 
ON public.public_client_registrations FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_public_client_registrations_updated_at
BEFORE UPDATE ON public.public_client_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();