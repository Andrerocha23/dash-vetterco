// Templates Service - Message and report templates

export interface Template {
  id: string;
  name: string;
  category: "daily-report" | "balance-alert" | "lead-followup";
  channel: "meta" | "google" | "whatsapp" | "email";
  content: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
}

const mockTemplates: Template[] = [
  {
    id: "template-1",
    name: "Relatório Diário de Performance",
    category: "daily-report",
    channel: "whatsapp",
    content: `📊 *Relatório Diário - {{cliente}}*

📅 Data: {{data}}
💰 Gasto: R$ {{gasto}}
🎯 Leads: {{leads}}
📈 CTR: {{ctr}}%
💸 CPL: R$ {{cpl}}

{{observacoes}}`,
    placeholders: ["{{cliente}}", "{{data}}", "{{gasto}}", "{{leads}}", "{{ctr}}", "{{cpl}}", "{{observacoes}}"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20"
  },
  {
    id: "template-2", 
    name: "Alerta de Saldo Baixo",
    category: "balance-alert",
    channel: "whatsapp",
    content: `⚠️ *Alerta de Saldo - {{cliente}}*

Conta: {{conta}}
Saldo atual: R$ {{saldo}}
Status: {{status}}

Recomendamos recarregar a conta para manter as campanhas ativas.`,
    placeholders: ["{{cliente}}", "{{conta}}", "{{saldo}}", "{{status}}"],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18"
  },
  {
    id: "template-3",
    name: "Follow-up de Lead Qualificado",
    category: "lead-followup", 
    channel: "whatsapp",
    content: `👋 Olá {{nome}}!

Vi que você demonstrou interesse em {{produto}}.

Gostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?

Tenho alguns horários disponíveis hoje:
• 14h00
• 16h30
• 18h00

Qual funciona melhor para você?`,
    placeholders: ["{{nome}}", "{{produto}}"],
    createdAt: "2024-01-12",
    updatedAt: "2024-01-22"
  },
  {
    id: "template-4",
    name: "Relatório Semanal Detalhado",
    category: "daily-report",
    channel: "email",
    content: `Relatório Semanal - {{cliente}}

Período: {{periodo}}

RESUMO EXECUTIVO:
• Investimento: R$ {{investimento}}
• Leads gerados: {{leads}}
• CPL médio: R$ {{cpl}}
• CTR médio: {{ctr}}%

CAMPANHAS:
{{campanhas_detalhes}}

PRÓXIMOS PASSOS:
{{proximos_passos}}`,
    placeholders: ["{{cliente}}", "{{periodo}}", "{{investimento}}", "{{leads}}", "{{cpl}}", "{{ctr}}", "{{campanhas_detalhes}}", "{{proximos_passos}}"],
    createdAt: "2024-01-08",
    updatedAt: "2024-01-25"
  }
];

const categories: TemplateCategory[] = [
  {
    id: "daily-report",
    name: "Relatório Diário", 
    description: "Templates para relatórios automáticos diários"
  },
  {
    id: "balance-alert",
    name: "Alerta de Saldo",
    description: "Alertas quando o saldo da conta está baixo"
  },
  {
    id: "lead-followup", 
    name: "Follow-up de Lead",
    description: "Mensagens de follow-up para leads qualificados"
  }
];

class TemplatesService {
  async getTemplates(filters?: {
    category?: string;
    channel?: string;
    search?: string;
  }): Promise<Template[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = [...mockTemplates];

    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters?.channel) {
      filtered = filtered.filter(t => t.channel === filters.channel);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.content.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  async getTemplate(id: string): Promise<Template | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTemplates.find(t => t.id === id) || null;
  }

  async getCategories(): Promise<TemplateCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return categories;
  }

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    mockTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const index = mockTemplates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');

    mockTemplates[index] = {
      ...mockTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return mockTemplates[index];
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = mockTemplates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');

    mockTemplates.splice(index, 1);
  }

  async duplicateTemplate(id: string): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const original = mockTemplates.find(t => t.id === id);
    if (!original) throw new Error('Template not found');

    const duplicate: Template = {
      ...original,
      id: `template-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    mockTemplates.push(duplicate);
    return duplicate;
  }
}

export const templatesService = new TemplatesService();