import { useState, useEffect } from 'react';
import { managersService, type ManagerWithStats } from '@/services/managersService';

export function useManagers() {
  const [managers, setManagers] = useState<ManagerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managersService.getManagers();
      setManagers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar gestores');
      console.error('Error loading managers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const refreshManagers = () => {
    loadManagers();
  };

  // Função para buscar gestor por ID
  const getManagerById = (id: string) => {
    return managers.find(manager => manager.id === id);
  };

  // Função para buscar gestores para select/dropdown
  const getManagersForSelect = async () => {
    try {
      return await managersService.getManagersForSelect();
    } catch (err) {
      console.error('Error getting managers for select:', err);
      return [];
    }
  };

  // Função para buscar estatísticas dos gestores
  const getManagersStats = () => {
    if (managers.length === 0) {
      return {
        totalManagers: 0,
        activeManagers: 0,
        avgSatisfaction: 0,
        topPerformer: null
      };
    }

    const activeManagers = managers.filter(m => m.status === 'active');
    const avgSatisfaction = managers.reduce((acc, m) => acc + m.satisfactionScore, 0) / managers.length;
    const topPerformer = managers.sort((a, b) => b.satisfactionScore - a.satisfactionScore)[0];

    return {
      totalManagers: managers.length,
      activeManagers: activeManagers.length,
      avgSatisfaction: Math.round(avgSatisfaction),
      topPerformer
    };
  };

  return {
    managers,
    loading,
    error,
    refreshManagers,
    getManagerById,
    getManagersForSelect,
    getManagersStats
  };
}
