import { useState, useEffect } from "react";
import { Search, Settings, TestTube } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { n8nService } from "@/mocks/n8nService";
import { type RelatorioN8n, RelatorioFilters, ConfigurarDisparoPayload } from "@/types/n8n";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const canalColors = {
  "WhatsApp": "bg-green-500/10 text-green-700 border-green-500/20",
  "Email": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "Ambos": "bg-purple-500/10 text-purple-700 border-purple-500/20"
};

export default function RelatorioN8n() {
  const [relatorios, setRelatorios] = useState<RelatorioN8n[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RelatorioFilters>({});
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioN8n | null>(null);
  const [configModal, setConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<ConfigurarDisparoPayload>({
    idGrupo: "",
    canal: "WhatsApp",
    horarioPadrao: "09:00"
  });
  const [testingDisparo, setTestingDisparo] = useState<string | null>(null);

  const { toast } = useToast();

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const data = await n8nService.listRelatorios(filters);
      setRelatorios(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelatorios();
  }, [filters]);

  const handleToggleAtivo = async (contaId: string) => {
    try {
      const novoStatus = await n8nService.toggleAtivo(contaId);
      setRelatorios(relatorios.map(rel => 
        rel.contaId === contaId 
          ? { ...rel, ativo: novoStatus }
          : rel
      ));
      
      const relatorio = relatorios.find(r => r.contaId === contaId);
      toast({
        title: "Sucesso",
        description: `Disparo ${novoStatus ? "ativado" : "desativado"} para ${relatorio?.contaNome}`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do disparo",
        variant: "destructive"
      });
    }
  };

  const handleTestarDisparo = async (contaId: string) => {
    setTestingDisparo(contaId);
    try {
      const result = await n8nService.testarDisparo(contaId);
      
      toast({
        title: result.ok ? "Sucesso" : "Erro",
        description: result.message,
        variant: result.ok ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar disparo",
        variant: "destructive"
      });
    } finally {
      setTestingDisparo(null);
    }
  };

  const handleOpenConfig = (relatorio: RelatorioN8n) => {
    setSelectedRelatorio(relatorio);
    setConfigForm({
      idGrupo: relatorio.idGrupo,
      canal: relatorio.canal,
      horarioPadrao: relatorio.horarioPadrao || "09:00"
    });
    setConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedRelatorio) return;
    
    try {
      await n8nService.configurarDisparo(selectedRelatorio.contaId, configForm);
      await loadRelatorios();
      setConfigModal(false);
      
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório n8n</h1>
            <p className="text-muted-foreground">Configuração de disparos automáticos por conta</p>
          </div>
        </div>

        {/* Banner informativo */}
        <Alert>
          <AlertDescription>
            Este painel controla apenas a superfície de configuração. O envio real é orquestrado pelo n8n.
          </AlertDescription>
        </Alert>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por conta ou ID do grupo..."
                value={filters.busca || ""}
                onChange={(e) => setFilters({...filters, busca: e.target.value})}
                className="pl-9"
              />
            </div>
            
            <Select value={filters.status || "Todos"} onValueChange={(value) => setFilters({...filters, status: value as any})}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>ID do Grupo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Último Envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : relatorios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum relatório encontrado
                  </TableCell>
                </TableRow>
              ) : (
                relatorios.map((relatorio) => (
                  <TableRow key={relatorio.contaId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {relatorio.contaNome.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{relatorio.contaNome}</div>
                          <div className="text-sm text-muted-foreground">ID: {relatorio.contaId}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {relatorio.idGrupo}
                      </code>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={canalColors[relatorio.canal]}>
                        {relatorio.canal}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={relatorio.ativo}
                          onCheckedChange={() => handleToggleAtivo(relatorio.contaId)}
                        />
                        <span className={`text-sm ${relatorio.ativo ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {relatorio.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {relatorio.ultimoEnvio ? (
                        <div>
                          <div className="text-sm">
                            {format(new Date(relatorio.ultimoEnvio), "dd/MM/yy", { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(relatorio.ultimoEnvio), "HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestarDisparo(relatorio.contaId)}
                          disabled={testingDisparo === relatorio.contaId || !relatorio.ativo}
                          className="flex items-center gap-1"
                        >
                          <TestTube className="w-3 h-3" />
                          {testingDisparo === relatorio.contaId ? "Testando..." : "Testar"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConfig(relatorio)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Modal Configuração */}
        <Dialog open={configModal} onOpenChange={setConfigModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Disparo</DialogTitle>
            </DialogHeader>
            
            {selectedRelatorio && (
              <div className="space-y-4">
                {/* Info da conta */}
                <Card className="p-3 bg-muted/50">
                  <div className="text-sm">
                    <strong>Conta:</strong> {selectedRelatorio.contaNome}
                  </div>
                </Card>

                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idGrupo">ID do Grupo</Label>
                    <Input
                      id="idGrupo"
                      value={configForm.idGrupo}
                      onChange={(e) => setConfigForm({...configForm, idGrupo: e.target.value})}
                      placeholder="Ex: 120363042@g.us"
                    />
                  </div>

                  <div>
                    <Label htmlFor="canal">Canal de Relatório</Label>
                    <Select value={configForm.canal} onValueChange={(value: any) => setConfigForm({...configForm, canal: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário Padrão</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={configForm.horarioPadrao}
                      onChange={(e) => setConfigForm({...configForm, horarioPadrao: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}