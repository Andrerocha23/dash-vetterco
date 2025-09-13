-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nome_cliente TEXT NOT NULL,
  nome_empresa TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  gestor_id TEXT NOT NULL,
  link_drive TEXT,
  canais TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Arquivado')),
  observacoes TEXT,
  id_grupo TEXT,
  usa_crm_externo BOOLEAN DEFAULT false,
  url_crm TEXT,
  
  -- Meta Ads
  usa_meta_ads BOOLEAN DEFAULT false,
  ativar_campanhas_meta BOOLEAN DEFAULT false,
  meta_account_id TEXT,
  meta_business_id TEXT,
  meta_page_id TEXT,
  modo_saldo_meta TEXT,
  monitorar_saldo_meta BOOLEAN DEFAULT false,
  saldo_meta DECIMAL(10,2) DEFAULT 0,
  alerta_saldo_baixo DECIMAL(10,2),
  budget_mensal_meta DECIMAL(10,2),
  link_meta TEXT,
  utm_padrao TEXT,
  webhook_meta TEXT,
  
  -- Google Ads
  usa_google_ads BOOLEAN DEFAULT false,
  google_ads_id TEXT,
  budget_mensal_google DECIMAL(10,2),
  conversoes TEXT[],
  link_google TEXT,
  webhook_google TEXT,
  
  -- Comunicação & Automação
  canal_relatorio TEXT,
  horario_relatorio TEXT,
  templates_padrao TEXT[],
  notificacao_saldo_baixo BOOLEAN DEFAULT false,
  notificacao_erro_sync BOOLEAN DEFAULT false,
  notificacao_leads_diarios BOOLEAN DEFAULT false,
  
  -- Rastreamento & Analytics
  traqueamento_ativo BOOLEAN DEFAULT false,
  pixel_meta TEXT,
  ga4_stream_id TEXT,
  gtm_id TEXT,
  typebot_ativo BOOLEAN DEFAULT false,
  typebot_url TEXT,
  
  -- Financeiro & Orçamento
  budget_mensal_global DECIMAL(10,2),
  forma_pagamento TEXT,
  centro_custo TEXT,
  contrato_inicio DATE,
  contrato_renovacao DATE,
  
  -- Permissões & Atribuições
  papel_padrao TEXT,
  usuarios_vinculados TEXT[],
  ocultar_ranking BOOLEAN DEFAULT false,
  somar_metricas BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all clients" 
ON public.clients 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update clients" 
ON public.clients 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete clients" 
ON public.clients 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert fake clients data
INSERT INTO public.clients (
  nome_cliente, nome_empresa, telefone, email, gestor_id, canais, status,
  usa_meta_ads, usa_google_ads, traqueamento_ativo, saldo_meta,
  budget_mensal_meta, budget_mensal_google
) VALUES 
(
  'João Silva', 'Silva & Associados', '+55 (11) 98765-4321', 'joao@silva.com.br', 'gest1',
  ARRAY['Meta', 'Google'], 'Ativo', true, true, true, 2500.00, 5000.00, 3000.00
),
(
  'Maria Santos', 'Santos Marketing', '+55 (21) 97654-3210', 'maria@santos.com', 'gest2',
  ARRAY['Meta'], 'Ativo', true, false, true, 1800.50, 3500.00, NULL
),
(
  'Pedro Costa', 'Costa Digital', '+55 (31) 96543-2109', 'pedro@costa.com.br', 'gest1',
  ARRAY['Google'], 'Ativo', false, true, false, NULL, NULL, 2500.00
),
(
  'Ana Oliveira', 'Oliveira Consultoria', '+55 (85) 95432-1098', 'ana@oliveira.com', 'gest3',
  ARRAY['Meta', 'Google'], 'Pausado', true, true, true, 950.25, 4000.00, 2800.00
),
(
  'Carlos Ferreira', 'Ferreira Publicidade', '+55 (62) 94321-0987', 'carlos@ferreira.com.br', 'gest2',
  ARRAY['Meta'], 'Arquivado', true, false, false, 150.00, 2000.00, NULL
);