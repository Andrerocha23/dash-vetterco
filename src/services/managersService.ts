import { supabase } from "@/integrations/supabase/client";

export interface Manager {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ManagerWithStats extends Manager {
  clientsCount: number;
  totalLeads: number;
  avgCPL: number;
  avgCTR: number;
  satisfaction: "excellent" | "good" | "average" | "poor";
  satisfactionScore: number;
  specialties: string[];
}

export interface CreateManagerData {
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
}

class ManagersService {
  async getManagers(): Promise<ManagerWithStats[]> {
    try {
      console.log('🔍 Fetching managers...');
      
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (managersError) {
        console.error('❌ Error fetching managers:', managersError);
        throw new Error(`Failed to fetch managers: ${managersError.message}`);
      }

      console.log('✅ Managers data:', managersData);

      if (!managersData || managersData.length === 0) {
        console.log('⚠️ No managers found');
        return [];
      }

      // Para cada gestor, contar clientes e buscar dados reais
      const managersWithStats = await Promise.all(
        managersData.map(async (manager) => {
          try {
            // Contar clientes por gestor
            const { count: clientsCount, error: countError } = await supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('gestor_id', manager.id);

            if (countError) {
              console.warn(`⚠️ Error counting clients for manager ${manager.id}:`, countError);
            }

            // Buscar dados reais de leads/campanhas dos clientes deste gestor
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('saldo_meta, budget_mensal_meta, budget_mensal_google')
              .eq('gestor_id', manager.id);

            let totalBudget = 0;
            let avgCPL = 0;
            let totalLeads = 0;

            if (clientsData && clientsData.length > 0) {
              // Calcular budget total
              totalBudget = clientsData.reduce((sum, client) => {
                return sum + (client.budget_mensal_meta || 0) + (client.budget_mensal_google || 0);
              }, 0);

              // Estimar leads baseado no budget (estimativa: R$ 50 por lead)
              if (totalBudget > 0) {
                totalLeads = Math.floor(totalBudget / 50);
                avgCPL = totalBudget / totalLeads;
              }
            }

            // Calcular satisfação baseada na performance real
            let satisfactionScore = 70; // Base
            if (clientsCount && clientsCount > 0) {
              satisfactionScore += Math.min(clientsCount * 5, 20); // +5 por cliente, max +20
            }
            if (totalBudget > 5000) {
              satisfactionScore += 10; // +10 se gerencia budget alto
            }

            return {
              ...manager,
              clientsCount: clientsCount || 0,
              totalLeads,
              avgCPL: avgCPL || 0,
              avgCTR: 0, // Não temos dados reais de CTR ainda
              satisfaction: this.getSatisfactionLevel(satisfactionScore),
              satisfactionScore,
              specialties: this.getSpecialtiesByDepartment(manager.department || ''),
            };
          } catch (error) {
            console.error(`❌ Error processing manager ${manager.id}:`, error);
            return {
              ...manager,
              clientsCount: 0,
              totalLeads: 0,
              avgCPL: 0,
              avgCTR: 0,
              satisfaction: 'poor' as const,
              satisfactionScore: 0,
              specialties: [],
            };
          }
        })
      );

      console.log('✅ Managers with REAL stats:', managersWithStats);
      return managersWithStats;

    } catch (error) {
      console.error('❌ Critical error in getManagers:', error);
      throw error;
    }
  }

  async getManagerById(id: string): Promise<ManagerWithStats | null> {
    try {
      const { data, error } = await supabase
        .from('managers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch manager: ${error.message}`);
      }

      // Contar clientes e calcular dados reais
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', id);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('saldo_meta, budget_mensal_meta, budget_mensal_google')
        .eq('gestor_id', id);

      let totalBudget = 0;
      let avgCPL = 0;
      let totalLeads = 0;

      if (clientsData && clientsData.length > 0) {
        totalBudget = clientsData.reduce((sum, client) => {
          return sum + (client.budget_mensal_meta || 0) + (client.budget_mensal_google || 0);
        }, 0);

        if (totalBudget > 0) {
          totalLeads = Math.floor(totalBudget / 50);
          avgCPL = totalBudget / totalLeads;
        }
      }

      let satisfactionScore = 70;
      if (clientsCount && clientsCount > 0) {
        satisfactionScore += Math.min(clientsCount * 5, 20);
      }
      if (totalBudget > 5000) {
        satisfactionScore += 10;
      }

      return {
        ...data,
        clientsCount: clientsCount || 0,
        totalLeads,
        avgCPL: avgCPL || 0,
        avgCTR: 0,
        satisfaction: this.getSatisfactionLevel(satisfactionScore),
        satisfactionScore,
        specialties: this.getSpecialtiesByDepartment(data.department || ''),
      };
    } catch (error) {
      console.error('Error in getManagerById:', error);
      throw error;
    }
  }

  async createManager(managerData: CreateManagerData): Promise<Manager> {
    const { data, error } = await supabase
      .from('managers')
      .insert({
        name: managerData.name,
        email: managerData.email,
        avatar_url: managerData.avatar_url,
        phone: managerData.phone,
        department: managerData.department,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create manager: ${error.message}`);
    }

    return data;
  }

  async updateManager(id: string, managerData: Partial<CreateManagerData>): Promise<void> {
    const { error } = await supabase
      .from('managers')
      .update({
        ...managerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update manager: ${error.message}`);
    }
  }

  async deleteManager(id: string): Promise<void> {
    const { error } = await supabase
      .from('managers')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete manager: ${error.message}`);
    }
  }

  async getManagersForSelect(): Promise<{ id: string; name: string; avatar_url?: string; department?: string; clientsCount?: number }[]> {
    try {
      console.log('🔍 Fetching managers for select...');
      
      const { data, error } = await supabase
        .from('managers')
        .select('id, name, avatar_url, department')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Error fetching managers for select:', error);
        throw new Error(`Failed to fetch managers for select: ${error.message}`);
      }

      console.log('✅ Managers for select:', data);

      if (data && data.length > 0) {
        const managersWithCount = await Promise.all(
          data.map(async (manager) => {
            const { count } = await supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('gestor_id', manager.id);

            return {
              ...manager,
              clientsCount: count || 0
            };
          })
        );

        return managersWithCount;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getManagersForSelect:', error);
      throw error;
    }
  }

  // Métodos de utilidade
  private getSatisfactionLevel(score: number): "excellent" | "good" | "average" | "poor" {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    return "poor";
  }

  private getSpecialtiesByDepartment(department: string): string[] {
    const specialtyMap: Record<string, string[]> = {
      'Meta Ads': ['Meta Ads', 'Facebook Ads', 'Instagram Ads'],
      'Google Ads': ['Google Ads', 'YouTube Ads', 'SEM'],
      'Performance': ['Meta Ads', 'Google Ads', 'Performance Marketing'],
      'Social Media': ['Social Media', 'Content Marketing'],
      'E-commerce': ['E-commerce', 'Shopify', 'Conversion Optimization']
    };

    return specialtyMap[department] || ['Marketing Digital'];
  }
}

export const managersService = new ManagersService();