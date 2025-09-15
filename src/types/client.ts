export type Canal = "Meta" | "Google";
export type Pagamento = "Cartão" | "Pix" | "Boleto" | "Misto";
export type Status = "Ativo" | "Pausado" | "Arquivado";
export type ModoSaldo = "Cartão" | "Pix" | "Pré-pago (crédito)";
export type CanalRelatorio = "WhatsApp" | "Email" | "Ambos";
export type PapelPadrao = "Usuário padrão" | "Gestor" | "Administrador";

export interface ClientWithManager {
  id: string;
  name: string;
  manager: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  channels: ('Meta' | 'Google')[];
  status: 'Active' | 'Paused' | 'Archived';
  activeCampaigns: number;
  metaBalance: number;
  createdOn: string;
  rawData?: any;
}

export interface ClienteFormData {
  id?: string;

  // Informações Básicas
  nomeCliente: string;
  nomeEmpresa: string;
  telefone: string;
  email?: string;
  gestorId: string;
  linkDrive?: string;
  canais: Canal[];
  status: Status;
  observacoes?: string;
  idGrupo?: string;
  usaCrmExterno?: boolean;
  urlCrm?: string;

  // Meta Ads
  usaMetaAds: boolean;
  ativarCampanhasMeta?: boolean;
  metaAccountId?: string;
  metaBusinessId?: string;
  metaPageId?: string;
  modoSaldoMeta?: ModoSaldo;
  monitorarSaldoMeta?: boolean;
  saldoMeta?: number;
  alertaSaldoBaixo?: number;
  budgetMensalMeta?: number;
  linkMeta?: string;
  utmPadrao?: string;
  webhookMeta?: string;

  // Google Ads
  usaGoogleAds: boolean;
  googleAdsId?: string;
  budgetMensalGoogle?: number;
  conversoes?: string[];
  linkGoogle?: string;
  webhookGoogle?: string;

  // Comunicação & Automação
  canalRelatorio?: CanalRelatorio;
  horarioRelatorio?: string;
  templatesPadrao?: string[];
  notificacaoSaldoBaixo?: boolean;
  notificacaoErroSync?: boolean;
  notificacaoLeadsDiarios?: boolean;

  // Rastreamento & Analytics
  traqueamentoAtivo: boolean;
  pixelMeta?: string;
  ga4StreamId?: string;
  gtmId?: string;
  typebotAtivo?: boolean;
  typebotUrl?: string;

  // Financeiro & Orçamento
  budgetMensalGlobal?: number;
  formaPagamento?: Pagamento;
  centroCusto?: string;
  contratoInicio?: string;
  contratoRenovacao?: string;

  // Permissões & Atribuições
  papelPadrao?: PapelPadrao;
  usuariosVinculados?: string[];
  ocultarRanking?: boolean;
  somarMetricas?: boolean;
}

export interface Gestor {
  id: string;
  nome: string;
  avatar: string;
}

export interface Template {
  id: string;
  nome: string;
  categoria: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
}