-- ============================================
-- MIGRATION: Fix User Roles and Permissions
-- ============================================

-- 1. Adicionar coluna email em profiles se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Criar ENUM app_role se não existir
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'usuario');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Criar tabela user_roles para armazenar roles de forma segura
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Habilitar RLS em user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar função SECURITY DEFINER para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- 6. Recriar funções is_admin e is_gestor usando has_role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'gestor'::app_role)
$$;

-- 7. Criar policies para user_roles
DROP POLICY IF EXISTS "Admin full access on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;

CREATE POLICY "Admin full access on user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. Inserir role admin para andrerochactt@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'andrerochactt@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. Adicionar foreign key entre accounts.gestor_id e profiles.id
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS accounts_gestor_id_fkey;

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_gestor_id_fkey
FOREIGN KEY (gestor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;