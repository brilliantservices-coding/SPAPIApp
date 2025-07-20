require('dotenv').config();
const oauthService = require('./src/services/oauth.service');

console.log('🔐 Testing Amazon OAuth Flow...\n');

// Test 1: Generate Authorization URL
console.log('📋 Test 1: Generate Authorization URL');
const redirectUri = 'https://localhost:3000/auth/callback';
const authorizationUrl = oauthService.getAuthorizationUrl(redirectUri, 'test-state-123', 'profile');
console.log('✅ Authorization URL generated:');
console.log(authorizationUrl);
console.log('\n📝 Steps to complete OAuth:');
console.log('1. Visit the URL above in your browser');
console.log('2. Sign in with your Amazon account');
console.log('3. Authorize the application');
console.log('4. Copy the authorization code from the redirect URL');
console.log('5. Use the code with the /api/v1/auth/callback endpoint\n');

// Test 2: Check current token status
console.log('📋 Test 2: Current Token Status');
const tokenStatus = oauthService.getTokenStatus();
console.log('✅ Token Status:', JSON.stringify(tokenStatus, null, 2));

// Test 3: Try to get client credentials token
console.log('\n📋 Test 3: Client Credentials Token');
oauthService.getClientCredentialsToken()
  .then(result => {
    if (result.success) {
      console.log('✅ Client credentials token obtained:');
      console.log(`   Access Token: ${result.data.access_token.substring(0, 20)}...`);
      console.log(`   Expires In: ${result.data.expires_in} seconds`);
      console.log(`   Scope: ${result.data.scope}`);
    } else {
      console.log('❌ Failed to get client credentials token:');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.log('❌ Error getting client credentials token:', error.message);
  });

// Test 4: Test token validation
console.log('\n📋 Test 4: Token Validation');
oauthService.validateTokens()
  .then(result => {
    if (result.valid) {
      console.log('✅ Tokens are valid');
      console.log('   Profile:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Tokens are invalid or missing');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.log('❌ Error validating tokens:', error.message);
  });

console.log('\n🚀 API Endpoints Available:');
console.log('GET  /api/v1/auth/authorize?redirect_uri=... - Get OAuth URL');
console.log('POST /api/v1/auth/callback - Exchange code for tokens');
console.log('POST /api/v1/auth/refresh - Refresh access token');
console.log('GET  /api/v1/auth/token - Get current access token');
console.log('POST /api/v1/auth/client-credentials - Get client credentials token');
console.log('GET  /api/v1/auth/validate - Validate current tokens');
console.log('GET  /api/v1/auth/status - Get token status');
console.log('POST /api/v1/auth/clear - Clear stored tokens');
console.log('POST /api/v1/auth/test-sp-api - Test SP API connection');

console.log('\n📚 Next Steps:');
console.log('1. Start the server: npm start');
console.log('2. Visit the authorization URL above');
console.log('3. Complete the OAuth flow');
console.log('4. Test the API endpoints'); 