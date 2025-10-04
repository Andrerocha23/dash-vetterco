import { Badge } from "@/components/ui/badge";

interface MetaStatusBadgeProps {
  status: string;
}

export function MetaStatusBadge({ status }: MetaStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return {
          label: 'Ativa',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
        };
      case 'PAUSED':
        return {
          label: 'Pausada',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
        };
      case 'ARCHIVED':
        return {
          label: 'Arquivada',
          variant: 'outline' as const,
          className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
        };
      case 'DELETED':
        return {
          label: 'Deletada',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
