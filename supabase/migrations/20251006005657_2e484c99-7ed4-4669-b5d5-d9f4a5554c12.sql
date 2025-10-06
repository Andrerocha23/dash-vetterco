-- Fase 1: Limpeza do Banco de Dados

-- 1. Remover políticas antigas de accounts que referenciam gestor_id
DROP POLICY IF EXISTS "Gestores can view their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;

-- 2. Remover foreign key de accounts que referencia managers
ALTER TABLE public.accounts DROP COLUMN IF EXISTS gestor_id;

-- 3. Remover tabela managers
DROP TABLE IF EXISTS public.managers CASCADE;

-- 4. Atualizar tabela clientes
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role app_role;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_role ON public.clientes(role);

-- Fase 2: Atualizar RLS Policies

-- RLS para clientes
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;

-- Admins veem todos
CREATE POLICY "Admins can view all clientes"
  ON public.clientes FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Gestores veem apenas seus clientes
CREATE POLICY "Gestores can view their clientes"
  ON public.clientes FOR SELECT
  USING (
    public.is_gestor(auth.uid()) 
    AND user_id = auth.uid()
  );

-- Usuarios veem apenas seus clientes
CREATE POLICY "Users can view their clientes"
  ON public.clientes FOR SELECT
  USING (user_id = auth.uid());

-- Admins podem criar/atualizar/deletar
CREATE POLICY "Admins can insert clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update clientes"
  ON public.clientes FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete clientes"
  ON public.clientes FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Gestores e usuarios podem atualizar seus próprios clientes
CREATE POLICY "Users can update their clientes"
  ON public.clientes FOR UPDATE
  USING (user_id = auth.uid());

-- RLS para accounts (via cliente_id)
CREATE POLICY "Admins can view all accounts"
  ON public.accounts FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their accounts via cliente"
  ON public.accounts FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create accounts for their clientes"
  ON public.accounts FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM public.clientes 
      WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can update their accounts"
  ON public.accounts FOR UPDATE
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes 
      WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can delete their accounts"
  ON public.accounts FOR DELETE
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes 
      WHERE user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

-- Atualizar RLS para leads
DROP POLICY IF EXISTS "Users can view leads from their clients" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads for their clients" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads from their clients" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads from their clients" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their leads via cliente"
  ON public.leads FOR SELECT
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leads for their accounts"
  ON public.leads FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Users can update their leads"
  ON public.leads FOR UPDATE
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Users can delete their leads"
  ON public.leads FOR DELETE
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

-- Atualizar RLS para campaign_leads_daily
DROP POLICY IF EXISTS "Users can view campaign leads from their clients" ON public.campaign_leads_daily;
DROP POLICY IF EXISTS "Users can create campaign leads for their clients" ON public.campaign_leads_daily;
DROP POLICY IF EXISTS "Users can update campaign leads from their clients" ON public.campaign_leads_daily;
DROP POLICY IF EXISTS "Admins can view all campaign leads" ON public.campaign_leads_daily;

CREATE POLICY "Admins can view all campaign leads"
  ON public.campaign_leads_daily FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their campaign leads via cliente"
  ON public.campaign_leads_daily FOR SELECT
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaign leads for their accounts"
  ON public.campaign_leads_daily FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Users can update their campaign leads"
  ON public.campaign_leads_daily FOR UPDATE
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

-- Atualizar RLS para campaign_creatives
DROP POLICY IF EXISTS "Users can view their creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Users can insert creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Users can update their creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Admins can view all creatives" ON public.campaign_creatives;

CREATE POLICY "Admins can view all creatives"
  ON public.campaign_creatives FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their creatives via cliente"
  ON public.campaign_creatives FOR SELECT
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert creatives for their accounts"
  ON public.campaign_creatives FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Users can update their creatives"
  ON public.campaign_creatives FOR UPDATE
  USING (
    client_id IN (
      SELECT a.id FROM public.accounts a
      JOIN public.clientes c ON a.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR public.is_admin(auth.uid())
    )
  );