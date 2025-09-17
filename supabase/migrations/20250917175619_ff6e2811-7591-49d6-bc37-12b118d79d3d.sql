-- Enable RLS on managers table (if not already enabled)
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Create policies for managers (allow all authenticated users to read managers)
CREATE POLICY "Authenticated users can view managers" 
ON public.managers FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create managers" 
ON public.managers FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update managers" 
ON public.managers FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete managers" 
ON public.managers FOR DELETE 
USING (auth.uid() IS NOT NULL);