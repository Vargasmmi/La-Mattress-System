// Shopify API Client Configuration
// This client handles direct communication with Shopify API

interface ShopifyConfig {
  shopName: string;
  apiKey: string;
  password: string;
  apiVersion?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  published_scope: string;
  tags: string;
  status: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

class ShopifyClient {
  private config: ShopifyConfig | null = null;
  private baseUrl: string = '';

  // Initialize the client with shop credentials
  initialize(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shopName}.myshopify.com/admin/api/${config.apiVersion || '2024-01'}`;
  }

  // Get current configuration
  getConfig(): ShopifyConfig | null {
    return this.config;
  }

  // Check if client is initialized
  isInitialized(): boolean {
    return this.config !== null;
  }

  // Get the authorization header
  private getAuthHeader(): string {
    if (!this.config) {
      throw new Error('Shopify client not initialized');
    }
    // For private apps, use Basic Auth with API key and password
    // Use btoa for browser environment
    const credentials = btoa(`${this.config.apiKey}:${this.config.password}`);
    return `Basic ${credentials}`;
  }

  // Make authenticated request to Shopify
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error('Shopify client not initialized. Please configure Shopify settings first.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ errors: 'Unknown error' }));
        throw new Error(
          errorData.errors 
            ? JSON.stringify(errorData.errors)
            : `Shopify API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error('Shopify API request failed:', error);
      throw error;
    }
  }

  // Test the connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch shop information
      const response = await this.makeRequest('/shop.json');
      return !!response.shop;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  // Get all products
  async getProducts(params?: {
    limit?: number;
    page?: number;
    status?: string;
    vendor?: string;
    product_type?: string;
    collection_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    published_status?: 'published' | 'unpublished' | 'any';
  }): Promise<ShopifyProduct[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/products.json${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.products || [];
  }

  // Get a single product
  async getProduct(productId: string): Promise<ShopifyProduct> {
    const response = await this.makeRequest(`/products/${productId}.json`);
    return response.product;
  }

  // Create a product
  async createProduct(productData: {
    title: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    tags?: string;
    variants?: Array<{
      price: string;
      sku?: string;
      inventory_quantity?: number;
      option1?: string;
      option2?: string;
      option3?: string;
    }>;
    images?: Array<{
      src: string;
      alt?: string;
    }>;
  }): Promise<ShopifyProduct> {
    const response = await this.makeRequest('/products.json', {
      method: 'POST',
      body: JSON.stringify({ product: productData }),
    });
    return response.product;
  }

  // Update a product
  async updateProduct(productId: string, productData: Partial<{
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    tags: string;
    status: string;
  }>): Promise<ShopifyProduct> {
    const response = await this.makeRequest(`/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product: productData }),
    });
    return response.product;
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    await this.makeRequest(`/products/${productId}.json`, {
      method: 'DELETE',
    });
  }

  // Get product count
  async getProductCount(params?: {
    vendor?: string;
    product_type?: string;
    collection_id?: string;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    published_status?: 'published' | 'unpublished' | 'any';
  }): Promise<number> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/products/count.json${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.count || 0;
  }

  // Get inventory levels for a location
  async getInventoryLevels(locationId: string, inventoryItemIds?: string[]): Promise<any[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('location_ids', locationId);
    
    if (inventoryItemIds && inventoryItemIds.length > 0) {
      queryParams.append('inventory_item_ids', inventoryItemIds.join(','));
    }

    const response = await this.makeRequest(`/inventory_levels.json?${queryParams.toString()}`);
    return response.inventory_levels || [];
  }

  // Update inventory level
  async updateInventoryLevel(inventoryItemId: string, locationId: string, available: number): Promise<any> {
    const response = await this.makeRequest('/inventory_levels/set.json', {
      method: 'POST',
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available,
      }),
    });
    return response.inventory_level;
  }

  // Transform Shopify product to our Product interface
  transformProduct(shopifyProduct: ShopifyProduct): any {
    const mainVariant = shopifyProduct.variants[0] || {};
    
    return {
      id: shopifyProduct.id.toString(),
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      price: parseFloat(mainVariant.price || '0'),
      inventory_quantity: mainVariant.inventory_quantity || 0,
      active: shopifyProduct.status === 'active',
      shopify_product_id: shopifyProduct.id.toString(),
      stripe_product_id: null, // This would come from our database
      created_at: shopifyProduct.created_at,
      updated_at: shopifyProduct.updated_at,
      vendor: shopifyProduct.vendor,
      product_type: shopifyProduct.product_type,
      tags: shopifyProduct.tags,
      handle: shopifyProduct.handle,
      images: shopifyProduct.images.map(img => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      })),
      variants: shopifyProduct.variants.map(variant => ({
        id: variant.id.toString(),
        title: variant.title,
        price: parseFloat(variant.price),
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
      })),
    };
  }
}

// Create a singleton instance
const shopifyClient = new ShopifyClient();

export default shopifyClient;
export type { ShopifyConfig, ShopifyProduct, ShopifyVariant, ShopifyOption, ShopifyImage };