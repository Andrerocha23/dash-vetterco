import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LeadFilters, LeadStatus, Origem } from "@/types/feedback";
import { useClientManagers } from "@/hooks/useClientManagers";

interface FeedbackFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

const contasMock = [
  { id: "cli_001", nome: "House Gestão" },
  { id: "cli_002", nome: "Construtora Alpha" },
  { id: "cli_003", nome: "Imóveis Beta" }
];

export function FeedbackFilters({ filters, onFiltersChange }: FeedbackFiltersProps) {
  const { managers, loading: loadingManagers } = useClientManagers();
  
  const updateFilter = (key: keyof LeadFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <>
      {/* Desktop Filters */}
      <Card className="p-4 hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={filters.busca || ""}
              onChange={(e) => updateFilter("busca", e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filters.contaId || "all"} onValueChange={(value) => updateFilter("contaId", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {contasMock.map(conta => (
                <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Qualificado">Qualificado</SelectItem>
              <SelectItem value="Desqualificado">Desqualificado</SelectItem>
              <SelectItem value="Convertido">Convertido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.origem || "all"} onValueChange={(value) => updateFilter("origem", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Meta">Meta</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Orgânico">Orgânico</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.responsavelId || "all"} onValueChange={(value) => updateFilter("responsavelId", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {!loadingManagers && managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
              ))}
              {loadingManagers && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Mobile Filters Accordion */}
      <Card className="md:hidden">
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={filters.busca || ""}
              onChange={(e) => updateFilter("busca", e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <Select value={filters.contaId || "all"} onValueChange={(value) => updateFilter("contaId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {contasMock.map(conta => (
                        <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Qualificado">Qualificado</SelectItem>
                      <SelectItem value="Desqualificado">Desqualificado</SelectItem>
                      <SelectItem value="Convertido">Convertido</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.origem || "all"} onValueChange={(value) => updateFilter("origem", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Meta">Meta</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Orgânico">Orgânico</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.responsavelId || "all"} onValueChange={(value) => updateFilter("responsavelId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {!loadingManagers && managers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                      ))}
                      {loadingManagers && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Card>
    </>
  );
}