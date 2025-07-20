# Amazon SP API Integration

This backend provides integration with Amazon Selling Partner (SP) API to fetch and manage orders.

## Features

- ✅ Fetch orders with filtering and pagination
- ✅ Get detailed order information
- ✅ Retrieve order items
- ✅ Get buyer information
- ✅ Get shipping addresses
- ✅ Error handling and logging
- ✅ Sandbox mode support

## Prerequisites

Before setting up the Amazon SP API integration, you need:

1. **Amazon Seller Central Account** - You must be a registered Amazon seller
2. **AWS Account** - For IAM user and role creation
3. **Node.js** - Version 14 or higher

## Setup Instructions

### 1. Amazon Seller Central Setup

#### Create a Login with Amazon (LWA) Application

1. Go to [Seller Central](https://sellercentral.amazon.com/)
2. Navigate to **Apps & Services** > **Develop Apps**
3. Click **Create new app client**
4. Fill in the required information:
   - **App name**: Your app name
   - **App description**: Brief description
   - **App logo**: Optional logo
5. After creation, note down:
   - **Client ID** (LWA App ID)
   - **Client Secret** (LWA Client Secret)

#### Authorize Your Application

1. In your app settings, add the following redirect URI:
   ```
   https://localhost:3000/auth/callback
   ```
2. Note the **Refresh Token** - you'll need this for API calls

### 2. AWS IAM Setup

#### Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user with programmatic access
3. Attach the following policy (create custom policy if needed):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "arn:aws:iam::*:role/AmazonSPAPIRole"
        }
    ]
}
```

4. Note down the **Access Key ID** and **Secret Access Key**

#### Create IAM Role

1. Create a new IAM role
2. Select **Another AWS account** as the trusted entity
3. Use Amazon's account ID: `arn:aws:iam::369761217864:root`
4. Attach the **AmazonSPAPIRole** managed policy
5. Note down the **Role ARN**

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Fill in your configuration values:
   ```env
   # Amazon SP API Configuration
   AWS_REGION=us-east-1
   AMAZON_LWA_APP_ID=your_lwa_app_id_here
   AMAZON_LWA_CLIENT_SECRET=your_lwa_client_secret_here
   AMAZON_REFRESH_TOKEN=your_refresh_token_here
   AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
   AWS_ROLE_ARN=arn:aws:iam::your_account_id:role/your_role_name
   AMAZON_MARKETPLACE_IDS=ATVPDKIKX0DER
   AMAZON_SP_API_SANDBOX=false
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Get Orders List

```http
GET /api/v1/orders
```

**Query Parameters:**
- `createdAfter` (optional): ISO date string
- `createdBefore` (optional): ISO date string
- `orderStatuses` (optional): Comma-separated statuses (Shipped, Unshipped, PartiallyShipped)
- `marketplaceIds` (optional): Comma-separated marketplace IDs
- `maxResults` (optional): Number of results (default: 50)
- `nextToken` (optional): For pagination

**Example:**
```bash
curl "http://localhost:3000/api/v1/orders?orderStatuses=Shipped&maxResults=10"
```

### Get Order Details

```http
GET /api/v1/orders/:orderId
```

**Example:**
```bash
curl "http://localhost:3000/api/v1/orders/123-4567890-1234567"
```

### Get Order Items

```http
GET /api/v1/orders/:orderId/items
```

### Get Order Buyer Info

```http
GET /api/v1/orders/:orderId/buyer-info
```

### Get Order Address

```http
GET /api/v1/orders/:orderId/address
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "nextToken": "string",
    "hasMore": true
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details
  }
}
```

## Marketplace IDs

Common marketplace IDs:

| Region | Marketplace ID |
|--------|----------------|
| US     | ATVPDKIKX0DER  |
| CA     | A2EUQ1WTGCTBG2  |
| UK     | A1F83G8C2ARO7P  |
| DE     | A1PA6795UKMFR9  |
| FR     | A13V1IB3VIYZZH  |
| IT     | APJ6JRA9NG5V4   |
| ES     | A1RKKUPIHCS9HS  |
| JP     | A1VC38T7YXB528  |
| IN     | A21TJRUUN4KGV   |

## Testing

### Sandbox Mode

For testing, set `AMAZON_SP_API_SANDBOX=true` in your `.env` file. This will use Amazon's sandbox environment.

### Test Orders

In sandbox mode, you can use these test order IDs:
- `test-order-1`
- `test-order-2`

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid parameters or API errors
- **404 Not Found**: Order not found
- **500 Internal Server Error**: Server-side errors

## Rate Limiting

Amazon SP API has rate limits. The service includes automatic retry logic and error handling for rate limit errors.

## Security

- All sensitive credentials are stored in environment variables
- Never commit `.env` files to version control
- Use HTTPS in production
- Implement proper authentication for production use

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your LWA credentials
   - Check if your refresh token is valid
   - Ensure your IAM role has correct permissions

2. **Rate Limiting**
   - Implement exponential backoff
   - Check your API usage limits

3. **Marketplace Access**
   - Verify you have access to the specified marketplace
   - Check your seller account status

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Support

For Amazon SP API specific issues, refer to:
- [Amazon SP API Documentation](https://developer-docs.amazon.com/sp-api/)
- [Amazon Seller Forums](https://sellercentral.amazon.com/forums/)

## License

This project is licensed under the MIT License. 