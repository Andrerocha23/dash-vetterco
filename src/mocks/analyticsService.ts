// Analytics Service - Aggregated data across all clients

export interface AnalyticsKPI {
  totalActiveClients: number;
  trackingActivePercent: number;
  typebotUsagePercent: number;
  totalLeads: number;
  totalInvestment: number;
  avgCTR: number;
  avgCPL: number;
}

export interface VideoData {
  date: string;
  videos: number;
}

export interface ToolAdoption {
  trackingActive: number;
  typebotActive: number;
  totalClients: number;
}

export interface ImplementationQuality {
  clientId: string;
  clientName: string;
  tracking: boolean;
  typebot: boolean;
  metaPixel: boolean;
  ga4: boolean;
  utmDefault: boolean;
}

class AnalyticsService {
  async getAnalyticsKPIs(period: string): Promise<AnalyticsKPI> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const multiplier = this.getPeriodMultiplier(period);

    return {
      totalActiveClients: 23,
      trackingActivePercent: 87.5,
      typebotUsagePercent: 73.2,
      totalLeads: Math.round(1850 * multiplier),
      totalInvestment: Math.round(85000 * multiplier),
      avgCTR: 3.4,
      avgCPL: 45.80
    };
  }

  async getVideosPerDay(period: string): Promise<VideoData[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const days = this.getDaysFromPeriod(period);
    const data: VideoData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        videos: Math.floor(Math.random() * 15) + 3
      });
    }

    return data;
  }

  async getToolAdoption(): Promise<ToolAdoption> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      trackingActive: 20,
      typebotActive: 17,
      totalClients: 23
    };
  }

  async getImplementationQuality(): Promise<ImplementationQuality[]> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const clients = [
      "TechStart Pro", "Fashion Trends", "FoodieMax", "AutoParts Plus", 
      "BeautyGlow", "FitnessPro", "HomeDecor", "GadgetWorld", "TravelEasy",
      "PetCare", "BookStore", "MusicHub", "CoffeeShop", "SportGear"
    ];

    return clients.map((name, index) => ({
      clientId: `client-${index + 1}`,
      clientName: name,
      tracking: Math.random() > 0.15,
      typebot: Math.random() > 0.25,
      metaPixel: Math.random() > 0.1,
      ga4: Math.random() > 0.2,
      utmDefault: Math.random() > 0.3
    }));
  }

  private getPeriodMultiplier(period: string): number {
    switch (period) {
      case "today": return 0.033;
      case "7d": return 0.23;
      case "15d": return 0.5;
      case "30d": return 1;
      default: return 1;
    }
  }

  private getDaysFromPeriod(period: string): number {
    switch (period) {
      case "today": return 1;
      case "7d": return 7;
      case "15d": return 15;
      case "30d": return 30;
      default: return 30;
    }
  }
}

export const analyticsService = new AnalyticsService();