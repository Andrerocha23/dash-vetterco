export interface RelatorioN8n {
  contaId: string;
  contaNome: string;
  idGrupo: string;
  metaAccountId?: string;
  googleAdsId?: string;
  ativoMeta: boolean;
  ativoGoogle: boolean;
  ultimoEnvio?: string; // ISO
  horarioPadrao?: string;
}

export interface RelatorioFilters {
  busca?: string;
  status?: "Ativo" | "Inativo" | "Todos";
}

export interface ConfigurarDisparoPayload {
  idGrupo: string;
  horarioPadrao: string;
}