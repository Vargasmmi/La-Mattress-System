// API Service Layer for Backend Integration
const API_BASE_URL = 'https://backend-mu-three-66.vercel.app/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};

// Coupons API
export const couponsAPI = {
  getAll: async (params?: { active?: boolean; platform?: string; search?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/coupons${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/coupons/${id}`);
  },

  create: async (coupon: {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    platform: 'shopify' | 'stripe' | 'both';
    valid_from: string;
    valid_until: string;
    max_uses?: number;
    minimum_purchase?: number;
  }) => {
    return apiRequest('/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
  },

  update: async (id: string, updates: {
    description?: string;
    valid_until?: string;
    max_uses?: number;
  }) => {
    return apiRequest(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  toggle: async (id: string) => {
    return apiRequest(`/coupons/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/coupons/${id}`, {
      method: 'DELETE',
    });
  },

  sync: async (platform: 'shopify' | 'stripe' | 'both') => {
    return apiRequest('/coupons/sync', {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  },
};

// Customers API
export const customersAPI = {
  getAll: async () => {
    return apiRequest('/customers');
  },

  getById: async (id: string) => {
    return apiRequest(`/customers/${id}`);
  },

  create: async (customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    shopify_customer_id?: string;
    stripe_customer_id?: string;
  }) => {
    return apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  update: async (id: string, customer: any) => {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  getAll: async () => {
    return apiRequest('/orders');
  },

  getById: async (id: string) => {
    return apiRequest(`/orders/${id}`);
  },

  create: async (order: {
    order_number: string;
    customer_id: number;
    email: string;
    total_amount: number;
    discount_amount?: number;
    coupon_id?: number;
    shopify_order_id?: string;
    stripe_payment_intent_id?: string;
    status: string;
    payment_status: string;
    shipping_address?: any;
    billing_address?: any;
    line_items?: any[];
  }) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  update: async (id: string, order: any) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  },

  updateStatus: async (id: string, status: string, payment_status?: string) => {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, payment_status }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

// Products API
export const productsAPI = {
  getAll: async () => {
    return apiRequest('/products');
  },

  getActive: async () => {
    return apiRequest('/products/active');
  },

  getById: async (id: string) => {
    return apiRequest(`/products/${id}`);
  },

  create: async (product: {
    title: string;
    description: string;
    price: number;
    inventory_quantity: number;
    create_in_shopify?: boolean;
    create_in_stripe?: boolean;
  }) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  update: async (id: string, product: {
    title?: string;
    description?: string;
    price?: number;
    inventory_quantity?: number;
    active?: boolean;
    update_in_shopify?: boolean;
    update_in_stripe?: boolean;
  }) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  toggle: async (id: string) => {
    return apiRequest(`/products/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  updateInventory: async (id: string, inventory_quantity: number) => {
    return apiRequest(`/products/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ inventory_quantity }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  syncFromShopify: async () => {
    return apiRequest('/products/sync/shopify', {
      method: 'POST',
    });
  },
};

// Settings API
export const settingsAPI = {
  shopify: {
    get: async () => {
      return apiRequest('/settings/shopify');
    },

    save: async (settings: {
      shop_name: string;
      api_key: string;
      password: string;
      api_version?: string;
    }) => {
      return apiRequest('/settings/shopify', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },

    test: async () => {
      return apiRequest('/settings/shopify/test', {
        method: 'POST',
      });
    },

    delete: async (id: string) => {
      return apiRequest(`/settings/shopify/${id}`, {
        method: 'DELETE',
      });
    },
  },

  stripe: {
    get: async () => {
      return apiRequest('/settings/stripe');
    },

    save: async (settings: {
      secret_key: string;
      webhook_secret?: string;
    }) => {
      return apiRequest('/settings/stripe', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },

    test: async () => {
      return apiRequest('/settings/stripe/test', {
        method: 'POST',
      });
    },

    delete: async (id: string) => {
      return apiRequest(`/settings/stripe/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

// Webhooks API
export const webhooksAPI = {
  createCoupon: async (apiKey: string, coupon: {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    minimum_purchase?: number;
    usage_limit?: number;
    customer_limit?: number;
    starts_at?: string;
    ends_at?: string;
    applies_to?: {
      all_products: boolean;
    };
  }) => {
    return apiRequest('/webhooks/create-coupon', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ coupon }),
    });
  },

  status: async () => {
    return apiRequest('/webhooks/status');
  },
};

// Employees API
export const employeesAPI = {
  getAll: async (params?: { search?: string; role?: string; store_id?: string; is_active?: boolean }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/employees${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/employees/${id}`);
  },

  create: async (employee: {
    email: string;
    name: string;
    phone?: string;
    employee_code: string;
    role: 'agent' | 'supervisor' | 'admin';
    store_id?: string;
    hire_date?: string;
    daily_call_goal?: number;
  }) => {
    return apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  update: async (id: string, employee: {
    name?: string;
    phone?: string;
    role?: 'agent' | 'supervisor' | 'admin';
    store_id?: string;
    daily_call_goal?: number;
    is_active?: boolean;
  }) => {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStatus: async (id: string) => {
    return apiRequest(`/employees/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  getStats: async () => {
    return apiRequest('/employees/stats');
  },
};

// Stores API
export const storesAPI = {
  getAll: async () => {
    return apiRequest('/stores');
  },

  getById: async (id: string) => {
    return apiRequest(`/stores/${id}`);
  },

  create: async (store: {
    name: string;
    shopify_domain?: string;
  }) => {
    return apiRequest('/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  },

  update: async (id: string, store: {
    name?: string;
    shopify_domain?: string;
  }) => {
    return apiRequest(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(store),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/stores/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  },
};

export default {
  auth: authAPI,
  coupons: couponsAPI,
  customers: customersAPI,
  orders: ordersAPI,
  products: productsAPI,
  employees: employeesAPI,
  stores: storesAPI,
  settings: settingsAPI,
  webhooks: webhooksAPI,
  health: healthAPI,
};