import { DataProvider } from "@refinedev/core";
import api from "./services/api";
import { apiRequest, API_CONFIG } from "./services/apiConfig";

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
      
      // Return empty data for non-existent resources
      if (resource === "call-clients") {
        return { data: [], total: 0 };
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
        
        // Return empty data for call-clients
        if (resource === 'call-clients') {
          return { data: [], total: 0 };
        }
        
        // Return empty data for calls
        if (resource === 'calls') {
          return { data: [], total: 0 };
        }
        
        // Return empty data for employees
        if (resource === 'employees') {
          return { data: [], total: 0 };
        }
        
        // Return empty data for stores
        if (resource === 'stores') {
          return { data: [], total: 0 };
        }
        
        // Return empty data for users
        if (resource === 'users') {
          return { data: [], total: 0 };
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
    return API_CONFIG.BASE_URL;
  },

  custom: async ({ url, method, filters, sort, payload, query, headers }) => {
    // Custom method for API calls not covered by standard CRUD
    try {
      const data = await apiRequest(url, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
      });

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