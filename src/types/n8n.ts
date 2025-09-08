export interface RelatorioN8n {
  contaId: string;
  contaNome: string;
  idGrupo: string;
  canal: "WhatsApp" | "Email" | "Ambos";
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
  canal: "WhatsApp" | "Email" | "Ambos";
  horarioPadrao: string;
}