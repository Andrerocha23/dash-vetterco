export interface RelatorioN8n {
  contaId: string;
  contaNome: string;
  idGrupo: string;
  metaAccountId?: string;
  googleAdsId?: string;
  ativo: boolean;
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