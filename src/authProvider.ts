import { AuthProvider } from "@refinedev/core";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "employee";
  employeeCode?: string;
  storeId?: string;
  storeName?: string;
}

// 5 stores with 10 employees each (50 employees total)
const stores = [
  { id: "1", name: "Store Center" },
  { id: "2", name: "Store North" },
  { id: "3", name: "Store South" },
  { id: "4", name: "Store East" },
  { id: "5", name: "Store West" },
];

// Mock users - in production this would connect to a real API
const mockUsers = [
  {
    id: "1",
    email: "admin@lamattress.com",
    password: "admin123",
    name: "Administrator",
    role: "admin" as const,
  },
  // Store Center (10 employees)
  {
    id: "2",
    email: "maria@lamattress.com",
    password: "maria123",
    name: "María García",
    role: "employee" as const,
    employeeCode: "CTR001",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "3",
    email: "juan@lamattress.com",
    password: "juan123",
    name: "Juan Pérez",
    role: "employee" as const,
    employeeCode: "CTR002",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "4",
    email: "ana@lamattress.com",
    password: "ana123",
    name: "Ana López",
    role: "employee" as const,
    employeeCode: "CTR003",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "5",
    email: "carlos@lamattress.com",
    password: "carlos123",
    name: "Carlos Ruiz",
    role: "employee" as const,
    employeeCode: "CTR004",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "6",
    email: "laura@lamattress.com",
    password: "laura123",
    name: "Laura Díaz",
    role: "employee" as const,
    employeeCode: "CTR005",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "7",
    email: "diego@lamattress.com",
    password: "diego123",
    name: "Diego Morales",
    role: "employee" as const,
    employeeCode: "CTR006",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "8",
    email: "sofia@lamattress.com",
    password: "sofia123",
    name: "Sofia Rivera",
    role: "employee" as const,
    employeeCode: "CTR007",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "9",
    email: "miguel@lamattress.com",
    password: "miguel123",
    name: "Miguel Santos",
    role: "employee" as const,
    employeeCode: "CTR008",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "10",
    email: "valeria@lamattress.com",
    password: "valeria123",
    name: "Valeria Torres",
    role: "employee" as const,
    employeeCode: "CTR009",
    storeId: "1",
    storeName: "Store Center",
  },
  {
    id: "11",
    email: "roberto@lamattress.com",
    password: "roberto123",
    name: "Roberto Vega",
    role: "employee" as const,
    employeeCode: "CTR010",
    storeId: "1",
    storeName: "Store Center",
  },
  // Store North (10 employees)
  {
    id: "12",
    email: "elena@lamattress.com",
    password: "elena123",
    name: "Elena Herrera",
    role: "employee" as const,
    employeeCode: "NOR001",
    storeId: "2",
    storeName: "Store North",
  },
  // Continue with more employees for the other stores...
];

export const accessControlProvider = {
  can: async ({ resource, action }: { resource?: string; action: string }) => {
    const user = localStorage.getItem("user");
    if (!user) return { can: false };
    
    const userData = JSON.parse(user);
    
    // Admin can access everything
    if (userData.role === "admin") {
      return { can: true };
    }
    
    // Employee restrictions
    if (userData.role === "employee") {
      // Employees cannot access employee management or integration settings
      const restrictedResources = ["employees", "integration"];
      if (resource && restrictedResources.includes(resource)) {
        return { can: false };
      }
      
      // Employees can access subscriptions (to see their own)
      // All other resources are allowed for employees
      return { can: true };
    }
    
    return { can: true };
  },
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Import API request helper
      const { apiRequest } = await import('./services/apiConfig');
      
      // First try API login
      const data = await apiRequest('/auth/login', {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        // Store the token and user data from API
        localStorage.setItem("token", data.token);
        
        // Create user object with the format our app expects
        const userData = {
          id: data.user?.id || data.user?._id || "api-user",
          email: data.user?.email || email,
          name: data.user?.name || email.split('@')[0],
          role: data.user?.role || "admin",
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Dispatch storage event to update the UI
        window.dispatchEvent(new Event('storage'));
        
        return {
          success: true,
          redirectTo: "/",
        };
      }
    } catch (error) {
      console.error("API login error:", error);
    }

    // Fallback to mock users if API fails
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
      // Dispatch storage event to update the UI
      window.dispatchEvent(new Event('storage'));
      
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: {
        message: "Login failed",
        name: "Invalid email or password",
      },
    };
  },
  
  logout: async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Dispatch storage event to update the UI
    window.dispatchEvent(new Event('storage'));
    
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  
  onError: async (error) => {
    // Silently handle error
    return { error };
  },
  
  check: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  
  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.role;
    }
    return null;
  },
  
  getIdentity: async () => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    // If we have a token, try to get fresh user data from API
    if (token && user) {
      try {
        const { apiRequest } = await import('./services/apiConfig');
        const data = await apiRequest('/auth/me');
        
        if (data.success && data.user) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email.split('@')[0],
            role: data.user.role || "admin",
          };
          localStorage.setItem("user", JSON.stringify(userData));
          return userData;
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    }
    
    // Fallback to stored user data
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },
};