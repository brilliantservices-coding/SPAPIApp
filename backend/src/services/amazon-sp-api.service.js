const SellingPartnerAPI = require('amazon-sp-api');
const config = require('../config/amazon-sp-api');

class AmazonSPService {
  constructor() {
    this.spApi = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.spApi;
    }

    try {
      this.spApi = new SellingPartnerAPI({
        region: config.region,
        refresh_token: config.refresh_token,
        credentials: {
          SELLING_PARTNER_APP_CLIENT_ID: config.lwa_app_id,
          SELLING_PARTNER_APP_CLIENT_SECRET: config.lwa_client_secret,
          AWS_ACCESS_KEY_ID: config.aws_access_key_id,
          AWS_SECRET_ACCESS_KEY: config.aws_secret_access_key,
          AWS_SELLING_PARTNER_ROLE: config.role_arn,
        },
        sandbox: config.sandbox
      });

      this.isInitialized = true;
      console.log('Amazon SP API initialized successfully');
      return this.spApi;
    } catch (error) {
      console.error('Failed to initialize Amazon SP API:', error);
      throw new Error('Amazon SP API initialization failed');
    }
  }

  async getOrders(params = {}) {
    try {
      const spApi = await this.initialize();
      
      const defaultParams = {
        MarketplaceIds: config.marketplace_ids,
        CreatedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        OrderStatuses: ['Shipped', 'Unshipped', 'PartiallyShipped'],
        MaxResults: 50
      };

      const requestParams = { ...defaultParams, ...params };
      
      const response = await spApi.callAPI({
        operation: 'orders.getOrders',
        query: requestParams
      });

      return {
        success: true,
        data: response.data,
        pagination: {
          nextToken: response.data.NextToken,
          hasMore: !!response.data.NextToken
        }
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch orders',
        details: error.response?.data || error
      };
    }
  }

  async getOrdersByNextToken(nextToken) {
    try {
      const spApi = await this.initialize();
      
      const response = await spApi.callAPI({
        operation: 'orders.getOrders',
        query: {
          NextToken: nextToken
        }
      });

      return {
        success: true,
        data: response.data,
        pagination: {
          nextToken: response.data.NextToken,
          hasMore: !!response.data.NextToken
        }
      };
    } catch (error) {
      console.error('Error fetching orders with next token:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch orders',
        details: error.response?.data || error
      };
    }
  }

  async getOrderItems(orderId) {
    try {
      const spApi = await this.initialize();
      
      const response = await spApi.callAPI({
        operation: 'orders.getOrderItems',
        path: {
          orderId: orderId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order items:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order items',
        details: error.response?.data || error
      };
    }
  }

  async getOrderBuyerInfo(orderId) {
    try {
      const spApi = await this.initialize();
      
      const response = await spApi.callAPI({
        operation: 'orders.getOrderBuyerInfo',
        path: {
          orderId: orderId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order buyer info:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order buyer info',
        details: error.response?.data || error
      };
    }
  }

  async getOrderAddress(orderId) {
    try {
      const spApi = await this.initialize();
      
      const response = await spApi.callAPI({
        operation: 'orders.getOrderAddress',
        path: {
          orderId: orderId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order address:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order address',
        details: error.response?.data || error
      };
    }
  }
}

module.exports = new AmazonSPService(); 