require('dotenv').config();

// Map AWS regions to Amazon SP API regions
const getSPApiRegion = (awsRegion) => {
  const regionMap = {
    'us-east-1': 'na',
    'us-west-1': 'na',
    'us-west-2': 'na',
    'eu-west-1': 'eu',
    'eu-central-1': 'eu',
    'ap-southeast-1': 'fe',
    'ap-northeast-1': 'fe',
    'ap-south-1': 'fe'
  };
  return regionMap[awsRegion] || 'na'; // Default to North America
};

const config = {
  region: getSPApiRegion(process.env.AWS_REGION || 'us-east-1'),
  refresh_token: process.env.AMAZON_REFRESH_TOKEN,
  lwa_app_id: process.env.AMAZON_LWA_APP_ID,
  lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  role_arn: process.env.AWS_ROLE_ARN,
  marketplace_ids: process.env.AMAZON_MARKETPLACE_IDS ? 
    process.env.AMAZON_MARKETPLACE_IDS.split(',') : [],
  sandbox: process.env.AMAZON_SP_API_SANDBOX === 'true'
};

// Validate required configuration
const requiredFields = [
  'refresh_token',
  'lwa_app_id', 
  'lwa_client_secret',
  'aws_access_key_id',
  'aws_secret_access_key',
  'role_arn'
];

const missingFields = requiredFields.filter(field => !config[field]);

if (missingFields.length > 0) {
  console.warn('Missing required Amazon SP API configuration:', missingFields);
}

module.exports = config; 