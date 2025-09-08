// Portuguese (pt-BR) translations for MetaFlow

export const pt = {
  // Navigation
  nav: {
    dashboard: "Dashboard",
    clients: "Clientes", 
    analytics: "Analytics",
    templates: "Templates",
    training: "Capacitação",
    managers: "Gestores",
    users: "Usuários",
    settings: "Configuração",
    feedbacks: "Feedbacks",
    reportN8n: "Relatório n8n"
  },

  // Actions
  actions: {
    new: "Novo",
    edit: "Editar",
    archive: "Arquivar",
    unarchive: "Desarquivar",
    delete: "Excluir",
    save: "Salvar",
    cancel: "Cancelar",
    view: "Ver",
    duplicate: "Duplicar",
    preview: "Pré-visualizar",
    sync: "Sincronizar agora",
    test: "Testar conexão",
    assign: "Atribuir",
    copy: "Copiar",
    upload: "Upload",
    send: "Enviar"
  },

  // Filters
  filters: {
    active: "Ativos",
    archived: "Arquivados",
    meta: "Meta",
    google: "Google", 
    both: "Ambos",
    none: "Nenhum",
    all: "Todos",
    today: "Hoje",
    "7d": "7 dias",
    "15d": "15 dias", 
    "30d": "30 dias",
    custom: "Personalizado"
  },

  // Status
  status: {
    active: "Ativo",
    inactive: "Inativo",
    paused: "Pausado",
    blocked: "Bloqueado",
    connected: "Conectado",
    disconnected: "Não conectado",
    completed: "Concluído",
    inProgress: "Em andamento",
    notStarted: "Não iniciado",
    low: "Baixo"
  },

  // Dashboard
  dashboard: {
    title: "Dashboard",
    subtitle: "Visão geral do desempenho dos seus anúncios",
    activeClientsMeta: "Clientes Ativos (Meta)",
    activeClientsGoogle: "Clientes Ativos (Google)",
    totalSpend: "Investimento Total",
    leads: "Leads Gerados",
    avgCTR: "CTR Médio",
    avgCPL: "CPL Médio",
    leadsOverTime: "Leads ao Longo do Tempo",
    dailySpend: "Gasto Diário",
    automationStats: "Estatísticas de Automação",
    whatsappSends: "Envios WhatsApp",
    reportsSent: "Relatórios Enviados",
    leadsSynced: "Leads Sincronizados",
    bestCreatives: "Melhores Criativos",
    thisMonth: "Este mês",
    lastDays: "Últimos {{days}} dias"
  },

  // Clients
  clients: {
    title: "Clientes",
    subtitle: "Gerencie seus clientes e campanhas",
    newClient: "Novo Cliente",
    clientName: "Nome do Cliente",
    channels: "Canais",
    manager: "Gestor",
    createdOn: "Criado em",
    lastAccess: "Último acesso",
    searchPlaceholder: "Buscar clientes...",
    noClients: "Nenhum cliente encontrado",
    addFirstClient: "Adicionar primeiro cliente",
    confirmArchive: "Tem certeza que deseja arquivar este cliente?",
    confirmUnarchive: "Tem certeza que deseja desarquivar este cliente?",
    balance: "Saldo",
    activeCampaigns: "Campanhas Ativas",
    spend: "Gasto",
    ctr: "CTR",
    cpl: "CPL",
    hookRate: "Hook Rate",
    tracking: "Rastreamento",
    typebot: "Typebot",
    metaPixel: "Pixel Meta",
    ga4: "GA4",
    utmDefault: "UTM Padrão"
  },

  // Analytics
  analytics: {
    title: "Analytics",
    subtitle: "Análise consolidada de todos os clientes",
    totalActiveClients: "Total de Clientes Ativos",
    trackingActive: "% com Rastreamento",
    typebotUsage: "% que usa Typebot",
    totalLeads: "Total de Leads",
    totalInvestment: "Investimento Total",
    videosPerDay: "Vídeos por Dia",
    toolAdoption: "Adoção de Ferramentas",
    implementationQuality: "Qualidade de Implementação",
    missing: "Faltando",
    configured: "Configurado"
  },

  // Templates
  templates: {
    title: "Templates",
    subtitle: "Biblioteca de mensagens e relatórios",
    newTemplate: "Novo Template",
    templateName: "Nome do Template",
    category: "Categoria",
    channel: "Canal",
    dailyReport: "Relatório Diário",
    balanceAlert: "Alerta de Saldo",
    leadFollowup: "Follow-up de Lead",
    whatsapp: "WhatsApp",
    email: "Email",
    placeholders: "Placeholders disponíveis",
    sendViaN8n: "Enviar via n8n",
    comingSoon: "Em breve"
  },

  // Training
  training: {
    title: "Capacitação", 
    subtitle: "Módulos de treinamento da equipe",
    modules: "Módulos",
    level: "Nível",
    progress: "Progresso",
    teamProgress: "Progresso da Equipe",
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
    video: "Vídeo",
    document: "Documento",
    link: "Link",
    quiz: "Quiz"
  },

  // Managers
  managers: {
    title: "Gestores",
    subtitle: "Performance e clientes por gestor",
    assignClient: "Atribuir Cliente",
    clientsCount: "Clientes",
    satisfaction: "Satisfação",
    performance: "Performance",
    excellent: "Excelente",
    good: "Bom",
    average: "Médio",
    poor: "Ruim"
  },

  // Users
  users: {
    title: "Usuários",
    subtitle: "Gerenciamento de usuários e permissões",
    newUser: "Novo Usuário",
    name: "Nome",
    email: "Email",
    role: "Papel",
    assignedClients: "Clientes Atribuídos",
    resetPassword: "Redefinir Senha",
    standardUser: "Usuário Padrão",
    manager: "Gestor",
    administrator: "Administrador",
    noPermission: "Você não tem permissão para acessar esta área",
    passwordResetSuccess: "Senha redefinida com sucesso!"
  },

  // Settings
  settings: {
    title: "Configuração",
    subtitle: "Configurações do sistema e integrações",
    integrations: "Integrações",
    notifications: "Notificações",
    general: "Geral",
    webhook: "Webhook",
    webhookUrl: "URL do Webhook",
    webhookSecret: "Segredo",
    accessToken: "Token de Acesso",
    credentials: "Credenciais",
    organizationName: "Nome da Organização",
    logo: "Logo",
    theme: "Tema",
    currency: "Moeda",
    timezone: "Fuso Horário",
    enableNotifications: "Ativar notificações",
    lowBalanceAlerts: "Alertas de saldo baixo",
    dailyReports: "Envio de relatórios diários",
    notificationTime: "Horário das notificações",
    integrationSoon: "Integração chegando em breve"
  },

  // Common
  common: {
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso",
    warning: "Aviso",
    info: "Informação",
    confirm: "Confirmar",
    close: "Fechar",
    back: "Voltar",
    next: "Próximo",
    previous: "Anterior",
    search: "Buscar",
    filter: "Filtrar",
    sort: "Ordenar",
    export: "Exportar",
    import: "Importar",
    refresh: "Atualizar",
    noData: "Nenhum dado encontrado",
    selectAll: "Selecionar todos",
    clearAll: "Limpar todos",
    required: "Obrigatório",
    optional: "Opcional",
    yes: "Sim",
    no: "Não"
  }
};

export type TranslationKey = typeof pt;