import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { metaSyncService, type SyncLog } from '@/services/metaSyncService';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface MetaSyncButtonProps {
  accountId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLastSync?: boolean;
  onSyncComplete?: () => void;
}

export function MetaSyncButton({ 
  accountId, 
  variant = 'outline',
  size = 'default',
  showLastSync = true,
  onSyncComplete 
}: MetaSyncButtonProps) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar última sincronização ao montar
  useEffect(() => {
    loadLastSync();
  }, [accountId]);

  const loadLastSync = async () => {
    setLoading(true);
    const last = await metaSyncService.getLastSuccessfulSync(accountId);
    setLastSync(last);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);

    try {
      const result = await metaSyncService.syncMetaData(accountId, 'manual');

      if (result.success) {
        toast({
          title: "✅ Sincronização concluída!",
          description: result.message,
        });

        // Atualizar última sync
        await loadLastSync();

        // Callback externo
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: "❌ Erro na sincronização",
          description: result.error || 'Erro desconhecido',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "❌ Erro",
        description: error.message || 'Erro ao sincronizar dados',
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const getSyncStatusColor = () => {
    if (!lastSync) return 'text-muted-foreground';
    
    const hoursSinceSync = (Date.now() - new Date(lastSync.completed_at).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync < 1) return 'text-green-500';
    if (hoursSinceSync < 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleSync}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {size !== 'icon' && (
                <span>{syncing ? 'Sincronizando...' : 'Atualizar Meta'}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sincronizar dados do Meta Ads agora</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showLastSync && !loading && lastSync && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1.5 cursor-help">
                <Clock className={`h-3 w-3 ${getSyncStatusColor()}`} />
                <span className="text-xs">
                  {formatLastSync(lastSync.completed_at)}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="text-xs">Última sincronização:</p>
                <p className="text-xs font-mono">
                  {new Date(lastSync.completed_at).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSync.campaigns_synced} campanhas sincronizadas
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}