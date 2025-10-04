import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type MetaPeriod = '7' | '15' | '30' | '60' | '90';

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
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="15">Últimos 15 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="60">Últimos 60 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
