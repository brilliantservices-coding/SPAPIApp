import React, { useEffect, useState } from 'react';
import { oauthAPI } from '../services/api';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('processing');
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`OAuth Error: ${error}`);
        setStatus('error');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setStatus('error');
        return;
      }

      // Verify state parameter
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        setError('Invalid state parameter. Please try again.');
        setStatus('error');
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const response = await oauthAPI.exchangeCodeForTokens(code, redirectUri);
      
      if (response.data.success) {
        setSuccess('Successfully authorized with Amazon!');
        setStatus('success');
        
        // Clear the state from localStorage
        localStorage.removeItem('oauth_state');
        
        // Redirect back to main app after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to exchange code for tokens');
        setStatus('error');
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      setError('Failed to complete authorization process');
      setStatus('error');
    }
  };

  return (
    <div className="oauth-callback">
      <div className="callback-container">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Processing Authorization...</h2>
            <p>Please wait while we complete your Amazon authorization.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>Authorization Successful!</h2>
            <p>{success}</p>
            <p>Redirecting you back to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2>Authorization Failed</h2>
            <p className="error-message">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              Return to App
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback; 