// Centralized API Configuration
const getApiBaseUrl = (): string => {
  // In development, use the proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use environment variable or fallback
  return import.meta.env.VITE_API_URL || 'https://backend-mu-three-66.vercel.app/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  data?: any;
}

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

// Helper function to create proper headers
export const createHeaders = (additionalHeaders: HeadersInit = {}): HeadersInit => {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...additionalHeaders,
  };
};

// Sleep utility for retry logic
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Centralized API request function with retry logic
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<any> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const headers = createHeaders(options.headers);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const error: ApiError = new Error(
        typeof data === 'object' && data.message 
          ? data.message 
          : `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.data = data;
      
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        window.location.href = '/login';
        return;
      }
      
      throw error;
    }
    
    return data;
    
  } catch (error: any) {
    // Handle network errors and retry logic
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    // Retry on network errors (but not on HTTP errors like 404, 400, etc.)
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS && 
        (!error.status || error.status >= 500)) {
      
      console.warn(`API request failed, retrying (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS}):`, error.message);
      await sleep(API_CONFIG.RETRY_DELAY * (retryCount + 1));
      return apiRequest(endpoint, options, retryCount + 1);
    }
    
    // Log the error for debugging
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiRequest('/health');
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default {
  apiRequest,
  getAuthToken,
  createHeaders,
  checkApiHealth,
  API_CONFIG,
};