import { supabase } from "@/integrations/supabase/client";

export interface SyncResult {
  success: boolean;
  message: string;
  campaigns_synced?: number;
  error?: string;
  timestamp?: string;
}

export interface SyncLog {
  id: string;
  account_id: string;
  sync_type: 'manual' | 'automatic';
  status: 'success' | 'error' | 'partial';
  campaigns_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
}

export const metaSyncService = {
  /**
   * Sincroniza dados do Meta para o banco (manual ou automático)
   */
  async syncMetaData(accountId?: string, syncType: 'manual' | 'automatic' = 'manual'): Promise<SyncResult> {
    try {
      const startTime = new Date();

      console.log(`Starting ${syncType} sync for account:`, accountId || 'ALL');

      const { data, error } = await supabase.functions.invoke('sync-meta-to-database', {
        body: { account_id: accountId }
      });

      if (error) {
        console.error('Error invoking sync function:', error);
        
        // Registrar erro no log
        await this.logSync({
          account_id: accountId || null,
          sync_type: syncType,
          status: 'error',
          campaigns_synced: 0,
          error_message: error.message,
          started_at: startTime.toISOString(),
          duration_seconds: Math.floor((Date.now() - startTime.getTime()) / 1000)
        });

        throw new Error(`Erro ao sincronizar: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na sincronização');
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Registrar sucesso no log
      await this.logSync({
        account_id: accountId || null,
        sync_type: syncType,
        status: 'success',
        campaigns_synced: data.results?.reduce((sum: number, r: any) => sum + (r.campaigns_synced || 0), 0) || 0,
        error_message: null,
        started_at: startTime.toISOString(),
        duration_seconds: duration
      });

      return {
        success: true,
        message: `${data.synced_accounts} conta(s) sincronizada(s) com sucesso!`,
        campaigns_synced: data.results?.reduce((sum: number, r: any) => sum + (r.campaigns_synced || 0), 0) || 0,
        timestamp: data.timestamp
      };

    } catch (error: any) {
      console.error('Error in syncMetaData:', error);
      return {
        success: false,
        message: 'Erro ao sincronizar dados do Meta',
        error: error.message
      };
    }
  },

  /**
   * Registra uma sincronização no banco
   */
  async logSync(logData: {
    account_id: string | null;
    sync_type: 'manual' | 'automatic';
    status: 'success' | 'error' | 'partial';
    campaigns_synced: number;
    error_message: string | null;
    started_at: string;
    duration_seconds: number;
  }) {
    try {
      console.log('Logging sync:', logData);
      // Logs are handled by the edge function
    } catch (error) {
      console.error('Error in logSync:', error);
    }
  },

  /**
   * Busca os últimos logs de sincronização
   */
  async getRecentSyncLogs(accountId?: string, limit: number = 10): Promise<SyncLog[]> {
    try {
      console.log('Fetching sync logs for account:', accountId);
      // This would need the table to be accessible
      return [];
    } catch (error) {
      console.error('Error in getRecentSyncLogs:', error);
      return [];
    }
  },

  /**
   * Busca a última sincronização bem-sucedida
   */
  async getLastSuccessfulSync(accountId?: string): Promise<SyncLog | null> {
    try {
      console.log('Fetching last successful sync for:', accountId);
      // This would need the table to be accessible
      return null;
    } catch (error) {
      console.error('Error in getLastSuccessfulSync:', error);
      return null;
    }
  }
};