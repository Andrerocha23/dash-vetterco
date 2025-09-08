import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type Period = "today" | "yesterday" | "7d" | "15d" | "30d" | "custom";

interface CustomDateRange {
  from: Date;
  to: Date;
}

interface MobilePeriodSelectorProps {
  value?: Period;
  customRange?: CustomDateRange;
  onValueChange?: (value: Period, customRange?: CustomDateRange) => void;
}

const periodOptions = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "15d", label: "Últimos 15 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "custom", label: "Período personalizado" },
];

export function MobilePeriodSelector({ 
  value = "today", 
  customRange, 
  onValueChange 
}: MobilePeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(value);
  const [dateRange, setDateRange] = useState<CustomDateRange | undefined>(customRange);
  const [showCalendar, setShowCalendar] = useState(false);

  const getCurrentLabel = () => {
    if (selectedPeriod === "custom" && dateRange) {
      return `${format(dateRange.from, "dd/MM", { locale: pt })} - ${format(dateRange.to, "dd/MM", { locale: pt })}`;
    }
    return periodOptions.find(p => p.value === selectedPeriod)?.label || "Período";
  };

  const handlePeriodSelect = (period: Period) => {
    setSelectedPeriod(period);
    if (period === "custom") {
      setShowCalendar(true);
    } else {
      onValueChange?.(period);
      setOpen(false);
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      const newRange = { from: range.from, to: range.to };
      setDateRange(newRange);
      onValueChange?.("custom", newRange);
      setShowCalendar(false);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 text-sm md:hidden"
        >
          <CalendarDays className="h-4 w-4" />
          {getCurrentLabel()}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="text-left">
          <SheetTitle>Selecionar Período</SheetTitle>
        </SheetHeader>

        {showCalendar ? (
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowCalendar(false)}
              className="mb-4"
            >
              ← Voltar aos períodos
            </Button>
            
            <Calendar
              mode="range"
              selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
              onSelect={handleDateRangeChange}
              className="rounded-md border"
              locale={pt}
            />
          </div>
        ) : (
          <ScrollArea className="mt-6">
            <div className="space-y-2">
              {periodOptions.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-between h-12 text-left",
                    selectedPeriod === period.value && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handlePeriodSelect(period.value as Period)}
                >
                  <span>{period.label}</span>
                  {selectedPeriod === period.value && (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}