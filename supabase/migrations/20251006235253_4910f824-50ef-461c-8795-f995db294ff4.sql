-- Revert user_roles policies to use SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "Admin full access on user_roles" ON public.user_roles;
CREATE POLICY "Admin full access on user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));