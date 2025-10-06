-- Script para criar usuário admin: andre@vettercompany.com.br
-- 
-- INSTRUÇÕES:
-- 1. Primeiro, registre-se no app com o email: andre@vettercompany.com.br
-- 2. Depois, copie e execute este SQL no Supabase SQL Editor
-- 3. Faça logout e login novamente no app

DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Buscar o user_id do email especificado
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'andre@vettercompany.com.br';
  
  -- Se o usuário existe, inserir a role de admin
  IF user_uuid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário andre@vettercompany.com.br agora é admin!';
  ELSE
    RAISE NOTICE 'Usuário não encontrado. Registre-se primeiro em /auth com o email: andre@vettercompany.com.br';
  END IF;
END $$;
