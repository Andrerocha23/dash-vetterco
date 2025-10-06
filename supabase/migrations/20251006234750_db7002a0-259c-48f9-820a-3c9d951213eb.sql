-- Criar tipo app_role se não existir
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Garantir que a tabela user_roles existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
DROP POLICY IF EXISTS "Admin full access on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;

CREATE POLICY "Admin full access on user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());