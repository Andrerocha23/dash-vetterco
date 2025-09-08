import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Period = "today" | "yesterday" | "7d" | "15d" | "30d" | "custom";

interface CustomDateRange {
  from: Date;
  to: Date;
}

interface PeriodSelectorProps {
  value?: Period;
  customRange?: CustomDateRange;
  onValueChange?: (value: Period, customRange?: CustomDateRange) => void;
}

export function PeriodSelector({ value = "today", customRange, onValueChange }: PeriodSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(value);
  const [dateRange, setDateRange] = useState<CustomDateRange | undefined>(customRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleValueChange = (newValue: Period) => {
    setSelectedPeriod(newValue);
    if (newValue !== "custom") {
      onValueChange?.(newValue);
    }
  };

  const handleDateRangeChange = (range: CustomDateRange) => {
    setDateRange(range);
    onValueChange?.("custom", range);
    setIsCalendarOpen(false);
  };

  const formatCustomRange = () => {
    if (!dateRange) return "Personalizado";
    return `${format(dateRange.from, "dd/MM", { locale: pt })} - ${format(dateRange.to, "dd/MM", { locale: pt })}`;
  };

  return (
    <div className="flex gap-2">
      <Select value={selectedPeriod} onValueChange={handleValueChange}>
        <SelectTrigger className="w-40 bg-secondary/50 border-border">
          <CalendarDays className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="7d">7 dias</SelectItem>
          <SelectItem value="15d">15 dias</SelectItem>
          <SelectItem value="30d">30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-48 justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {formatCustomRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleDateRangeChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}