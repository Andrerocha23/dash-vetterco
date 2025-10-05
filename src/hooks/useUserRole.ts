import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'gestor' | 'usuario' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Buscar role do usuário
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.warn('Usuário sem role definida:', error);
          setRole('usuario'); // Default para usuário comum
        } else {
          setRole(roleData.role as UserRole);
        }
      } catch (error) {
        console.error('Erro ao carregar role:', error);
        setRole('usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor';
  const isUsuario = role === 'usuario';

  return {
    role,
    loading,
    userId,
    isAdmin,
    isGestor,
    isUsuario,
  };
}
