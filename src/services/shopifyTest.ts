// Test file for Shopify API integration
import shopifyClient from './shopifyClient';

// Test function to verify Shopify connection and fetch products
export async function testShopifyConnection() {
  console.log('🔄 Testing Shopify connection...');
  
  try {
    // First, check if we have Shopify settings stored
    const shopifySettings = localStorage.getItem('shopify_settings');
    
    if (!shopifySettings) {
      console.error('❌ No Shopify settings found. Please configure Shopify in the Integration page.');
      return {
        success: false,
        error: 'No Shopify settings configured',
        data: null,
      };
    }

    const settings = JSON.parse(shopifySettings);
    console.log('📋 Found Shopify settings for shop:', settings.shop_name);

    // Initialize the client
    shopifyClient.initialize({
      shopName: settings.shop_name,
      apiKey: settings.api_key,
      password: settings.password,
      apiVersion: settings.api_version || '2024-01',
    });

    // Test the connection
    console.log('🔌 Testing connection...');
    const isConnected = await shopifyClient.testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to Shopify');
      return {
        success: false,
        error: 'Failed to connect to Shopify. Please check your credentials.',
        data: null,
      };
    }

    console.log('✅ Successfully connected to Shopify!');

    // Fetch products
    console.log('📦 Fetching products...');
    const products = await shopifyClient.getProducts({ 
      limit: 10, 
      published_status: 'any' 
    });

    console.log(`✅ Fetched ${products.length} products from Shopify`);
    
    // Transform and log the first few products
    const transformedProducts = products.map(product => shopifyClient.transformProduct(product));
    
    console.log('📋 Sample products:');
    transformedProducts.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - $${product.price} (${product.inventory_quantity} in stock)`);
    });

    // Get total product count
    const totalCount = await shopifyClient.getProductCount();
    console.log(`📊 Total products in store: ${totalCount}`);

    return {
      success: true,
      error: null,
      data: {
        connected: true,
        productCount: totalCount,
        sampleProducts: transformedProducts,
      },
    };
  } catch (error: any) {
    console.error('❌ Shopify test failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      data: null,
    };
  }
}

// Function to fetch all products with pagination
export async function fetchAllShopifyProducts() {
  const allProducts = [];
  let page = 1;
  const limit = 250; // Shopify's max limit per request
  
  try {
    // Get total count first
    const totalCount = await shopifyClient.getProductCount();
    console.log(`📊 Total products to fetch: ${totalCount}`);

    while (true) {
      console.log(`📦 Fetching page ${page}...`);
      const products = await shopifyClient.getProducts({ 
        limit, 
        page,
        published_status: 'any' 
      });

      if (products.length === 0) {
        break;
      }

      allProducts.push(...products);
      console.log(`✅ Fetched ${allProducts.length}/${totalCount} products`);

      if (products.length < limit) {
        break;
      }

      page++;
    }

    console.log(`✅ Successfully fetched all ${allProducts.length} products`);
    return allProducts.map(product => shopifyClient.transformProduct(product));
  } catch (error: any) {
    console.error('❌ Failed to fetch all products:', error);
    throw error;
  }
}

// Function to sync products to our database
export async function syncShopifyProducts() {
  try {
    console.log('🔄 Starting Shopify product sync...');
    
    // Fetch all products from Shopify
    const products = await fetchAllShopifyProducts();
    
    // Here you would typically send these products to your backend
    // For now, we'll just return them
    console.log('✅ Sync completed successfully');
    
    return {
      success: true,
      count: products.length,
      products,
    };
  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    return {
      success: false,
      error: error.message,
      count: 0,
      products: [],
    };
  }
}

// Export functions
export default {
  testConnection: testShopifyConnection,
  fetchAllProducts: fetchAllShopifyProducts,
  syncProducts: syncShopifyProducts,
};