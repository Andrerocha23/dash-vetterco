-- Criar função para inserir configuração de relatório automaticamente
CREATE OR REPLACE FUNCTION public.create_relatorio_config_for_new_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir configuração padrão para o novo cliente
  INSERT INTO public.relatorio_config (client_id, ativo, horario_disparo)
  VALUES (NEW.id, true, '09:00:00'::time);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar a função quando um novo cliente for criado
DROP TRIGGER IF EXISTS trigger_create_relatorio_config ON public.clients;
CREATE TRIGGER trigger_create_relatorio_config
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_relatorio_config_for_new_client();

-- Criar configurações para clientes existentes que não possuem
INSERT INTO public.relatorio_config (client_id, ativo, horario_disparo)
SELECT c.id, true, '09:00:00'::time
FROM public.clients c
LEFT JOIN public.relatorio_config rc ON c.id = rc.client_id
WHERE rc.client_id IS NULL;