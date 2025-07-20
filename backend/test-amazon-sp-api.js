require('dotenv').config();
const authService = require('./src/services/auth.service');

console.log('🔍 Testing Amazon SP API Configuration...\n');

// Test configuration validation
const configValidation = authService.validateConfig();

console.log('📋 Configuration Status:');
console.log(`✅ Valid: ${configValidation.isValid}`);
console.log(`🌍 Region: ${configValidation.config.region}`);
console.log(`🧪 Sandbox: ${configValidation.config.sandbox}`);
console.log(`🏪 Marketplaces: ${configValidation.config.marketplaceCount}`);

if (configValidation.missingFields.length > 0) {
  console.log('\n❌ Missing Required Fields:');
  configValidation.missingFields.forEach(field => {
    console.log(`   - ${field}`);
  });
}

if (configValidation.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  configValidation.warnings.forEach(warning => {
    console.log(`   - ${warning}`);
  });
}

console.log('\n📝 Environment Variables Check:');
const envVars = [
  'AWS_REGION',
  'AMAZON_LWA_APP_ID',
  'AMAZON_LWA_CLIENT_SECRET',
  'AMAZON_REFRESH_TOKEN',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_ROLE_ARN',
  'AMAZON_MARKETPLACE_IDS',
  'AMAZON_SP_API_SANDBOX'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY') ? '***' : value) : 'Not set';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🚀 Next Steps:');
if (configValidation.isValid) {
  console.log('1. ✅ Configuration is valid!');
  console.log('2. 🏃‍♂️ Start the server: npm run dev');
  console.log('3. 🌐 Test the API: curl http://localhost:3000/api/v1/health');
  console.log('4. 📦 Get orders: curl http://localhost:3000/api/v1/orders');
} else {
  console.log('1. ❌ Please fix the missing configuration');
  console.log('2. 📖 Follow the setup instructions in README-AMAZON-SP-API.md');
  console.log('3. 🔧 Update your .env file with the required values');
}

console.log('\n📚 Documentation: README-AMAZON-SP-API.md'); 