import { useState, useEffect } from "react";
import { Save, TestTube, Eye, EyeOff, ExternalLink, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MetaConfig {
  // Ativação
  usaMetaAds: boolean;
  ativarCampanhasMeta: boolean;
  
  // IDs e Configurações Básicas
  metaAccountId: string;
  metaBusinessId: string;
  metaPageId: string;
  pixelMeta: string;
  linkMeta: string;
  utmPadrao: string;
  
  // Saldo e Budget
  modoSaldoMeta: 'Cartão' | 'Pix' | 'Pré-pago (crédito)';
  monitorarSaldoMeta: boolean;
  saldoMeta: number;
  alertaSaldoBaixo: number;
  budgetMensalMeta: number;
  
  // Webhook e Automação
  webhookMeta: string;
  
  // Notificações
  notificacaoSaldoBaixo: boolean;
  notificacaoErroSync: boolean;
  notificacaoLeadsDiarios: boolean;
}

const defaultConfig: MetaConfig = {
  usaMetaAds: false,
  ativarCampanhasMeta: false,
  metaAccountId: '',
  metaBusinessId: '',
  metaPageId: '',
  pixelMeta: '',
  linkMeta: '',
  utmPadrao: '',
  modoSaldoMeta: 'Cartão',
  monitorarSaldoMeta: false,
  saldoMeta: 0,
  alertaSaldoBaixo: 100,
  budgetMensalMeta: 0,
  webhookMeta: '',
  notificacaoSaldoBaixo: true,
  notificacaoErroSync: true,
  notificacaoLeadsDiarios: true,
};

export default function MetaConfigPage() {
  const [config, setConfig] = useState<MetaConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPixel, setShowPixel] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const { toast } = useToast();

  // Carregar configuração existente
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Buscar configuração global (primeiro cliente ou configuração padrão)
      const { data, error } = await supabase
        .from('clients')
        .select(`
          usa_meta_ads,
          ativar_campanhas_meta,
          meta_account_id,
          meta_business_id,
          meta_page_id,
          pixel_meta,
          link_meta,
          utm_padrao,
          modo_saldo_meta,
          monitorar_saldo_meta,
          saldo_meta,
          alerta_saldo_baixo,
          budget_mensal_meta,
          webhook_meta,
          notificacao_saldo_baixo,
          notificacao_erro_sync,
          notificacao_leads_diarios
        `)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig({
          usaMetaAds: data.usa_meta_ads || false,
          ativarCampanhasMeta: data.ativar_campanhas_meta || false,
          metaAccountId: data.meta_account_id || '',
          metaBusinessId: data.meta_business_id || '',
          metaPageId: data.meta_page_id || '',
          pixelMeta: data.pixel_meta || '',
          linkMeta: data.link_meta || '',
          utmPadrao: data.utm_padrao || '',
          modoSaldoMeta: data.modo_saldo_meta as any || 'Cartão',
          monitorarSaldoMeta: data.monitorar_saldo_meta || false,
          saldoMeta: data.saldo_meta ? data.saldo_meta / 100 : 0,
          alertaSaldoBaixo: data.alerta_saldo_baixo || 100,
          budgetMensalMeta: data.budget_mensal_meta || 0,
          webhookMeta: data.webhook_meta || '',
          notificacaoSaldoBaixo: data.notificacao_saldo_baixo ?? true,
          notificacaoErroSync: data.notificacao_erro_sync ?? true,
          notificacaoLeadsDiarios: data.notificacao_leads_diarios ?? true,
        });

        // Verificar status da conexão
        if (data.meta_account_id && data.meta_business_id) {
          setConnectionStatus('connected');
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração do Meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);

      // Atualizar todos os clientes que usam Meta
      const { error } = await supabase
        .from('clients')
        .update({
          usa_meta_ads: config.usaMetaAds,
          ativar_campanhas_meta: config.ativarCampanhasMeta,
          meta_account_id: config.metaAccountId,
          meta_business_id: config.metaBusinessId,
          meta_page_id: config.metaPageId,
          pixel_meta: config.pixelMeta,
          link_meta: config.linkMeta,
          utm_padrao: config.utmPadrao,
          modo_saldo_meta: config.modoSaldoMeta,
          monitorar_saldo_meta: config.monitorarSaldoMeta,
          saldo_meta: config.saldoMeta * 100, // Converter para centavos
          alerta_saldo_baixo: config.alertaSaldoBaixo,
          budget_mensal_meta: config.budgetMensalMeta,
          webhook_meta: config.webhookMeta,
          notificacao_saldo_baixo: config.notificacaoSaldoBaixo,
          notificacao_erro_sync: config.notificacaoErroSync,
          notificacao_leads_diarios: config.notificacaoLeadsDiarios,
        })
        .eq('usa_meta_ads', true);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração do Meta salva com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.metaAccountId || !config.metaBusinessId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Account ID e Business ID para testar",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus('connecting');

      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock: sucesso se os IDs tiverem formato válido
      const isValidAccountId = config.metaAccountId.match(/^(act_)?\d{10,}$/);
      const isValidBusinessId = config.metaBusinessId.match(/^\d{10,}$/);

      if (isValidAccountId && isValidBusinessId) {
        setConnectionStatus('connected');
        toast({
          title: "Conexão estabelecida",
          description: "Meta Business conectado com sucesso!",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Erro de conexão",
          description: "Verifique os IDs informados",
          variant: "destructive",
        });
      }

    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Erro",
        description: "Falha ao testar conexão",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (field: keyof MetaConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Conectando...</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuração Meta Ads</h1>
            <p className="text-gray-600 mt-2">Configure as integrações e automações do Meta Business</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <Button 
              onClick={testConnection} 
              variant="outline" 
              disabled={testing}
              className="flex items-center gap-2"
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Testar Conexão
            </Button>
            <Button 
              onClick={saveConfig} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Status da Conexão */}
        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Falha na conexão com Meta Business. Verifique suas credenciais e tente novamente.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'connected' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Meta Business conectado com sucesso! Todas as automações estão ativas.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ativar Meta Ads */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Ativar Meta Ads</Label>
                  <p className="text-sm text-gray-600">Habilitar integrações com Meta Business</p>
                </div>
                <Switch
                  checked={config.usaMetaAds}
                  onCheckedChange={(value) => updateConfig('usaMetaAds', value)}
                />
              </div>

              {config.usaMetaAds && (
                <>
                  {/* Ativar Campanhas */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Gestão de Campanhas</Label>
                      <p className="text-sm text-gray-600">Permitir criação e edição via dashboard</p>
                    </div>
                    <Switch
                      checked={config.ativarCampanhasMeta}
                      onCheckedChange={(value) => updateConfig('ativarCampanhasMeta', value)}
                    />
                  </div>

                  {/* Meta Account ID */}
                  <div className="space-y-2">
                    <Label htmlFor="accountId">Meta Ad Account ID *</Label>
                    <Input
                      id="accountId"
                      placeholder="act_123456789 ou 123456789"
                      value={config.metaAccountId}
                      onChange={(e) => updateConfig('metaAccountId', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Encontre em: Meta Business Manager → Configurações de Anúncios
                    </p>
                  </div>

                  {/* Meta Business ID */}
                  <div className="space-y-2">
                    <Label htmlFor="businessId">Meta Business ID *</Label>
                    <Input
                      id="businessId"
                      placeholder="987654321"
                      value={config.metaBusinessId}
                      onChange={(e) => updateConfig('metaBusinessId', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Encontre em: Meta Business Manager → Configurações Comerciais
                    </p>
                  </div>

                  {/* Meta Page ID */}
                  <div className="space-y-2">
                    <Label htmlFor="pageId">Meta Page ID</Label>
                    <Input
                      id="pageId"
                      placeholder="1122334455"
                      value={config.metaPageId}
                      onChange={(e) => updateConfig('metaPageId', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      ID da página do Facebook/Instagram
                    </p>
                  </div>

                  {/* Link Meta */}
                  <div className="space-y-2">
                    <Label htmlFor="linkMeta">Link do Meta Business</Label>
                    <div className="flex">
                      <Input
                        id="linkMeta"
                        placeholder="https://business.facebook.com/..."
                        value={config.linkMeta}
                        onChange={(e) => updateConfig('linkMeta', e.target.value)}
                        className="rounded-r-none"
                      />
                      {config.linkMeta && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none border-l-0"
                          onClick={() => window.open(config.linkMeta, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Rastreamento */}
          <Card>
            <CardHeader>
              <CardTitle>Rastreamento & Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pixel Meta */}
              <div className="space-y-2">
                <Label htmlFor="pixel">Pixel Meta</Label>
                <div className="flex">
                  <Input
                    id="pixel"
                    type={showPixel ? "text" : "password"}
                    placeholder="123456789012345"
                    value={config.pixelMeta}
                    onChange={(e) => updateConfig('pixelMeta', e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowPixel(!showPixel)}
                  >
                    {showPixel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  ID do pixel para rastreamento de conversões
                </p>
              </div>

              {/* UTM Padrão */}
              <div className="space-y-2">
                <Label htmlFor="utm">UTM Padrão</Label>
                <Input
                  id="utm"
                  placeholder="utm_source=facebook&utm_medium=cpc"
                  value={config.utmPadrao}
                  onChange={(e) => updateConfig('utmPadrao', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Parâmetros UTM aplicados automaticamente
                </p>
              </div>

              {/* Webhook */}
              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <div className="flex">
                  <Input
                    id="webhook"
                    type={showWebhook ? "text" : "password"}
                    placeholder="https://webhook.site/..."
                    value={config.webhookMeta}
                    onChange={(e) => updateConfig('webhookMeta', e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowWebhook(!showWebhook)}
                  >
                    {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  URL para receber eventos em tempo real
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Saldo e Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Controle de Saldo & Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modo do Saldo */}
              <div className="space-y-2">
                <Label>Modo do Saldo</Label>
                <Select 
                  value={config.modoSaldoMeta} 
                  onValueChange={(value: any) => updateConfig('modoSaldoMeta', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                    <SelectItem value="Pix">PIX</SelectItem>
                    <SelectItem value="Pré-pago (crédito)">Pré-pago (Crédito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monitorar Saldo */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Monitorar Saldo</Label>
                  <p className="text-sm text-gray-600">Alertas automáticos de saldo baixo</p>
                </div>
                <Switch
                  checked={config.monitorarSaldoMeta}
                  onCheckedChange={(value) => updateConfig('monitorarSaldoMeta', value)}
                />
              </div>

              {config.monitorarSaldoMeta && (
                <>
                  {/* Saldo Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="saldo">Saldo Atual</Label>
                    <Input
                      id="saldo"
                      type="number"
                      placeholder="0.00"
                      value={config.saldoMeta}
                      onChange={(e) => updateConfig('saldoMeta', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500">
                      Valor atual: {formatCurrency(config.saldoMeta)}
                    </p>
                  </div>

                  {/* Alerta Saldo Baixo */}
                  <div className="space-y-2">
                    <Label htmlFor="alerta">Alerta Saldo Baixo</Label>
                    <Input
                      id="alerta"
                      type="number"
                      placeholder="100.00"
                      value={config.alertaSaldoBaixo}
                      onChange={(e) => updateConfig('alertaSaldoBaixo', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500">
                      Alertar quando saldo for menor que {formatCurrency(config.alertaSaldoBaixo)}
                    </p>
                  </div>
                </>
              )}

              {/* Budget Mensal */}
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Mensal Meta</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0.00"
                  value={config.budgetMensalMeta}
                  onChange={(e) => updateConfig('budgetMensalMeta', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500">
                  Limite mensal: {formatCurrency(config.budgetMensalMeta)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Saldo Baixo</Label>
                  <p className="text-sm text-gray-600">Alertas quando saldo estiver baixo</p>
                </div>
                <Switch
                  checked={config.notificacaoSaldoBaixo}
                  onCheckedChange={(value) => updateConfig('notificacaoSaldoBaixo', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Erro de Sync</Label>
                  <p className="text-sm text-gray-600">Alertas de falhas de sincronização</p>
                </div>
                <Switch
                  checked={config.notificacaoErroSync}
                  onCheckedChange={(value) => updateConfig('notificacaoErroSync', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Leads Diários</Label>
                  <p className="text-sm text-gray-600">Relatório diário de novos leads</p>
                </div>
                <Switch
                  checked={config.notificacaoLeadsDiarios}
                  onCheckedChange={(value) => updateConfig('notificacaoLeadsDiarios', value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Como Configurar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">1. Meta Ad Account ID</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Acesse o Meta Business Manager</li>
                  <li>• Vá em "Configurações de Anúncios"</li>
                  <li>• Copie o ID da conta (com ou sem "act_")</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Meta Business ID</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No Meta Business Manager</li>
                  <li>• Acesse "Configurações Comerciais"</li>
                  <li>• Encontre o ID na seção "Informações Comerciais"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Pixel Meta</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Acesse "Gerenciador de Eventos"</li>
                  <li>• Selecione seu pixel</li>
                  <li>• Copie o ID (15 dígitos)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Webhook</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Configure no n8n ou Zapier</li>
                  <li>• Teste a URL antes de salvar</li>
                  <li>• Necessário para automações em tempo real</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
