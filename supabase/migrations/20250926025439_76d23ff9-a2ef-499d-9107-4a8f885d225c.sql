-- Criar nova tabela clientes (organizações)
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  instagram_handle TEXT,
  site TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para clientes
CREATE POLICY "Authenticated users can view clientes" 
ON public.clientes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clientes" 
ON public.clientes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clientes" 
ON public.clientes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Renomear tabela clients para accounts
ALTER TABLE public.clients RENAME TO accounts;

-- Adicionar cliente_id na tabela accounts
ALTER TABLE public.accounts ADD COLUMN cliente_id UUID REFERENCES public.clientes(id);

-- Criar trigger para updated_at na tabela clientes
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar as políticas RLS da tabela accounts (renomeada de clients)
DROP POLICY "Users can view their own clients" ON public.accounts;
DROP POLICY "Users can create their own clients" ON public.accounts;
DROP POLICY "Users can update their own clients" ON public.accounts;
DROP POLICY "Users can delete their own clients" ON public.accounts;

-- Criar novas políticas para accounts
CREATE POLICY "Users can view their own accounts" 
ON public.accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.accounts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.accounts 
FOR DELETE 
USING (auth.uid() = user_id);