import { supabase } from "@/integrations/supabase/client";
import { ClienteFormData } from "@/types/client";

export interface Client {
  id: string;
  nome_cliente: string;
  nome_empresa: string;
  telefone: string;
  email?: string;
  gestor_id: string;
  canais: string[];
  status: 'Ativo' | 'Pausado' | 'Arquivado';
  usa_meta_ads: boolean;
  usa_google_ads: boolean;
  saldo_meta?: number;
  budget_mensal_meta?: number;
  budget_mensal_google?: number;
  created_at: string;
  updated_at: string;
}

// Mock gestor data for display purposes
const gestores = {
  'gest1': { id: 'gest1', name: 'Carlos Silva', avatar: '👨‍💼' },
  'gest2': { id: 'gest2', name: 'Ana Costa', avatar: '👩‍💼' },
  'gest3': { id: 'gest3', name: 'João Santos', avatar: '🧑‍💼' },
};

export const clientsService = {
  async getClients(): Promise<any[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    // Transform data to match the expected format
    return (data || []).map(client => ({
      id: client.id,
      name: client.nome_cliente,
      manager: gestores[client.gestor_id as keyof typeof gestores] || gestores['gest1'],
      channels: client.canais as ('Meta' | 'Google')[],
      status: client.status === 'Ativo' ? 'Active' : client.status === 'Pausado' ? 'Paused' : 'Archived',
      activeCampaigns: Math.floor(Math.random() * 10) + 1, // Random for demo
      metaBalance: (client.saldo_meta || 0) / 100,
      createdOn: client.created_at,
    }));
  },

  async create(clientData: ClienteFormData): Promise<any> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        nome_cliente: clientData.nomeCliente,
        nome_empresa: clientData.nomeEmpresa,
        telefone: clientData.telefone,
        email: clientData.email,
        gestor_id: clientData.gestorId,
        canais: clientData.canais,
        status: clientData.status,
        observacoes: clientData.observacoes,
        usa_meta_ads: clientData.usaMetaAds,
        usa_google_ads: clientData.usaGoogleAds,
        traqueamento_ativo: clientData.traqueamentoAtivo,
        saldo_meta: clientData.saldoMeta,
        budget_mensal_meta: clientData.budgetMensalMeta,
        budget_mensal_google: clientData.budgetMensalGoogle,
        // Add other fields as needed
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    // Transform and return in expected format
    return {
      id: data.id,
      name: data.nome_cliente,
      manager: gestores[data.gestor_id as keyof typeof gestores] || gestores['gest1'],
      channels: data.canais as ('Meta' | 'Google')[],
      status: data.status === 'Ativo' ? 'Active' : data.status === 'Pausado' ? 'Paused' : 'Archived',
      activeCampaigns: Math.floor(Math.random() * 10) + 1,
      metaBalance: (data.saldo_meta || 0) / 100,
      createdOn: data.created_at,
    };
  },

  async update(id: string, clientData: ClienteFormData): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        nome_cliente: clientData.nomeCliente,
        nome_empresa: clientData.nomeEmpresa,
        telefone: clientData.telefone,
        email: clientData.email,
        gestor_id: clientData.gestorId,
        canais: clientData.canais,
        status: clientData.status,
        observacoes: clientData.observacoes,
        usa_meta_ads: clientData.usaMetaAds,
        usa_google_ads: clientData.usaGoogleAds,
        traqueamento_ativo: clientData.traqueamentoAtivo,
        saldo_meta: clientData.saldoMeta,
        budget_mensal_meta: clientData.budgetMensalMeta,
        budget_mensal_google: clientData.budgetMensalGoogle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }
  },

  async archiveClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ 
        status: 'Arquivado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to archive client: ${error.message}`);
    }
  },

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Client not found
      }
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    // Transform data to match expected format
    return {
      id: data.id,
      name: data.nome_cliente,
      manager: gestores[data.gestor_id as keyof typeof gestores] || gestores['gest1'],
      channels: data.canais as ('Meta' | 'Google')[],
      status: data.status === 'Ativo' ? 'Active' : data.status === 'Pausado' ? 'Paused' : 'Archived',
      activeCampaigns: Math.floor(Math.random() * 10) + 1,
      metaBalance: (data.saldo_meta || 0) / 100,
      createdOn: data.created_at,
      // Add full client data for detail view
      ...data,
    };
  },
};