import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { Lead } from "@/types/feedback";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientManagers } from "@/hooks/useClientManagers";

interface FeedbackTableProps {
  leads: Lead[];
  loading: boolean;
  onOpenFeedback: (lead: Lead) => void;
}

const statusVariants = {
  "Pendente": "secondary",
  "Qualificado": "default", 
  "Desqualificado": "destructive",
  "Convertido": "default"
} as const;

const origemVariants = {
  "Meta": "default",
  "Google": "secondary",
  "Orgânico": "outline",
  "Outro": "secondary"
} as const;

const contasMock = [
  { id: "cli_001", nome: "House Gestão" },
  { id: "cli_002", nome: "Construtora Alpha" },
  { id: "cli_003", nome: "Imóveis Beta" }
];


export function FeedbackTable({ leads, loading, onOpenFeedback }: FeedbackTableProps) {
  const { managers, getManagerName } = useClientManagers();
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
      />
    ));
  };

  return (
    <>
      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Carregando...
          </Card>
        ) : leads.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum lead encontrado
          </Card>
        ) : (
          leads.map((lead) => {
            const conta = contasMock.find(c => c.id === lead.contaId);
            const responsavel = lead.responsavelId ? getManagerName(lead.responsavelId) : null;
            
            return (
              <MobileTableCard
                key={lead.id}
                title={lead.nome}
                subtitle={`${lead.telefone} • ${lead.email} • ${format(new Date(lead.criadoEm), "dd/MM/yy HH:mm", { locale: ptBR })}`}
                badges={[
                  {
                    label: lead.status,
                    variant: statusVariants[lead.status],
                  },
                  {
                    label: lead.origem,
                    variant: origemVariants[lead.origem],
                  },
                  ...(conta ? [{
                    label: conta.nome,
                    variant: "outline" as const,
                  }] : [])
                ]}
                actions={
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onOpenFeedback(lead)}
                    className="w-full"
                  >
                    Feedback
                  </Button>
                }
              >
                <div className="space-y-2 text-sm">
                  {lead.campanha && (
                    <div>
                      <span className="text-muted-foreground">Campanha:</span> {lead.campanha}
                    </div>
                  )}
                  {responsavel && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Responsável:</span>
                       <Avatar className="w-4 h-4">
                         <AvatarFallback className="text-xs">
                           {responsavel.split(' ').map((n: string) => n[0]).join('')}
                         </AvatarFallback>
                       </Avatar>
                       <span>{responsavel}</span>
                    </div>
                  )}
                  {lead.feedback ? (
                    <div>
                      <span className="text-muted-foreground">Feedback:</span> {lead.feedback.status}
                      {lead.feedback.nota && (
                        <div className="flex gap-1 mt-1">
                          {renderStars(lead.feedback.nota)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground">Feedback:</span> Pendente
                    </div>
                  )}
                </div>
              </MobileTableCard>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const conta = contasMock.find(c => c.id === lead.contaId);
                const responsavel = lead.responsavelId ? getManagerName(lead.responsavelId) : null;
                
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.telefone} • {lead.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{conta?.nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={origemVariants[lead.origem]}>
                        {lead.origem}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.campanha || "—"}</TableCell>
                    <TableCell>
                      {format(new Date(lead.criadoEm), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[lead.status]}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.feedback ? (
                        <div className="space-y-1">
                          <div className="text-sm">{lead.feedback.status}</div>
                          {lead.feedback.nota && (
                            <div className="flex gap-1">
                              {renderStars(lead.feedback.nota)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pendente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {responsavel && (
                        <div className="flex items-center gap-2">
                           <Avatar className="w-6 h-6">
                             <AvatarFallback className="text-xs">
                               {responsavel.split(' ').map((n: string) => n[0]).join('')}
                             </AvatarFallback>
                           </Avatar>
                           <span className="text-sm">{responsavel}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenFeedback(lead)}
                      >
                        Ver/Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}