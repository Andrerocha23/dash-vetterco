export type LeadStatus = "Pendente" | "Qualificado" | "Desqualificado" | "Convertido";
export type Origem = "Meta" | "Google" | "Orgânico" | "Outro";
export type EtapaFunil = "Novo" | "Contato" | "Agendado" | "Visita" | "Proposta" | "Vencido";

export interface Lead {
  id: string;
  contaId: string;           // referência à "conta" (antes "cliente")
  nome: string;
  telefone?: string;
  email?: string;
  origem: Origem;
  campanha?: string;
  criadoEm: string;          // ISO
  responsavelId?: string;    // corretor/gestor
  status: LeadStatus;
  feedback?: {
    status: LeadStatus;
    motivo?: string[];       // quando Desqualificado
    etapa?: EtapaFunil;
    nota?: number;           // 1..5
    tags?: string[];
    comentario?: string;
    anexos?: string[];       // nomes mock
    atualizadoEm: string;
    atualizadoPor: string;   // user id
  };
}

export interface LeadFilters {
  busca?: string;
  contaId?: string;
  periodo?: string;
  status?: LeadStatus;
  responsavelId?: string;
  origem?: Origem;
}

export interface FeedbackPayload {
  status: LeadStatus;
  motivo?: string[];
  etapa?: EtapaFunil;
  nota?: number;
  tags?: string[];
  comentario?: string;
  anexos?: string[];
}