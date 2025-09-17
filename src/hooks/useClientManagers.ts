import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Manager {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  department?: string;
}

export function useClientManagers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('managers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error loading managers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const getManagerById = (id: string) => {
    return managers.find(manager => manager.id === id);
  };

  const getManagerName = (id: string) => {
    const manager = getManagerById(id);
    return manager?.name || 'Gestor não encontrado';
  };

  const getManagerAvatar = (id: string) => {
    const manager = getManagerById(id);
    return manager?.avatar_url || manager?.name?.charAt(0) || '?';
  };

  return {
    managers,
    loading,
    getManagerById,
    getManagerName,
    getManagerAvatar,
    refreshManagers: loadManagers,
  };
}