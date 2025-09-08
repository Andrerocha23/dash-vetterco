import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead, FeedbackPayload, LeadStatus, EtapaFunil } from "@/types/feedback";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: Lead | null;
  feedbackForm: FeedbackPayload;
  onFeedbackFormChange: (form: FeedbackPayload) => void;
  onSave: () => void;
}

const motivosDesqualificacao = [
  "Sem resposta",
  "Telefone inválido", 
  "Fora do perfil",
  "Preço",
  "Localização",
  "Outro"
];

const tagsDisponiveis = [
  "Urgente",
  "VIP", 
  "Recontato",
  "Follow-up",
  "Interessado",
  "Indeciso"
];

const contasMock = [
  { id: "cli_001", nome: "House Gestão" },
  { id: "cli_002", nome: "Construtora Alpha" },
  { id: "cli_003", nome: "Imóveis Beta" }
];

export function FeedbackModal({ 
  open, 
  onOpenChange, 
  selectedLead, 
  feedbackForm, 
  onFeedbackFormChange, 
  onSave 
}: FeedbackModalProps) {
  const updateForm = (updates: Partial<FeedbackPayload>) => {
    onFeedbackFormChange({ ...feedbackForm, ...updates });
  };

  const toggleMotivo = (motivo: string) => {
    const motivos = feedbackForm.motivo || [];
    if (motivos.includes(motivo)) {
      updateForm({ motivo: motivos.filter(m => m !== motivo) });
    } else {
      updateForm({ motivo: [...motivos, motivo] });
    }
  };

  const toggleTag = (tag: string) => {
    const tags = feedbackForm.tags || [];
    if (tags.includes(tag)) {
      updateForm({ tags: tags.filter(t => t !== tag) });
    } else {
      updateForm({ tags: [...tags, tag] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback do Lead</DialogTitle>
        </DialogHeader>
        
        {selectedLead && (
          <div className="space-y-4">
            {/* Cabeçalho do Lead */}
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nome:</strong> {selectedLead.nome}
                </div>
                <div>
                  <strong>Telefone:</strong> {selectedLead.telefone}
                </div>
                <div>
                  <strong>Email:</strong> {selectedLead.email}
                </div>
                <div>
                  <strong>Origem:</strong> {selectedLead.origem}
                </div>
                <div>
                  <strong>Campanha:</strong> {selectedLead.campanha || "—"}
                </div>
                <div>
                  <strong>Conta:</strong> {contasMock.find(c => c.id === selectedLead.contaId)?.nome}
                </div>
              </div>
            </Card>

            {/* Formulário */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={feedbackForm.status} 
                  onValueChange={(value: LeadStatus) => updateForm({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Qualificado">Qualificado</SelectItem>
                    <SelectItem value="Desqualificado">Desqualificado</SelectItem>
                    <SelectItem value="Convertido">Convertido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Etapa do Funil</Label>
                <Select 
                  value={feedbackForm.etapa || ""} 
                  onValueChange={(value: EtapaFunil) => updateForm({ etapa: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Contato">Contato</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Visita">Visita</SelectItem>
                    <SelectItem value="Proposta">Proposta</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Motivos quando desqualificado */}
            {feedbackForm.status === "Desqualificado" && (
              <div>
                <Label>Motivos da Desqualificação</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {motivosDesqualificacao.map(motivo => (
                    <div key={motivo} className="flex items-center space-x-2">
                      <Checkbox
                        checked={feedbackForm.motivo?.includes(motivo) || false}
                        onCheckedChange={() => toggleMotivo(motivo)}
                      />
                      <label className="text-sm">{motivo}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota */}
            <div>
              <Label>Nota (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => updateForm({ nota: rating })}
                  >
                    <Star
                      className={`w-6 h-6 ${rating <= (feedbackForm.nota || 0) ? "fill-warning text-warning" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tagsDisponiveis.map(tag => (
                  <Badge
                    key={tag}
                    variant={feedbackForm.tags?.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <Label>Comentário</Label>
              <Textarea
                value={feedbackForm.comentario || ""}
                onChange={(e) => updateForm({ comentario: e.target.value })}
                placeholder="Adicione observações sobre o lead..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}