-- Dropar todas as policies antigas e conflitantes da tabela accounts
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create accounts for their clientes" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view allowed accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their accounts via cliente" ON public.accounts;
DROP POLICY IF EXISTS "admin_manage_accounts" ON public.accounts;
DROP POLICY IF EXISTS "admin_view_all_accounts" ON public.accounts;
DROP POLICY IF EXISTS "client_view_own_accounts" ON public.accounts;
DROP POLICY IF EXISTS "gestor_view_own_accounts" ON public.accounts;

-- Criar policies simples e eficientes usando as funções SECURITY DEFINER

-- Policy 1: Admin tem acesso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access on accounts"
ON public.accounts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Policy 2: Gestor pode ver apenas contas onde ele é o gestor
CREATE POLICY "Gestor view assigned accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  public.is_gestor(auth.uid()) 
  AND gestor_id = auth.uid()
);

-- Policy 3: Gestor pode atualizar apenas contas onde ele é o gestor
CREATE POLICY "Gestor update assigned accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (
  public.is_gestor(auth.uid()) 
  AND gestor_id = auth.uid()
)
WITH CHECK (
  public.is_gestor(auth.uid()) 
  AND gestor_id = auth.uid()
);