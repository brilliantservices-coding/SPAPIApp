const axios = require('axios');
const config = require('../config/amazon-sp-api');

class OAuthService {
  constructor() {
    this.tokenEndpoint = 'https://api.amazon.com/auth/o2/token';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Exchange authorization code for access token and refresh token
   * @param {string} authorizationCode - The authorization code from OAuth callback
   * @param {string} redirectUri - The redirect URI used in OAuth flow
   * @returns {Object} Token response
   */
  async exchangeCodeForTokens(authorizationCode, redirectUri) {
    try {
      const response = await axios.post(this.tokenEndpoint, {
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: config.lwa_app_id,
        client_secret: config.lwa_client_secret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      // Store tokens
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      return {
        success: true,
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type
        }
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
        details: error.response?.data || error
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - The refresh token (optional, uses stored if not provided)
   * @returns {Object} Token response
   */
  async refreshAccessToken(refreshToken = null) {
    try {
      const tokenToUse = refreshToken || this.refreshToken || config.refresh_token;
      
      if (!tokenToUse) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(this.tokenEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: tokenToUse,
        client_id: config.lwa_app_id,
        client_secret: config.lwa_client_secret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      // Update stored tokens
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token || tokenToUse; // Keep old refresh token if new one not provided
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      return {
        success: true,
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || tokenToUse,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type
        }
      };
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
        details: error.response?.data || error
      };
    }
  }

  /**
   * Get current access token, refresh if expired
   * @returns {string|null} Access token
   */
  async getValidAccessToken() {
    // Check if we have a valid access token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to refresh the token
    const refreshResult = await this.refreshAccessToken();
    if (refreshResult.success) {
      return refreshResult.data.access_token;
    }

    return null;
  }

  /**
   * Get client credentials token (for SP API)
   * @returns {Object} Token response
   */
  async getClientCredentialsToken() {
    try {
      const requestBody = {
        grant_type: 'client_credentials',
        client_id: config.lwa_app_id,
        client_secret: config.lwa_client_secret
      };

      // Add scope if configured
      if (process.env.AMAZON_OAUTH_SCOPE) {
        requestBody.scope = process.env.AMAZON_OAUTH_SCOPE;
      }

      const response = await axios.post(this.tokenEndpoint, requestBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      return {
        success: true,
        data: {
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type
          //,scope: tokenData.scope
        }
      };
    } catch (error) {
      console.error('Error getting client credentials token:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
        details: error.response?.data || error
      };
    }
  }

  /**
   * Validate current tokens
   * @returns {Object} Validation result
   */
  async validateTokens() {
    try {
      const accessToken = await this.getValidAccessToken();
      
      if (!accessToken) {
        return {
          valid: false,
          error: 'No valid access token available'
        };
      }

      // Test the token by making a simple API call
      const testResponse = await axios.get('https://api.amazon.com/user/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        valid: true,
        data: testResponse.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * Get OAuth authorization URL
   * @param {string} redirectUri - The redirect URI
   * @param {string} state - Optional state parameter for security
   * @param {string} scope - Optional scope
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(redirectUri, state = null, scope = null) {
    const params = new URLSearchParams({
      client_id: config.lwa_app_id,
      response_type: 'code',
      redirect_uri: redirectUri
    });

    if (state) {
      params.append('state', state);
    }

    if (scope && typeof scope === 'string' && scope.trim().length > 0) {
      params.append('scope', scope);
    }

    return `https://www.amazon.com/ap/oa?${params.toString()}`;
  }

  /**
   * Get current token status
   * @returns {Object} Token status
   */
  getTokenStatus() {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      isExpired: this.tokenExpiry ? Date.now() >= this.tokenExpiry : true,
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
    };
  }

  /**
   * Clear stored tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}

module.exports = new OAuthService(); 