import { supabase } from "@/integrations/supabase/client";

export interface Manager {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  status: string;
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
      
      // Primeira tentativa: buscar gestores sem JOIN complexo
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

      // Para cada gestor, contar clientes manualmente
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

            return {
              ...manager,
              clientsCount: clientsCount || 0,
              totalLeads: Math.floor(Math.random() * 500) + 100, // Mock
              avgCPL: Math.random() * 30 + 30, // Mock
              avgCTR: Math.random() * 2 + 2, // Mock
              satisfaction: this.getSatisfactionLevel(Math.floor(Math.random() * 40) + 60), // Mock
              satisfactionScore: Math.floor(Math.random() * 40) + 60, // Mock
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

      console.log('✅ Managers with stats:', managersWithStats);
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
          return null; // Manager not found
        }
        throw new Error(`Failed to fetch manager: ${error.message}`);
      }

      // Contar clientes
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', id);

      return {
        ...data,
        clientsCount: clientsCount || 0,
        totalLeads: Math.floor(Math.random() * 500) + 100,
        avgCPL: Math.random() * 30 + 30,
        avgCTR: Math.random() * 2 + 2,
        satisfaction: this.getSatisfactionLevel(Math.floor(Math.random() * 40) + 60),
        satisfactionScore: Math.floor(Math.random() * 40) + 60,
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
    // Soft delete - change status to inactive
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

      // Para cada gestor, contar clientes
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