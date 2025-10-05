import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type MetaPeriod = 'today' | 'yesterday' | 'last_7d' | 'last_15d' | 'this_month' | 'last_month';

interface MetaPeriodFilterProps {
  value: MetaPeriod;
  onChange: (value: MetaPeriod) => void;
}

export function MetaPeriodFilter({ value, onChange }: MetaPeriodFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
          <SelectItem value="last_15d">Últimos 15 dias</SelectItem>
          <SelectItem value="this_month">Este mês</SelectItem>
          <SelectItem value="last_month">Mês passado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
