import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// OAuth API methods
export const oauthAPI = {
  // Get authorization URL
  getAuthorizationUrl: (redirectUri, state = null, scope = null) => {
    const params = { redirect_uri: redirectUri, state };
    if (scope) {
      params.scope = scope;
    }
    return api.get('/auth/authorize', { params });
  },

  // Exchange authorization code for tokens
  exchangeCodeForTokens: (code, redirectUri) => {
    return api.post('/auth/callback', { code, redirect_uri: redirectUri });
  },

  // Refresh access token
  refreshAccessToken: (refreshToken) => {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  // Get current access token
  getAccessToken: () => {
    return api.get('/auth/token');
  },

  // Get client credentials token
  getClientCredentialsToken: () => {
    return api.post('/auth/client-credentials');
  },

  // Validate current tokens
  validateTokens: () => {
    return api.get('/auth/validate');
  },

  // Get token status
  getTokenStatus: () => {
    return api.get('/auth/status');
  },

  // Clear stored tokens
  clearTokens: () => {
    return api.post('/auth/clear');
  },

  // Test SP API connection
  testSPAPI: () => {
    return api.post('/auth/test-sp-api');
  }
};

// Orders API methods
export const ordersAPI = {
  // Get orders list
  getOrders: (params = {}) => {
    return api.get('/orders', { params });
  },

  // Get specific order
  getOrder: (orderId) => {
    return api.get(`/orders/${orderId}`);
  },

  // Get order items
  getOrderItems: (orderId) => {
    return api.get(`/orders/${orderId}/items`);
  },

  // Get order buyer info
  getOrderBuyerInfo: (orderId) => {
    return api.get(`/orders/${orderId}/buyer-info`);
  },

  // Get order address
  getOrderAddress: (orderId) => {
    return api.get(`/orders/${orderId}/address`);
  }
};

// Health API methods
export const healthAPI = {
  // Get health status
  getHealth: () => {
    return api.get('/health');
  },

  // Get configuration status
  getConfig: () => {
    return api.get('/health/config');
  },

  // Get cache status
  getCache: () => {
    return api.get('/health/cache');
  },

  // Clear cache
  clearCache: () => {
    return api.post('/health/cache/clear');
  }
};

export default api; 