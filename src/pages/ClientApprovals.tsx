import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Eye, Archive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ClientApprovals() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchRegistrations();
    }
  }, [isAdmin, roleLoading]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("public_client_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar registros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (registration: any) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Create client in clientes table first
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .insert({
          nome: registration.razao_social || registration.nome_fantasia || "Sem nome",
          cnpj: registration.cnpj_cpf,
          email: registration.responsavel_email,
          telefone: registration.responsavel_whatsapp || registration.telefone || "",
          instagram_handle: registration.instagram_handle,
          site: registration.site_url,
        })
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Atualizar status da submissão
      const { error: updateError } = await supabase
        .from("public_client_registrations")
        .update({
          status: "Aprovado",
          approved_by: session?.session?.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (updateError) throw updateError;

      toast({
        title: "Cliente aprovado!",
        description: "O cadastro foi aprovado e o cliente foi criado com sucesso.",
      });

      fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectRegistration = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da recusa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();

      const { error } = await supabase
        .from("public_client_registrations")
        .update({
          status: "Recusado",
          rejection_reason: rejectionReason,
          approved_by: session?.session?.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedRegistration.id);

      if (error) throw error;

      toast({
        title: "Cadastro recusado",
        description: "O motivo foi registrado.",
      });

      fetchRegistrations();
      setShowRejectDialog(false);
      setSelectedRegistration(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        title: "Erro ao recusar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const archiveRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("public_client_registrations")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Registro arquivado" });
      fetchRegistrations();
    } catch (error: any) {
      toast({
        title: "Erro ao arquivar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!isAdmin) {
    return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta página.</div>;
  }

  const pendentes = registrations.filter((r) => r.status === "Pendente" && !r.archived);
  const aprovados = registrations.filter((r) => r.status === "Aprovado");
  const recusados = registrations.filter((r) => r.status === "Recusado");

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovações de Cadastro</h1>
        <p className="text-muted-foreground">Gerencie as solicitações de cadastro de clientes</p>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes <Badge className="ml-2" variant="secondary">{pendentes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="aprovados">
            Aprovados <Badge className="ml-2" variant="secondary">{aprovados.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recusados">
            Recusados <Badge className="ml-2" variant="secondary">{recusados.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma solicitação pendente
              </CardContent>
            </Card>
          ) : (
            pendentes.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                onView={() => setSelectedRegistration(reg)}
                onApprove={() => approveRegistration(reg)}
                onReject={() => {
                  setSelectedRegistration(reg);
                  setShowRejectDialog(true);
                }}
                onArchive={() => archiveRegistration(reg.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="aprovados" className="space-y-4">
          {aprovados.map((reg) => (
            <RegistrationCard key={reg.id} registration={reg} onView={() => setSelectedRegistration(reg)} />
          ))}
        </TabsContent>

        <TabsContent value="recusados" className="space-y-4">
          {recusados.map((reg) => (
            <RegistrationCard key={reg.id} registration={reg} onView={() => setSelectedRegistration(reg)} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog de visualização */}
      {selectedRegistration && !showRejectDialog && (
        <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Detalhes do Cadastro</DialogTitle>
              <DialogDescription>
                Enviado em {new Date(selectedRegistration.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                
                <DetailSection title="Empresa" data={{
                  "Razão Social": selectedRegistration.razao_social,
                  "Nome Fantasia": selectedRegistration.nome_fantasia,
                  "CNPJ/CPF": selectedRegistration.cnpj_cpf,
                }} />
                <DetailSection title="Contato" data={{
                  "Responsável": selectedRegistration.responsavel_nome,
                  "Email": selectedRegistration.responsavel_email,
                  "WhatsApp": selectedRegistration.telefone,
                  "Cargo": selectedRegistration.responsavel_cargo,
                }} />
                <DetailSection title="Orçamento" data={{
                  "Mensal": `R$ ${selectedRegistration.budget_mensal?.toLocaleString('pt-BR')}`,
                }} />
              </div>
            </ScrollArea>
            <DialogFooter>
              {selectedRegistration.status === "Pendente" && (
                <>
                  <Button variant="outline" onClick={() => { setShowRejectDialog(true); }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Recusar
                  </Button>
                  <Button onClick={() => approveRegistration(selectedRegistration)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de recusa */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Cadastro</DialogTitle>
            <DialogDescription>Informe o motivo da recusa</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da recusa..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={rejectRegistration}>Confirmar Recusa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegistrationCard({ registration, onView, onApprove, onReject, onArchive }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{registration.razao_social || registration.nome_fantasia}</CardTitle>
            <p className="text-sm text-muted-foreground">{registration.responsavel_email}</p>
          </div>
          <Badge variant={
            registration.status === "Pendente" ? "default" :
            registration.status === "Aprovado" ? "default" : "destructive"
          }>
            {registration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
          {onApprove && (
            <Button size="sm" onClick={onApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="destructive" onClick={onReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Recusar
            </Button>
          )}
          {onArchive && (
            <Button size="sm" variant="outline" onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSection({ title, data }: { title: string; data: Record<string, any> }) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">{title}</h4>
      <dl className="space-y-1 text-sm">
        {Object.entries(data).map(([key, value]) => value && (
          <div key={key} className="flex justify-between">
            <dt className="text-muted-foreground">{key}:</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
