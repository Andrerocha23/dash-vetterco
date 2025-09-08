// Settings Service - System settings and integrations

export interface Integration {
  name: string;
  status: "connected" | "disconnected";
  lastSync?: string;
  config: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  lowBalanceAlerts: boolean;
  dailyReports: boolean;
  notificationTime: string;
  webhookUrl: string;
  webhookSecret: string;
}

export interface GeneralSettings {
  organizationName: string;
  logo?: string;
  theme: "dark" | "light";
  currency: "BRL" | "USD" | "EUR";
  timezone: string;
  language: "pt-BR" | "en" | "es";
}

export interface SystemSettings {
  integrations: {
    meta: Integration;
    google: Integration;
    webhook: Integration;
  };
  notifications: NotificationSettings;
  general: GeneralSettings;
}

const mockSettings: SystemSettings = {
  integrations: {
    meta: {
      name: "Meta Business",
      status: "connected",
      lastSync: "2024-01-26T14:30:00",
      config: {
        accessToken: "***************",
        appId: "123456789",
        appSecret: "***************"
      }
    },
    google: {
      name: "Google Ads",
      status: "disconnected", 
      lastSync: undefined,
      config: {
        clientId: "",
        clientSecret: "",
        refreshToken: ""
      }
    },
    webhook: {
      name: "Webhook",
      status: "connected",
      lastSync: "2024-01-26T15:00:00",
      config: {
        url: "https://hooks.metaflow.com/webhook",
        secret: "webhook_secret_123"
      }
    }
  },
  notifications: {
    enabled: true,
    lowBalanceAlerts: true,
    dailyReports: true,
    notificationTime: "09:00",
    webhookUrl: "https://hooks.metaflow.com/webhook",
    webhookSecret: "webhook_secret_123"
  },
  general: {
    organizationName: "MetaFlow",
    logo: undefined,
    theme: "dark",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    language: "pt-BR"
  }
};

class SettingsService {
  async getSettings(): Promise<SystemSettings> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return JSON.parse(JSON.stringify(mockSettings)); // Deep clone
  }

  async updateIntegration(
    integration: keyof SystemSettings["integrations"], 
    config: Partial<Integration["config"]>
  ): Promise<Integration> {
    await new Promise(resolve => setTimeout(resolve, 800));

    mockSettings.integrations[integration].config = {
      ...mockSettings.integrations[integration].config,
      ...config
    };

    // Update status based on config completeness
    const hasRequiredFields = this.validateIntegrationConfig(integration, config);
    mockSettings.integrations[integration].status = hasRequiredFields ? "connected" : "disconnected";

    if (hasRequiredFields) {
      mockSettings.integrations[integration].lastSync = new Date().toISOString();
    }

    return mockSettings.integrations[integration];
  }

  async testConnection(integration: keyof SystemSettings["integrations"]): Promise<{
    success: boolean;
    message: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock test results
    const testResults = {
      meta: { success: true, message: "Conexão com Meta Business estabelecida com sucesso" },
      google: { success: false, message: "Credenciais inválidas ou expiradas" },
      webhook: { success: true, message: "Webhook respondendo corretamente" }
    };

    return testResults[integration];
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    await new Promise(resolve => setTimeout(resolve, 500));

    mockSettings.notifications = {
      ...mockSettings.notifications,
      ...settings
    };

    return mockSettings.notifications;
  }

  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<GeneralSettings> {
    await new Promise(resolve => setTimeout(resolve, 600));

    mockSettings.general = {
      ...mockSettings.general,
      ...settings
    };

    return mockSettings.general;
  }

  async uploadLogo(file: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock file upload - return a placeholder URL
    const logoUrl = `/api/placeholder/200/80?t=${Date.now()}`;
    mockSettings.general.logo = logoUrl;
    
    return logoUrl;
  }

  async exportSettings(): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const settingsJson = JSON.stringify(mockSettings, null, 2);
    return new Blob([settingsJson], { type: 'application/json' });
  }

  async importSettings(file: File): Promise<SystemSettings> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock import - in real app would parse and validate file
    console.log("Importing settings from file:", file.name);
    return mockSettings;
  }

  private validateIntegrationConfig(
    integration: keyof SystemSettings["integrations"], 
    config: Record<string, any>
  ): boolean {
    switch (integration) {
      case "meta":
        return !!(config.accessToken && config.appId && config.appSecret);
      case "google":
        return !!(config.clientId && config.clientSecret && config.refreshToken);
      case "webhook":
        return !!(config.url && config.secret);
      default:
        return false;
    }
  }

  async resetIntegration(integration: keyof SystemSettings["integrations"]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));

    mockSettings.integrations[integration].config = {};
    mockSettings.integrations[integration].status = "disconnected";
    mockSettings.integrations[integration].lastSync = undefined;
  }

  async getSystemHealth(): Promise<{
    overall: "healthy" | "warning" | "critical";
    checks: {
      name: string;
      status: "pass" | "fail" | "warning";
      message: string;
    }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      overall: "healthy",
      checks: [
        {
          name: "Integração Meta",
          status: mockSettings.integrations.meta.status === "connected" ? "pass" : "fail",
          message: mockSettings.integrations.meta.status === "connected" 
            ? "Conectado e funcionando" 
            : "Desconectado - verificar credenciais"
        },
        {
          name: "Webhook",
          status: mockSettings.integrations.webhook.status === "connected" ? "pass" : "fail",
          message: mockSettings.integrations.webhook.status === "connected"
            ? "Respondendo normalmente"
            : "Não responsivo"
        },
        {
          name: "Notificações",
          status: mockSettings.notifications.enabled ? "pass" : "warning", 
          message: mockSettings.notifications.enabled
            ? "Ativas e funcionando"
            : "Desabilitadas"
        }
      ]
    };
  }
}

export const settingsService = new SettingsService();