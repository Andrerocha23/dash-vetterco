-- Fix function to not reference removed column "ativo" and use correct table name
CREATE OR REPLACE FUNCTION public.create_relatorio_config_for_new_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure a default config exists for this account
  IF NOT EXISTS (
    SELECT 1 FROM public.relatorio_config rc WHERE rc.client_id = NEW.id
  ) THEN
    INSERT INTO public.relatorio_config (
      client_id,
      ativo_meta,
      ativo_google,
      horario_disparo,
      dias_semana,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      true,
      true,
      '09:00:00'::time,
      ARRAY[1,2,3,4,5],
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for accounts table (not clients)
DROP TRIGGER IF EXISTS trigger_create_relatorio_config ON public.accounts;
CREATE TRIGGER trigger_create_relatorio_config
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_relatorio_config_for_new_client();