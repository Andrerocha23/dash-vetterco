// src/components/meta/MetaStatusBadge.tsx
import { Badge } from "@/components/ui/badge";

export type MetaStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED' | string;

export function MetaStatusBadge({ status }: { status: MetaStatus }) {
  const s = String(status || '').toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: 'Ativa',     className: 'bg-emerald-500/10 text-emerald-600' },
    PAUSED:   { label: 'Pausada',   className: 'bg-yellow-500/10 text-yellow-600' },
    ARCHIVED: { label: 'Arquivada', className: 'bg-gray-500/10 text-gray-600' },
    DELETED:  { label: 'Deletada',  className: 'bg-red-500/10 text-red-600' },
  };
  const cfg = map[s] || { label: s || '—', className: 'bg-gray-500/10 text-gray-600' };
  return <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>;
}
