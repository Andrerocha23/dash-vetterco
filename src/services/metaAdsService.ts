import { supabase } from "@/integrations/supabase/client";
import type { MetaAdsResponse } from "@/types/meta";
import type { MetaPeriod } from "@/components/meta/MetaPeriodFilter";

const CACHE_KEY_PREFIX = 'meta_ads_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheData {
  data: MetaAdsResponse;
  timestamp: number;
}

export const metaAdsService = {
  /**
   * Fetches Meta Ads campaigns and metrics for a given account
   * Implements local caching to reduce API calls
   */
  async fetchMetaCampaigns(metaAccountId: string, period: MetaPeriod = 'last_7d'): Promise<MetaAdsResponse> {
    if (!metaAccountId) {
      throw new Error('Meta Account ID é obrigatório');
    }

    // Check cache first (cache key includes period parameter)
    const cacheKey = `${metaAccountId}_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached Meta Ads data for period:', period);
      return cached;
    }

    try {
      console.log('Fetching fresh Meta Ads data for account:', metaAccountId, 'Period:', period);

      const { data, error } = await supabase.functions.invoke('fetch-meta-campaigns', {
        body: { meta_account_id: metaAccountId, period }
      });

      if (error) {
        console.error('Error invoking fetch-meta-campaigns function:', error);
        throw new Error(`Erro ao buscar dados do Meta: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao buscar dados do Meta');
      }

      // Cache the successful response
      this.setCachedData(cacheKey, data);

      return data;
    } catch (error: any) {
      console.error('Error fetching Meta campaigns:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Token')) {
        throw new Error('Token de acesso do Meta inválido ou expirado. Atualize nas configurações.');
      } else if (error.message.includes('Account')) {
        throw new Error('Conta Meta não encontrada. Verifique o ID da conta nas configurações.');
      } else if (error.message.includes('Rate limit')) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (error.message.includes('Permission')) {
        throw new Error('Sem permissão para acessar dados desta conta Meta.');
      }
      
      throw error;
    }
  },

  /**
   * Gets cached data if available and not expired
   */
  getCachedData(metaAccountId: string): MetaAdsResponse | null {
    try {
      const cacheKey = CACHE_KEY_PREFIX + metaAccountId;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const { data, timestamp }: CacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  /**
   * Sets cached data with current timestamp
   */
  setCachedData(metaAccountId: string, data: MetaAdsResponse): void {
    try {
      const cacheKey = CACHE_KEY_PREFIX + metaAccountId;
      const cacheData: CacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  /**
   * Clears cached data for a specific account
   */
  clearCache(metaAccountId: string): void {
    try {
      const cacheKey = CACHE_KEY_PREFIX + metaAccountId;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * Clears all Meta Ads cache
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  },

  /**
   * Gets last fetch timestamp for a cache key
   */
  getLastFetchTimestamp(metaAccountId: string): number | null {
    try {
      const cacheKey = CACHE_KEY_PREFIX + metaAccountId;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const { timestamp }: CacheData = JSON.parse(cached);
      return timestamp;
    } catch (error) {
      console.error('Error getting last fetch timestamp:', error);
      return null;
    }
  }
};
