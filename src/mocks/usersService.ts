// Users Service - User management and permissions

export interface User {
  id: string;
  name: string;
  email: string;
  role: "standard" | "manager" | "administrator";
  status: "active" | "blocked";
  assignedClients: string[];
  lastAccess: string;
  createdAt: string;
  avatar?: string;
}

export interface UserPermissions {
  canViewDashboard: boolean;
  canManageClients: boolean;
  canViewAnalytics: boolean;
  canManageTemplates: boolean;
  canAccessTraining: boolean;
  canManageManagers: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
}

const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Ana Silva",
    email: "ana.silva@metaflow.com",
    role: "administrator",
    status: "active",
    assignedClients: [], // Admin sees all
    lastAccess: "2024-01-26T14:30:00",
    createdAt: "2023-03-15",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: "user-2",
    name: "Carlos Santos",
    email: "carlos.santos@metaflow.com", 
    role: "manager",
    status: "active",
    assignedClients: ["client-1", "client-2", "client-3", "client-4", "client-5", "client-6"],
    lastAccess: "2024-01-26T09:15:00",
    createdAt: "2023-07-20",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: "user-3",
    name: "Mariana Costa",
    email: "mariana.costa@metaflow.com",
    role: "manager", 
    status: "active",
    assignedClients: ["client-7", "client-8", "client-9", "client-10", "client-11"],
    lastAccess: "2024-01-26T16:45:00",
    createdAt: "2023-01-10",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: "user-4",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@metaflow.com",
    role: "standard",
    status: "active",
    assignedClients: ["client-12", "client-13"],
    lastAccess: "2024-01-25T18:20:00",
    createdAt: "2023-11-05",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: "user-5",
    name: "Lucia Ferreira",
    email: "lucia.ferreira@metaflow.com",
    role: "standard",
    status: "blocked",
    assignedClients: ["client-14"],
    lastAccess: "2024-01-20T11:30:00",
    createdAt: "2023-09-12",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: "user-6",
    name: "Rafael Santos",
    email: "rafael.santos@metaflow.com",
    role: "manager",
    status: "active",
    assignedClients: ["client-15", "client-16", "client-17"],
    lastAccess: "2024-01-24T13:45:00",
    createdAt: "2023-12-01",
    avatar: "/api/placeholder/40/40"
  }
];

class UsersService {
  async getUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = [...mockUsers];

    if (filters?.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }

    if (filters?.status) {
      filtered = filtered.filter(u => u.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  async getUser(id: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers.find(u => u.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastAccess'>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastAccess: new Date().toISOString()
    };

    mockUsers.push(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    mockUsers[index] = {
      ...mockUsers[index],
      ...updates
    };

    return mockUsers[index];
  }

  async deleteUser(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    mockUsers.splice(index, 1);
  }

  async resetPassword(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock password reset
    console.log(`Password reset for user ${id}`);
  }

  async blockUser(id: string): Promise<User> {
    return this.updateUser(id, { status: 'blocked' });
  }

  async unblockUser(id: string): Promise<User> {
    return this.updateUser(id, { status: 'active' });
  }

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    switch (user.role) {
      case "administrator":
        return {
          canViewDashboard: true,
          canManageClients: true,
          canViewAnalytics: true,
          canManageTemplates: true,
          canAccessTraining: true,
          canManageManagers: true,
          canManageUsers: true,
          canAccessSettings: true
        };
      
      case "manager":
        return {
          canViewDashboard: true,
          canManageClients: true,
          canViewAnalytics: true,
          canManageTemplates: true,
          canAccessTraining: true,
          canManageManagers: false,
          canManageUsers: false,
          canAccessSettings: false
        };
      
      case "standard":
      default:
        return {
          canViewDashboard: true,
          canManageClients: false,
          canViewAnalytics: false,
          canManageTemplates: false,
          canAccessTraining: true,
          canManageManagers: false,
          canManageUsers: false,
          canAccessSettings: false
        };
    }
  }

  async getCurrentUser(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return the first admin user as current user for demo
    return mockUsers.find(u => u.role === "administrator") || mockUsers[0];
  }

  async updateLastAccess(userId: string): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.lastAccess = new Date().toISOString();
    }
  }
}

export const usersService = new UsersService();