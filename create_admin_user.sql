-- Script para criar o primeiro usuário admin
-- 
-- INSTRUÇÕES:
-- 1. Primeiro, registre-se no app com seu email em /auth
-- 2. Depois, abra o SQL Editor no Supabase
-- 3. Cole este código e substitua 'SEU_EMAIL_AQUI' pelo seu email
-- 4. Execute o SQL

DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Buscar o user_id do email especificado
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'SEU_EMAIL_AQUI';  -- ⬅️ SUBSTITUA ISSO PELO SEU EMAIL!
  
  -- Se o usuário existe, inserir a role de admin
  IF user_uuid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário % agora é admin!', user_uuid;
  ELSE
    RAISE NOTICE 'Usuário não encontrado. Registre-se primeiro em /auth';
  END IF;
END $$;
