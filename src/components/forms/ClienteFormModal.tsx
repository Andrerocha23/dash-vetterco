import { useState } from "react";
import { Plus, Copy, X } from "lucide-react";
import { ClienteFormData } from "@/types/client";
import { ClientForm } from "./ClientForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULTS: Partial<ClienteFormData> = {
  nomeCliente: "",
  nomeEmpresa: "",
  telefone: "",
  email: "",
  gestorId: "",
  canais: [],
  status: "Ativo",
  linkDrive: "",
  idGrupo: "",
  canalRelatorio: "WhatsApp",
  horarioRelatorio: "09:00",
  templatesPadrao: [],

  // Meta Ads
  usaMetaAds: false,
  metaAccountId: "",
  metaBusinessId: "",
  metaPageId: "",
  modoSaldoMeta: "Pix",
  monitorarSaldoMeta: false,
  saldoMeta: 0,
  alertaSaldoBaixo: 0,
  budgetMensalMeta: 0,
  linkMeta: "",
  utmPadrao: "",
  webhookMeta: "",

  // Google Ads
  usaGoogleAds: false,
  googleAdsId: "",
  budgetMensalGoogle: 0,
  conversoes: [],
  linkGoogle: "",
  webhookGoogle: "",

  // Rastreamento & Analytics
  traqueamentoAtivo: false,
  pixelMeta: "",
  ga4StreamId: "",
  gtmId: "",
  typebotAtivo: false,
  typebotUrl: "",

  // Financeiro
  budgetMensalGlobal: 0,
  formaPagamento: "Pix",
  centroCusto: "",
  contratoInicio: "",
  contratoRenovacao: "",

  // Permissões
  papelPadrao: "Usuário padrão",
  usuariosVinculados: []
};

interface ClienteFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ClienteFormData>;
  onSubmit: (values: ClienteFormData) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ClienteFormModal({ 
  mode,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  trigger
}: ClienteFormModalProps) {
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [openDetailsAfterSave, setOpenDetailsAfterSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = mode === "edit";
  const client = initialValues ? { ...DEFAULTS, ...initialValues } as ClienteFormData : { ...DEFAULTS } as ClienteFormData;

  const handleSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      
      toast({
        title: "Cliente salvo com sucesso!",
        description: `${data.nomeCliente} foi ${isEdit ? 'atualizado' : 'criado'} com sucesso.`,
      });
      
      setIsDirty(false);
      onOpenChange(false);
      
      // TODO: Implementar redirecionamento para detalhes se openDetailsAfterSave estiver marcado
      if (mode === "create" && openDetailsAfterSave) {
        // navigate(`/clients/${newClientId}`)
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setIsDirty(false);
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  const handleDuplicate = () => {
    if (!initialValues) return;
    
    const duplicatedClient = {
      ...initialValues,
      id: undefined,
      nomeCliente: `${initialValues.nomeCliente} (Cópia)`,
      nomeEmpresa: `${initialValues.nomeEmpresa} (Cópia)`,
    };
    
    toast({
      title: "Cliente duplicado",
      description: "Um novo cliente foi criado como cópia.",
    });
    
    // TODO: Implementar duplicação
    // onSubmit(duplicatedClient);
  };

  const getImplementationBadges = (client?: Partial<ClienteFormData>) => {
    if (!client) return [];
    
    return [
      { name: "Pixel", active: !!client.pixelMeta, color: "blue" },
      { name: "GA4", active: !!client.ga4StreamId, color: "green" },
      { name: "UTM", active: !!client.utmPadrao, color: "purple" },
      { name: "Typebot", active: client.typebotAtivo, color: "orange" },
    ];
  };

  const DefaultTrigger = () => (
    <Button variant="apple" className="gap-2">
      <Plus className="h-4 w-4" />
      Novo Cliente
    </Button>
  );

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isDirty) {
      onOpenChange(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // TODO: Trigger form submit
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        {trigger && (
          <div onClick={() => onOpenChange(true)}>
            {trigger}
          </div>
        )}
        
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col surface-glass"
          onKeyDown={handleKeyDown as any}
        >
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold">
                  {isEdit ? `Editar Cliente: ${client.nomeCliente}` : "Adicionar Cliente"}
                </DialogTitle>
                {isEdit && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {getImplementationBadges(client).map((badge) => (
                        <Badge
                          key={badge.name}
                          variant={badge.active ? "default" : "secondary"}
                          className={
                            badge.active 
                              ? "bg-green-500/20 text-green-400 border-green-500/50" 
                              : "bg-red-500/20 text-red-400 border-red-500/50"
                          }
                        >
                          {badge.active ? "✓" : "✗"} {badge.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </Button>
                )}
                
                {mode === "create" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="openDetails"
                      checked={openDetailsAfterSave}
                      onCheckedChange={(checked) => setOpenDetailsAfterSave(checked === true)}
                    />
                    <label 
                      htmlFor="openDetails" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Abrir detalhamento após salvar
                    </label>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <ClientForm
              client={client}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEdit={isEdit}
              onDirtyChange={setIsDirty}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza de que deseja descartar essas alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscardChanges}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}