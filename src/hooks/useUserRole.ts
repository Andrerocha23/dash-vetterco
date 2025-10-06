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
        if (!user) { setRole(null); setLoading(false); return; }
        setUserId(user.id);

        // Usar funções SECURITY DEFINER para evitar problemas de RLS/recursão
        const { data: isAdminRes } = await supabase.rpc('is_admin', { _user_id: user.id });
        if (isAdminRes === true) { setRole('admin'); return; }

        const { data: isGestorRes } = await supabase.rpc('is_gestor', { _user_id: user.id });
        if (isGestorRes === true) { setRole('gestor'); return; }

        setRole('usuario');
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
