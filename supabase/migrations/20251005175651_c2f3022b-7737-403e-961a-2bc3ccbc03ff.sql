-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'usuario');

-- Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para checar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Função para verificar se é gestor
CREATE OR REPLACE FUNCTION public.is_gestor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'gestor'::app_role)
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Atualizar políticas RLS da tabela accounts para incluir controle por gestor
DROP POLICY IF EXISTS "Temporary view all accounts" ON public.accounts;

-- Admins veem tudo
CREATE POLICY "Admins can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Gestores veem apenas suas contas
CREATE POLICY "Gestores can view their accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  public.is_gestor(auth.uid()) 
  AND gestor_id IN (
    SELECT id::text 
    FROM managers 
    WHERE email IN (
      SELECT email 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Usuários veem suas próprias contas
CREATE POLICY "Users can view their own accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar campos faltantes na tabela public_client_registrations
ALTER TABLE public.public_client_registrations
ADD COLUMN IF NOT EXISTS num_corretores INTEGER,
ADD COLUMN IF NOT EXISTS num_funcionarios INTEGER,
ADD COLUMN IF NOT EXISTS num_sdr INTEGER,
ADD COLUMN IF NOT EXISTS telefone_leads TEXT,
ADD COLUMN IF NOT EXISTS budget_mensal NUMERIC,
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
ADD COLUMN IF NOT EXISTS responsavel_email TEXT;