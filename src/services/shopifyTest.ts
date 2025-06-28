// Test file for Shopify API integration
import shopifyClient from './shopifyClient';
import { logger } from '../utils/logger';

interface ShopifySettings {
  shop_name: string;
  access_token: string;
  api_version?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  price: string;
  inventory_quantity: number;
  [key: string]: any;
}

// Helper function to fetch products from Shopify API
async function fetchShopifyProducts(settings: ShopifySettings, page: number = 1, limit: number = 50): Promise<ShopifyProduct[]> {
  const url = `https://${settings.shop_name}.myshopify.com/admin/api/2023-10/products.json?page=${page}&limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': settings.access_token,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.products || [];
}

// Helper function to get total product count
async function getTotalProductCount(settings: ShopifySettings): Promise<number> {
  const url = `https://${settings.shop_name}.myshopify.com/admin/api/2023-10/products/count.json`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': settings.access_token,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get product count: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.count || 0;
}

// Test function to verify Shopify connection and fetch products
export const testShopifyConnection = async (): Promise<boolean> => {
  logger.info('Testing Shopify connection...', undefined, 'ShopifyTest');
  
  try {
    const settings = localStorage.getItem('shopify_settings');
    if (!settings) {
      logger.error('No Shopify settings found. Please configure Shopify in the Integration page.', undefined, 'ShopifyTest');
      return false;
    }

    const parsedSettings: ShopifySettings = JSON.parse(settings);
    
    if (!parsedSettings.shop_name || !parsedSettings.access_token) {
      logger.error('Incomplete Shopify settings. Missing shop name or access token.', 
        { shop_name: !!parsedSettings.shop_name, access_token: !!parsedSettings.access_token }, 
        'ShopifyTest');
      return false;
    }

    logger.info('Found Shopify settings for shop', { shop: parsedSettings.shop_name }, 'ShopifyTest');

    // Test the connection by making a simple API call
    const shopUrl = `https://${parsedSettings.shop_name}.myshopify.com/admin/api/2023-10/shop.json`;
    
    const response = await fetch(shopUrl, {
      headers: {
        'X-Shopify-Access-Token': parsedSettings.access_token,
      },
    });

    logger.info('Testing connection...', { status: response.status }, 'ShopifyTest');

    if (!response.ok) {
      logger.error('Failed to connect to Shopify', 
        { status: response.status, statusText: response.statusText }, 
        'ShopifyTest');
      return false;
    }

    const data = await response.json();
    logger.success('Successfully connected to Shopify!', 
      { shop: data.shop?.name || 'Unknown' }, 
      'ShopifyTest');

    // Test fetching products
    logger.info('Fetching products...', undefined, 'ShopifyTest');
    const products = await fetchShopifyProducts(parsedSettings, 1, 5);
    
    if (products && products.length > 0) {
      logger.success(`Fetched ${products.length} products from Shopify`, 
        { count: products.length }, 
        'ShopifyTest');
      
             // Log sample products
       logger.info('Sample products:', undefined, 'ShopifyTest');
       products.slice(0, 3).forEach((product: ShopifyProduct, index: number) => {
         logger.debug(`${index + 1}. ${product.title} - $${product.price} (${product.inventory_quantity} in stock)`,
           { product: product.title, price: product.price, inventory: product.inventory_quantity },
           'ShopifyTest');
       });

      // Get total count
      const totalCount = await getTotalProductCount(parsedSettings);
      logger.info(`Total products in store: ${totalCount}`, { totalCount }, 'ShopifyTest');
      
      return true;
    }

    return false;
    
  } catch (error) {
    logger.error('Shopify test failed', error, 'ShopifyTest');
    return false;
  }
};

// Helper function to fetch all products from Shopify
export const fetchAllShopifyProducts = async (settings: ShopifySettings) => {
  try {
    const allProducts = [];
    let page = 1;
    const limit = 250; // Maximum allowed by Shopify API
    
    // First, get total count
    const totalCount = await getTotalProductCount(settings);
    logger.info(`Total products to fetch: ${totalCount}`, { totalCount }, 'ShopifyProducts');
    
    while (true) {
      logger.info(`Fetching page ${page}...`, { page, limit }, 'ShopifyProducts');
      
      const products = await fetchShopifyProducts(settings, page, limit);
      
      if (!products || products.length === 0) {
        break;
      }
      
      allProducts.push(...products);
      
      logger.info(`Fetched ${allProducts.length}/${totalCount} products`, 
        { current: allProducts.length, total: totalCount }, 
        'ShopifyProducts');
      
      if (products.length < limit) {
        break; // Last page
      }
      
      page++;
    }
    
    logger.success(`Successfully fetched all ${allProducts.length} products`, 
      { totalFetched: allProducts.length }, 
      'ShopifyProducts');
    return allProducts;
    
  } catch (error) {
    logger.error('Failed to fetch all products', error, 'ShopifyProducts');
    throw error;
  }
};

// Helper function to sync products
export const syncShopifyProducts = async (): Promise<void> => {
  logger.info('Starting Shopify product sync...', undefined, 'ShopifySync');
  
  try {
    const settings = localStorage.getItem('shopify_settings');
    if (!settings) {
      throw new Error('No Shopify settings found');
    }

    const parsedSettings: ShopifySettings = JSON.parse(settings);
    const products = await fetchAllShopifyProducts(parsedSettings);
    
    // Here you would save to your backend/database
    // await saveProductsToBackend(products);
    
    logger.success('Sync completed successfully', 
      { productsCount: products.length }, 
      'ShopifySync');
    
  } catch (error) {
    logger.error('Sync failed', error, 'ShopifySync');
    throw error;
  }
};

// Export functions
export default {
  testConnection: testShopifyConnection,
  fetchAllProducts: fetchAllShopifyProducts,
  syncProducts: syncShopifyProducts,
};