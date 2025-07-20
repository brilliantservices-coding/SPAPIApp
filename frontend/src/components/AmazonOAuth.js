import React, { useState, useEffect } from 'react';
import { oauthAPI } from '../services/api';
import './AmazonOAuth.css';

const AmazonOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [tokens, setTokens] = useState(null);

  // Get current redirect URI
  const getRedirectUri = () => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/auth/callback`;
  };

  // Check token status on component mount
  useEffect(() => {
    checkTokenStatus();
  }, []);

  // Check if we're returning from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setError(`OAuth Error: ${error}`);
      return;
    }

    if (code) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const checkTokenStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await oauthAPI.getTokenStatus();
      setTokenStatus(response.data.data);
      
      if (response.data.data.hasAccessToken) {
        setSuccess('You are already authorized with Amazon!');
      }
    } catch (err) {
      console.error('Error checking token status:', err);
      setError('Failed to check token status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const redirectUri = getRedirectUri();
      const state = generateState();
      
      const response = await oauthAPI.getAuthorizationUrl(redirectUri, state);
      
      if (response.data.success) {
        setAuthorizationUrl(response.data.data.authorization_url);
        
        // Store state in localStorage for verification
        localStorage.setItem('oauth_state', state);
        
        // Redirect to Amazon authorization page
        window.location.href = response.data.data.authorization_url;
      } else {
        setError('Failed to generate authorization URL');
      }
    } catch (err) {
      console.error('Error getting authorization URL:', err);
      setError('Failed to start authorization process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code, state) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Verify state parameter
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        setError('Invalid state parameter. Please try again.');
        return;
      }

      const redirectUri = getRedirectUri();
      
      const response = await oauthAPI.exchangeCodeForTokens(code, redirectUri);
      
      if (response.data.success) {
        const tokenData = response.data.data;
        setTokens(tokenData);
        setSuccess('Successfully authorized with Amazon!');
        
        // Clear the state from localStorage
        localStorage.removeItem('oauth_state');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Update token status
        await checkTokenStatus();
      } else {
        setError(response.data.error || 'Failed to exchange code for tokens');
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      setError('Failed to complete authorization process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await oauthAPI.refreshAccessToken();
      
      if (response.data.success) {
        const tokenData = response.data.data;
        setTokens(tokenData);
        setSuccess('Access token refreshed successfully!');
        await checkTokenStatus();
      } else {
        setError(response.data.error || 'Failed to refresh token');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError('Failed to refresh access token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateTokens = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await oauthAPI.validateTokens();
      
      if (response.data.success && response.data.data.valid) {
        setSuccess('Tokens are valid!');
      } else {
        setError(response.data.data.error || 'Tokens are invalid');
      }
    } catch (err) {
      console.error('Error validating tokens:', err);
      setError('Failed to validate tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTokens = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await oauthAPI.clearTokens();
      
      if (response.data.success) {
        setTokens(null);
        setSuccess('Tokens cleared successfully!');
        await checkTokenStatus();
      } else {
        setError('Failed to clear tokens');
      }
    } catch (err) {
      console.error('Error clearing tokens:', err);
      setError('Failed to clear tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSPAPI = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await oauthAPI.testSPAPI();
      
      if (response.data.success) {
        setSuccess('SP API connection test successful!');
      } else {
        setError(response.data.error || 'SP API connection test failed');
      }
    } catch (err) {
      console.error('Error testing SP API:', err);
      setError('Failed to test SP API connection');
    } finally {
      setIsLoading(false);
    }
  };

  const generateState = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  return (
    <div className="amazon-oauth">
      <div className="oauth-header">
        <h2>Amazon SP API Authorization</h2>
        <p>Connect your Amazon Seller account to access orders and other data.</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="message error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="message success">
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Token Status */}
      {tokenStatus && (
        <div className="token-status">
          <h3>Current Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Access Token:</span>
              <span className={`value ${tokenStatus.hasAccessToken ? 'valid' : 'invalid'}`}>
                {tokenStatus.hasAccessToken ? '✅ Available' : '❌ Not Available'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Refresh Token:</span>
              <span className={`value ${tokenStatus.hasRefreshToken ? 'valid' : 'invalid'}`}>
                {tokenStatus.hasRefreshToken ? '✅ Available' : '❌ Not Available'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Expired:</span>
              <span className={`value ${tokenStatus.isExpired ? 'invalid' : 'valid'}`}>
                {tokenStatus.isExpired ? '❌ Yes' : '✅ No'}
              </span>
            </div>
            {tokenStatus.expiresAt && (
              <div className="status-item">
                <span className="label">Expires At:</span>
                <span className="value">{new Date(tokenStatus.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="oauth-actions">
        {!tokenStatus?.hasAccessToken ? (
          <button 
            className="btn btn-primary"
            onClick={handleAuthorize}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : '🔐 Authorize with Amazon'}
          </button>
        ) : (
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={handleRefreshToken}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : '🔄 Refresh Token'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleValidateTokens}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : '✅ Validate Tokens'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleTestSPAPI}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : '🧪 Test SP API'}
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={handleClearTokens}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : '🗑️ Clear Tokens'}
            </button>
          </div>
        )}
      </div>

      {/* Token Information */}
      {tokens && (
        <div className="token-info">
          <h3>Token Information</h3>
          <div className="token-details">
            <div className="token-item">
              <span className="label">Access Token:</span>
              <span className="value">{tokens.access_token.substring(0, 20)}...</span>
            </div>
            <div className="token-item">
              <span className="label">Refresh Token:</span>
              <span className="value">{tokens.refresh_token.substring(0, 20)}...</span>
            </div>
            <div className="token-item">
              <span className="label">Expires In:</span>
              <span className="value">{tokens.expires_in} seconds</span>
            </div>
            <div className="token-item">
              <span className="label">Token Type:</span>
              <span className="value">{tokens.token_type}</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="oauth-instructions">
        <h3>How it works:</h3>
        <ol>
          <li>Click "Authorize with Amazon" to start the OAuth flow</li>
          <li>You'll be redirected to Amazon to sign in and authorize the app</li>
          <li>After authorization, you'll be redirected back with an authorization code</li>
          <li>The app will automatically exchange the code for access and refresh tokens</li>
          <li>Once authorized, you can access Amazon SP API data</li>
        </ol>
      </div>
    </div>
  );
};

export default AmazonOAuth; 