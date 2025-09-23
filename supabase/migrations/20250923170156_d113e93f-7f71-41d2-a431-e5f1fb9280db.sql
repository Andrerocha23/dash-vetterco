-- Add foreign key constraint to link clients to managers
ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_manager 
FOREIGN KEY (gestor_id) REFERENCES public.managers(id);