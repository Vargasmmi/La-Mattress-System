import { DataProvider } from "@refinedev/core";
import api from "./services/api";

// Backend API base URL
const API_URL = "https://backend-mu-three-66.vercel.app/api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      
      // Silently handle 404 errors for specific endpoints
      if (response.status === 404 && (
        endpoint.includes('/employees') || 
        endpoint.includes('/stores') || 
        endpoint.includes('/call-clients') ||
        endpoint.includes('/calls') ||
        endpoint.includes('/users')
      )) {
        throw new Error('Route not found');
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    // Only log non-404 errors
    if (!error.message?.includes('Route not found')) {
      console.error(`API request failed for ${endpoint}:`, error);
    }
    throw error;
  }
};

// Map frontend resource names to backend API endpoints
const resourceMap: Record<string, {
  singular: string;
  endpoint: string;
  listKey?: string;
}> = {
  products: {
    singular: 'product',
    endpoint: '/products',
    listKey: 'products'
  },
  orders: {
    singular: 'order',
    endpoint: '/orders',
    listKey: 'orders'
  },
  customers: {
    singular: 'customer',
    endpoint: '/customers',
    listKey: 'data'
  },
  coupons: {
    singular: 'coupon',
    endpoint: '/coupons',
    listKey: 'coupons'
  },
  employees: {
    singular: 'employee',
    endpoint: '/employees',
    listKey: 'employees'
  },
  stores: {
    singular: 'store',
    endpoint: '/stores',
    listKey: 'stores'
  },
  'call-clients': {
    singular: 'client',
    endpoint: '/call-clients',
    listKey: 'clients'
  },
  calls: {
    singular: 'call',
    endpoint: '/calls',
    listKey: 'calls'
  },
  users: {
    singular: 'user',
    endpoint: '/users',
    listKey: 'users'
  },
};

// Helper function to handle API errors
const handleApiError = (error: any, resource: string, operation: string) => {
  // Only log non-404 errors to reduce console noise
  if (!error.message?.includes('Route not found') && !error.message?.includes('404')) {
    console.error(`${operation} ${resource} error:`, error);
  }
  
  // For 404 errors, just log once at debug level
  if (error.message?.includes('Route not found')) {
    console.debug(`Resource ${resource} not implemented in backend yet - using fallback`);
  }
  
  // Don't throw for missing endpoints, return empty data instead
  return { data: [], total: 0 };
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sort }) => {
    const resourceConfig = resourceMap[resource];
    
    // For resources not in the backend, return mock data
    if (!resourceConfig) {
      console.log(`Resource ${resource} not found in backend, using mock data`);
      
      if (resource === "call-clients") {
        const mockClients = Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Client ${i + 1}`,
          phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          email: `client${i + 1}@example.com`,
          status: ["new", "contacted", "interested", "not_interested"][Math.floor(Math.random() * 4)],
          assignedTo: Math.random() > 0.3 ? `${Math.floor(Math.random() * 50) + 1}` : null,
          lastContact: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          notes: Math.random() > 0.7 ? "Previous customer, interested in new products" : "",
        }));
        return { data: mockClients, total: mockClients.length };
      }
      
      return { data: [], total: 0 };
    }

    try {
      // Build query parameters for the API
      const queryParams: any = {};
      
      // Add filters
      if (filters && filters.length > 0) {
        filters.forEach((filter: any) => {
          if (filter.field === 'active' && filter.value !== undefined) {
            queryParams.active = filter.value;
          } else if (filter.field === 'platform' && filter.value) {
            queryParams.platform = filter.value;
          } else if (filter.field === 'search' && filter.value) {
            queryParams.search = filter.value;
          }
        });
      }
      
      const response = await apiRequest(resourceConfig.endpoint);
      const data = response[resourceConfig.listKey || resource] || response.data || [];
      
      return {
        data: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
      };
    } catch (error: any) {
      // If it's a missing endpoint error, provide mock data for certain resources
      if (error.message?.includes('Route not found')) {
        console.debug(`Resource ${resource} not implemented in backend yet - using mock data`);
        
        // Provide mock data for call-clients
        if (resource === 'call-clients') {
          const mockCallClients = [
            {
              id: '1',
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '+1 (555) 123-4567',
              company: 'ABC Corporation',
              status: 'active',
              priority: 'high',
              notes: 'Interested in premium mattress products',
              last_contact_date: '2024-01-20T10:30:00Z',
              assigned_employee_id: '1',
              created_at: '2024-01-15T08:00:00Z',
              updated_at: '2024-01-20T10:30:00Z',
            },
            {
              id: '2',
              name: 'Jane Smith',
              email: 'jane.smith@example.com',
              phone: '+1 (555) 234-5678',
              company: 'XYZ Industries',
              status: 'active',
              priority: 'medium',
              notes: 'Regular customer, prefers memory foam',
              last_contact_date: '2024-01-19T14:20:00Z',
              assigned_employee_id: '2',
              created_at: '2024-01-10T09:00:00Z',
              updated_at: '2024-01-19T14:20:00Z',
            },
            {
              id: '3',
              name: 'Bob Johnson',
              email: 'bob.johnson@example.com',
              phone: '+1 (555) 345-6789',
              company: 'Johnson Family',
              status: 'inactive',
              priority: 'low',
              notes: 'Purchased last year, might need replacement soon',
              last_contact_date: '2024-01-05T11:00:00Z',
              assigned_employee_id: '3',
              created_at: '2023-12-01T10:00:00Z',
              updated_at: '2024-01-05T11:00:00Z',
            },
          ];
          return { data: mockCallClients, total: mockCallClients.length };
        }
        
        // Provide mock data for calls
        if (resource === 'calls') {
          const mockCalls = [
            {
              id: '1',
              client_id: '1',
              client_name: 'John Doe',
              employee_id: '1',
              employee_name: 'María García',
              duration: 300,
              status: 'completed',
              outcome: 'sale',
              notes: 'Customer purchased premium king size mattress',
              scheduled_at: '2024-01-20T10:00:00Z',
              completed_at: '2024-01-20T10:05:00Z',
              created_at: '2024-01-20T09:30:00Z',
              updated_at: '2024-01-20T10:05:00Z',
            },
            {
              id: '2',
              client_id: '2',
              client_name: 'Jane Smith',
              employee_id: '2',
              employee_name: 'Juan Pérez',
              duration: 180,
              status: 'completed',
              outcome: 'follow_up',
              notes: 'Customer requested more information, scheduled follow-up',
              scheduled_at: '2024-01-19T14:00:00Z',
              completed_at: '2024-01-19T14:03:00Z',
              created_at: '2024-01-19T13:30:00Z',
              updated_at: '2024-01-19T14:03:00Z',
            },
            {
              id: '3',
              client_id: '3',
              client_name: 'Bob Johnson',
              employee_id: '1',
              employee_name: 'María García',
              duration: 0,
              status: 'scheduled',
              outcome: null,
              notes: 'Follow-up call for mattress replacement',
              scheduled_at: '2024-01-25T15:00:00Z',
              completed_at: null,
              created_at: '2024-01-20T11:00:00Z',
              updated_at: '2024-01-20T11:00:00Z',
            },
          ];
          return { data: mockCalls, total: mockCalls.length };
        }
        
        // Provide mock data for employees
        if (resource === 'employees') {
          const mockEmployees = [
            {
              id: '1',
              user_id: '1',
              employee_code: 'EMP001',
              phone: '+1 (555) 123-4567',
              hire_date: '2024-01-15',
              daily_call_goal: 50,
              is_active: true,
              store_id: '1',
              created_at: '2024-01-15T00:00:00Z',
              updated_at: '2024-01-15T00:00:00Z',
              name: 'María García',
              email: 'maria@lamattress.com',
              role: 'agent',
              user: {
                id: '1',
                name: 'María García',
                email: 'maria@lamattress.com',
                role: 'employee' as 'admin' | 'employee',
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
              },
              store: {
                id: '1',
                name: 'Tienda Principal',
                shopify_domain: 'main-store.myshopify.com',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              }
            },
            {
              id: '2',
              user_id: '2',
              employee_code: 'EMP002',
              phone: '+1 (555) 234-5678',
              hire_date: '2024-01-20',
              daily_call_goal: 45,
              is_active: true,
              store_id: '1',
              created_at: '2024-01-20T00:00:00Z',
              updated_at: '2024-01-20T00:00:00Z',
              name: 'Juan Pérez',
              email: 'juan@lamattress.com',
              role: 'agent',
              user: {
                id: '2',
                name: 'Juan Pérez',
                email: 'juan@lamattress.com',
                role: 'employee' as 'admin' | 'employee',
                created_at: '2024-01-20T00:00:00Z',
                updated_at: '2024-01-20T00:00:00Z',
              },
              store: {
                id: '1',
                name: 'Tienda Principal',
                shopify_domain: 'main-store.myshopify.com',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              }
            },
            {
              id: '3',
              user_id: '3',
              employee_code: 'EMP003',
              phone: '+1 (555) 345-6789',
              hire_date: '2024-02-01',
              daily_call_goal: 60,
              is_active: true,
              store_id: '2',
              created_at: '2024-02-01T00:00:00Z',
              updated_at: '2024-02-01T00:00:00Z',
              name: 'Ana López',
              email: 'ana@lamattress.com',
              role: 'supervisor',
              user: {
                id: '3',
                name: 'Ana López',
                email: 'ana@lamattress.com',
                role: 'admin' as 'admin' | 'employee',
                created_at: '2024-02-01T00:00:00Z',
                updated_at: '2024-02-01T00:00:00Z',
              },
              store: {
                id: '2',
                name: 'Tienda Norte',
                shopify_domain: 'north-store.myshopify.com',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              }
            }
          ];
          return { data: mockEmployees, total: mockEmployees.length };
        }
        
        // Provide mock data for stores
        if (resource === 'stores') {
          const mockStores = [
            {
              id: '1',
              name: 'Tienda Principal',
              shopify_domain: 'main-store.myshopify.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: '2',
              name: 'Tienda Norte',
              shopify_domain: 'north-store.myshopify.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: '3',
              name: 'Tienda Sur',
              shopify_domain: 'south-store.myshopify.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }
          ];
          return { data: mockStores, total: mockStores.length };
        }
        
        // Provide mock data for users
        if (resource === 'users') {
          const mockUsers = [
            {
              id: '1',
              name: 'Admin Principal',
              email: 'admin@lamattress.com',
              role: 'admin',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_login: '2024-02-20T10:30:00Z',
              permissions: ['*'],
            },
            {
              id: '2',
              name: 'María García',
              email: 'maria@lamattress.com',
              role: 'employee',
              status: 'active',
              created_at: '2024-01-15T00:00:00Z',
              updated_at: '2024-01-15T00:00:00Z',
              last_login: '2024-02-20T09:00:00Z',
              permissions: ['calls.view', 'calls.create', 'calls.edit', 'customers.view'],
            },
            {
              id: '3',
              name: 'Juan Pérez',
              email: 'juan@lamattress.com',
              role: 'employee',
              status: 'active',
              created_at: '2024-01-20T00:00:00Z',
              updated_at: '2024-01-20T00:00:00Z',
              last_login: '2024-02-19T14:00:00Z',
              permissions: ['calls.view', 'calls.create', 'calls.edit', 'customers.view'],
            },
          ];
          return { data: mockUsers, total: mockUsers.length };
        }
      }
      
      // For other errors, handle normally but don't throw
      handleApiError(error, resource, 'fetch');
      return { data: [], total: 0 };
    }
  },

  getOne: async ({ resource, id }) => {
    const resourceConfig = resourceMap[resource];
    
    if (!resourceConfig) {
      throw new Error(`Resource ${resource} not found`);
    }

    try {
      const response = await apiRequest(`${resourceConfig.endpoint}/${id}`);
      const data = response[resourceConfig.singular] || response.data || response;
      
      return { data };
    } catch (error) {
      handleApiError(error, resource, 'fetch');
      throw error;
    }
  },

  create: async ({ resource, variables }) => {
    const resourceConfig = resourceMap[resource];
    
    if (!resourceConfig) {
      // Handle mock resources
      return { data: { ...variables, id: Date.now().toString() } };
    }

    try {
      const response = await apiRequest(resourceConfig.endpoint, {
        method: 'POST',
        body: JSON.stringify(variables),
      });
      const data = response[resourceConfig.singular] || response.data || { ...variables, id: Date.now().toString() };
      
      return { data };
    } catch (error) {
      handleApiError(error, resource, 'create');
      throw error;
    }
  },

  update: async ({ resource, id, variables }) => {
    const resourceConfig = resourceMap[resource];
    
    if (!resourceConfig) {
      // Handle mock resources
      return { data: { ...variables, id } };
    }

    try {
      const response = await apiRequest(`${resourceConfig.endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(variables),
      });
      const data = response[resourceConfig.singular] || response.data || { ...variables, id };
      
      return { data };
    } catch (error: any) {
      // Silently handle missing endpoint errors
      if (error.message?.includes('Route not found')) {
        // Return the original data for missing endpoints
        return { data: { ...variables, id } };
      }
      handleApiError(error, resource, 'update');
      throw error;
    }
  },

  deleteOne: async ({ resource, id }) => {
    const resourceConfig = resourceMap[resource];
    
    if (!resourceConfig) {
      // Handle mock resources
      return { data: { id } as any };
    }

    try {
      await apiRequest(`${resourceConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });
      return { data: { id } as any };
    } catch (error) {
      handleApiError(error, resource, 'delete');
      throw error;
    }
  },

  getApiUrl: () => {
    return API_URL;
  },

  custom: async ({ url, method, filters, sort, payload, query, headers }) => {
    // Custom method for API calls not covered by standard CRUD
    const token = getAuthToken();
    
    try {
      const response = await fetch(url.startsWith('http') ? url : `${API_URL}${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
          ...headers,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      return { data };
    } catch (error) {
      console.error("Custom API call error:", error);
      throw error;
    }
  },
};

// Helper functions for specific API operations
export const apiHelpers = {
  // Products
  syncProductsFromShopify: async () => {
    return api.products.syncFromShopify();
  },
  
  toggleProductStatus: async (productId: string) => {
    return api.products.toggle(productId);
  },
  
  updateProductInventory: async (productId: string, quantity: number) => {
    return api.products.updateInventory(productId, quantity);
  },
  
  // Coupons
  syncCoupons: async (platform: 'shopify' | 'stripe' | 'both') => {
    return api.coupons.sync(platform);
  },
  
  toggleCouponStatus: async (couponId: string) => {
    return api.coupons.toggle(couponId);
  },
  
  // Orders
  updateOrderStatus: async (orderId: string, status: string, paymentStatus?: string) => {
    return api.orders.updateStatus(orderId, status, paymentStatus);
  },
  
  // Settings
  getShopifySettings: async () => {
    return api.settings.shopify.get();
  },
  
  saveShopifySettings: async (settings: any) => {
    return api.settings.shopify.save(settings);
  },
  
  testShopifyConnection: async () => {
    return api.settings.shopify.test();
  },
  
  getStripeSettings: async () => {
    return api.settings.stripe.get();
  },
  
  saveStripeSettings: async (settings: any) => {
    return api.settings.stripe.save(settings);
  },
  
  testStripeConnection: async () => {
    return api.settings.stripe.test();
  },
  
  // Health check
  checkApiHealth: async () => {
    return api.health.check();
  },
  
  // Webhooks
  getWebhookStatus: async () => {
    return api.webhooks.status();
  },
};