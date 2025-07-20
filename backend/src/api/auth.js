const express = require('express');
const oauthService = require('../services/oauth.service');
const authService = require('../services/auth.service');

const router = express.Router();

/**
 * @route GET /api/v1/auth/authorize
 * @desc Get OAuth authorization URL
 * @access Public
 */
router.get('/authorize', (req, res) => {
  try {
    const { redirect_uri, state, scope } = req.query;
    
    if (!redirect_uri) {
      return res.status(400).json({
        success: false,
        error: 'redirect_uri is required'
      });
    }

    // Use default scope from environment if not provided
    const finalScope = scope || process.env.AMAZON_OAUTH_SCOPE;

    const authorizationUrl = oauthService.getAuthorizationUrl(
      redirect_uri,
      state,
      finalScope
    );

    res.json({
      success: true,
      data: {
        authorization_url: authorizationUrl,
        client_id: process.env.AMAZON_LWA_APP_ID,
        redirect_uri: redirect_uri,
        state: state,
        scope: finalScope
      }
    });
  } catch (error) {
    console.error('Authorization URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/callback
 * @desc Handle OAuth callback and exchange code for tokens
 * @access Public
 */
router.post('/callback', async (req, res) => {
  try {
    const { code, redirect_uri, state } = req.body;
    
    // Use default redirect_uri from environment if not provided
    const finalRedirectUri = redirect_uri || process.env.DEFAULT_REDIRECT_URI || 'http://localhost:3000/callback';
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'code is required'
      });
    }

    const result = await oauthService.exchangeCodeForTokens(code, finalRedirectUri);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: {
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        expires_in: result.data.expires_in,
        token_type: result.data.token_type,
        message: 'Tokens obtained successfully. Save the refresh_token for future use.'
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to exchange code for tokens',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const result = await oauthService.refreshAccessToken(refresh_token);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: {
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        expires_in: result.data.expires_in,
        token_type: result.data.token_type
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/token
 * @desc Get current valid access token
 * @access Public
 */
router.get('/token', async (req, res) => {
  try {
    const accessToken = await oauthService.getValidAccessToken();
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No valid access token available'
      });
    }

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        token_type: 'Bearer'
      }
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get access token',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/client-credentials
 * @desc Get client credentials token for SP API
 * @access Public
 */
router.post('/client-credentials', async (req, res) => {
  try {
    const result = await oauthService.getClientCredentialsToken();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      data: {
        access_token: result.data.access_token,
        expires_in: result.data.expires_in,
        token_type: result.data.token_type,
        scope: result.data.scope
      }
    });
  } catch (error) {
    console.error('Client credentials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get client credentials token',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/validate
 * @desc Validate current tokens
 * @access Public
 */
router.get('/validate', async (req, res) => {
  try {
    const result = await oauthService.validateTokens();
    
    res.json({
      success: true,
      data: {
        valid: result.valid,
        error: result.error,
        profile: result.data
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate tokens',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/status
 * @desc Get current token status
 * @access Public
 */
router.get('/status', (req, res) => {
  try {
    const status = oauthService.getTokenStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Token status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token status',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/clear
 * @desc Clear stored tokens
 * @access Public
 */
router.post('/clear', (req, res) => {
  try {
    oauthService.clearTokens();
    
    res.json({
      success: true,
      data: {
        message: 'Tokens cleared successfully'
      }
    });
  } catch (error) {
    console.error('Clear tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear tokens',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/test-sp-api
 * @desc Test SP API connection with current tokens
 * @access Public
 */
router.post('/test-sp-api', async (req, res) => {
  try {
    // First, try to get a valid access token
    const accessToken = await oauthService.getValidAccessToken();
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No valid access token available. Please complete OAuth flow first.'
      });
    }

    // Test the token by making a simple API call
    const testResult = await oauthService.validateTokens();
    
    if (!testResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'Access token is invalid',
        details: testResult.error
      });
    }

    res.json({
      success: true,
      data: {
        message: 'SP API connection test successful',
        profile: testResult.data,
        token_status: oauthService.getTokenStatus()
      }
    });
  } catch (error) {
    console.error('SP API test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test SP API connection',
      message: error.message
    });
  }
});

module.exports = router; 