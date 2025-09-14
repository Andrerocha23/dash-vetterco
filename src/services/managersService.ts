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
    const { data, error } = await supabase
      .from('managers')
      .select(`
        *,
        clients!clients_gestor_id_fkey(count)
      `)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching managers:', error);
      throw new Error(`Failed to fetch managers: ${error.message}`);
    }

    // Transformar dados e adicionar estatísticas mockadas por enquanto
    return (data || []).map(manager => {
      const clientsCount = Array.isArray(manager.clients) ? manager.clients.length : 0;
      
      return {
        ...manager,
        clientsCount,
        totalLeads: Math.floor(Math.random() * 500) + 100, // Mock
        avgCPL: Math.random() * 30 + 30, // Mock
        avgCTR: Math.random() * 2 + 2, // Mock
        satisfaction: this.getSatisfactionLevel(Math.floor(Math.random() * 40) + 60), // Mock
        satisfactionScore: Math.floor(Math.random() * 40) + 60, // Mock
        specialties: this.getSpecialtiesByDepartment(manager.department || ''),
      };
    });
  }

  async getManagerById(id: string): Promise<ManagerWithStats | null> {
    const { data, error } = await supabase
      .from('managers')
      .select(`
        *,
        clients!clients_gestor_id_fkey(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Manager not found
      }
      throw new Error(`Failed to fetch manager: ${error.message}`);
    }

    const clientsCount = Array.isArray(data.clients) ? data.clients.length : 0;

    return {
      ...data,
      clientsCount,
      totalLeads: Math.floor(Math.random() * 500) + 100,
      avgCPL: Math.random() * 30 + 30,
      avgCTR: Math.random() * 2 + 2,
      satisfaction: this.getSatisfactionLevel(Math.floor(Math.random() * 40) + 60),
      satisfactionScore: Math.floor(Math.random() * 40) + 60,
      specialties: this.getSpecialtiesByDepartment(data.department || ''),
    };
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
    const { data, error } = await supabase
      .from('managers')
      .select(`
        id, 
        name, 
        avatar_url, 
        department,
        clients!clients_gestor_id_fkey(count)
      `)
      .eq('status', 'active')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch managers for select: ${error.message}`);
    }

    return (data || []).map(manager => ({
      id: manager.id,
      name: manager.name,
      avatar_url: manager.avatar_url,
      department: manager.department,
      clientsCount: Array.isArray(manager.clients) ? manager.clients.length : 0
    }));
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
