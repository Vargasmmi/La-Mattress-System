export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  shopify_domain?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  phone?: string;
  hire_date?: string;
  daily_call_goal: number;
  is_active: boolean;
  store_id?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  store?: Store;
  
  // Computed fields for display
  name?: string;
  email?: string;
  role?: 'admin' | 'agent' | 'supervisor';
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  usage_limit?: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  active: boolean;
  platform: 'shopify' | 'stripe' | 'both';
  platform_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  sku?: string;
  inventory_quantity: number;
  category?: string;
  status: 'active' | 'inactive';
  platform: 'shopify' | 'stripe' | 'both';
  platform_id?: string;
  images?: string[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: number;
  compare_price?: number;
  sku?: string;
  inventory_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  total_spent: number;
  orders_count: number;
  platform: 'shopify' | 'stripe' | 'both';
  platform_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_title?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total: number;
  currency: string;
  items: OrderItem[];
  shipping_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  notes?: string;
  platform: 'shopify' | 'stripe' | 'both';
  platform_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  platform: 'shopify' | 'stripe';
  platform_id?: string;
  created_at: string;
  updated_at: string;
}


export interface CallClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'active' | 'inactive';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  last_contact_date?: string;
  assigned_employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  client_id: string;
  client_name: string;
  employee_id: string;
  employee_name: string;
  duration?: number;
  status: 'scheduled' | 'completed' | 'failed' | 'rescheduled';
  outcome?: 'sale' | 'follow_up' | 'not_interested' | 'no_answer';
  notes?: string;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CallScript {
  id: string;
  title: string;
  content: string;
  category?: string;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  employee_id: string;
  employee_name: string;
  type: 'sale' | 'subscription';
  reference_id: string; // order_id or subscription_id
  amount: number;
  rate: number;
  status: 'pending' | 'paid';
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}