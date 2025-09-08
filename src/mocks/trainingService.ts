// Training Service - Team training modules

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  expertise: string[];
  bio: string;
  rating: number;
  totalCourses: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  type: "video" | "document" | "link" | "quiz";
  duration: number; // in minutes
  status: "not-started" | "in-progress" | "completed";
  progress: number; // 0-100
  videoUrl?: string;
  thumbnail?: string;
  mentor: Mentor;
  category: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
  enrolled: number;
  rating: number;
}

export interface TeamProgress {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  averageScore: number;
  teamMembers: {
    id: string;
    name: string;
    avatar?: string;
    completedModules: number;
    totalModules: number;
    lastActivity: string;
  }[];
}

const mockMentors: Mentor[] = [
  {
    id: "mentor-1",
    name: "Ana Silva",
    avatar: "/api/placeholder/60/60",
    title: "Especialista em Meta Ads",
    expertise: ["Facebook Ads", "Instagram Ads", "Meta Business"],
    bio: "10+ anos de experiência em marketing digital e Meta Ads com mais de R$50M em vendas geradas.",
    rating: 4.9,
    totalCourses: 12
  },
  {
    id: "mentor-2",
    name: "Carlos Santos",
    avatar: "/api/placeholder/60/60",
    title: "Analytics & Growth Hacker",
    expertise: ["Google Analytics", "Automação", "Growth"],
    bio: "Especialista em analytics e automação com foco em escalabilidade e ROI.",
    rating: 4.8,
    totalCourses: 8
  },
  {
    id: "mentor-3",
    name: "Mariana Costa",
    avatar: "/api/placeholder/60/60",
    title: "Estrategista de Conversão",
    expertise: ["CRO", "Typebot", "Lead Generation"],
    bio: "Focada em otimização de conversão e geração de leads qualificados.",
    rating: 4.9,
    totalCourses: 15
  }
];

const mockModules: TrainingModule[] = [
  {
    id: "module-1",
    title: "Fundamentos do Meta Ads",
    description: "Aprenda os conceitos básicos do Facebook e Instagram Ads do zero até o primeiro resultado",
    level: "beginner",
    type: "video",
    duration: 45,
    status: "completed",
    progress: 100,
    videoUrl: "https://example.com/video1",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[0],
    category: "Meta Ads",
    tags: ["Facebook", "Instagram", "Iniciante"],
    createdAt: "2024-01-01",
    completedAt: "2024-01-05",
    enrolled: 156,
    rating: 4.7
  },
  {
    id: "module-2", 
    title: "Configuração de Campanhas Avançadas",
    description: "Estratégias avançadas para configuração e otimização de campanhas de alta performance",
    level: "intermediate",
    type: "video",
    duration: 60,
    status: "in-progress",
    progress: 65,
    videoUrl: "https://example.com/video2",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[0],
    category: "Meta Ads",
    tags: ["Campanhas", "Otimização", "Avançado"],
    createdAt: "2024-01-10",
    enrolled: 89,
    rating: 4.8
  },
  {
    id: "module-3",
    title: "Analytics e Rastreamento Avançado",
    description: "Como configurar e interpretar dados de analytics para tomada de decisões estratégicas",
    level: "intermediate",
    type: "video",
    duration: 55,
    status: "not-started",
    progress: 0,
    videoUrl: "https://example.com/video3",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[1],
    category: "Analytics",
    tags: ["Analytics", "Dados", "Estratégia"],
    createdAt: "2024-01-15",
    enrolled: 124,
    rating: 4.6
  },
  {
    id: "module-4",
    title: "Automação com n8n para Marketing",
    description: "Criando automações inteligentes para relatórios, alertas e workflows de marketing",
    level: "advanced",
    type: "video",
    duration: 90,
    status: "not-started",
    progress: 0,
    videoUrl: "https://example.com/video4",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[1],
    category: "Automação",
    tags: ["n8n", "Automação", "Workflows"],
    createdAt: "2024-01-20",
    enrolled: 67,
    rating: 4.9
  },
  {
    id: "module-5",
    title: "Typebot para Geração de Leads",
    description: "Configuração e otimização de chatbots para maximizar conversão de leads",
    level: "intermediate",
    type: "video",
    duration: 70,
    status: "completed",
    progress: 100,
    videoUrl: "https://example.com/video5",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[2],
    category: "Conversão",
    tags: ["Typebot", "Chatbot", "Leads"],
    createdAt: "2024-01-08",
    completedAt: "2024-01-12",
    enrolled: 203,
    rating: 4.8
  },
  {
    id: "module-6",
    title: "Estratégias de CRO para E-commerce",
    description: "Técnicas avançadas de otimização de conversão para lojas virtuais",
    level: "advanced",
    type: "video",
    duration: 85,
    status: "not-started",
    progress: 0,
    videoUrl: "https://example.com/video6",
    thumbnail: "/api/placeholder/400/225",
    mentor: mockMentors[2],
    category: "Conversão",
    tags: ["CRO", "E-commerce", "Otimização"],
    createdAt: "2024-01-25",
    enrolled: 45,
    rating: 4.7
  }
];

class TrainingService {
  async getModules(filters?: {
    level?: string;
    status?: string;
    type?: string;
    category?: string;
    mentor?: string;
  }): Promise<TrainingModule[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = [...mockModules];

    if (filters?.level) {
      filtered = filtered.filter(m => m.level === filters.level);
    }

    if (filters?.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    if (filters?.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    if (filters?.category) {
      filtered = filtered.filter(m => m.category === filters.category);
    }

    if (filters?.mentor) {
      filtered = filtered.filter(m => m.mentor.id === filters.mentor);
    }

    return filtered;
  }

  async getMentors(): Promise<Mentor[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMentors;
  }

  async getMentor(id: string): Promise<Mentor | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockMentors.find(m => m.id === id) || null;
  }

  async getModule(id: string): Promise<TrainingModule | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockModules.find(m => m.id === id) || null;
  }

  async getTeamProgress(): Promise<TeamProgress> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const totalModules = mockModules.length;
    const completedModules = mockModules.filter(m => m.status === "completed").length;
    const inProgressModules = mockModules.filter(m => m.status === "in-progress").length;

    return {
      totalModules,
      completedModules,
      inProgressModules,
      averageScore: 87.5,
      teamMembers: [
        {
          id: "user-1",
          name: "Ana Silva",
          avatar: "/api/placeholder/40/40",
          completedModules: 4,
          totalModules: 6,
          lastActivity: "2024-01-25"
        },
        {
          id: "user-2", 
          name: "Carlos Santos",
          avatar: "/api/placeholder/40/40",
          completedModules: 2,
          totalModules: 6,
          lastActivity: "2024-01-23"
        },
        {
          id: "user-3",
          name: "Mariana Costa",
          avatar: "/api/placeholder/40/40",
          completedModules: 6,
          totalModules: 6,
          lastActivity: "2024-01-26"
        },
        {
          id: "user-4",
          name: "Pedro Oliveira",
          avatar: "/api/placeholder/40/40",
          completedModules: 3,
          totalModules: 6,
          lastActivity: "2024-01-24"
        }
      ]
    };
  }

  async updateModuleProgress(id: string, progress: number): Promise<TrainingModule> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const module = mockModules.find(m => m.id === id);
    if (!module) throw new Error('Module not found');

    module.progress = progress;
    
    if (progress === 0) {
      module.status = "not-started";
    } else if (progress === 100) {
      module.status = "completed";
      module.completedAt = new Date().toISOString().split('T')[0];
    } else {
      module.status = "in-progress";
    }

    return module;
  }

  async startModule(id: string): Promise<TrainingModule> {
    return this.updateModuleProgress(id, 1);
  }

  async completeModule(id: string): Promise<TrainingModule> {
    return this.updateModuleProgress(id, 100);
  }

  async addModule(moduleData: Omit<TrainingModule, 'id' | 'createdAt' | 'enrolled' | 'rating' | 'status' | 'progress'>): Promise<TrainingModule> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newModule: TrainingModule = {
      ...moduleData,
      id: `module-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      enrolled: 0,
      rating: 0,
      status: "not-started",
      progress: 0
    };

    mockModules.push(newModule);
    return newModule;
  }

  async getCategories(): Promise<string[]> {
    const categories = [...new Set(mockModules.map(m => m.category))];
    return categories;
  }
}

export const trainingService = new TrainingService();