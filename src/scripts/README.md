# Service Scripts

This directory contains utility scripts for the product service.

## Admin Token Generator

The `generate-admin-token.ts` script generates a JWT token with admin privileges that can be used for service-to-service communication.

### Usage

1. Make sure you have the required environment variables set in your `.env` file:
   ```
   JWT_SECRET=your_jwt_secret_here
   ```

2. Run the script:
   ```bash
   npm run generate:admin-token
   ```

3. The script will output a JWT token. Add this token to your environment variables in the other services:
   ```
   ADMIN_TOKEN=your_generated_token_here
   ```

### Security Considerations

- The generated token has a 30-day expiration period, which is suitable for service-to-service communication.
- Keep this token secure and don't expose it in client-side code or public repositories.
- Consider using a more secure method for service-to-service authentication in production environments, such as mutual TLS (mTLS) or API keys.

## Token Structure

The generated admin token contains the following claims:

- `userId`: A service-specific identifier
- `role`: Set to "admin" to provide administrative privileges
- `verified`: Set to true to bypass merchant verification checks
- `iat`: Issued-at timestamp
- `exp`: Expiration timestamp (30 days from issuance)

## Using the Token for API Requests

When testing endpoints with Postman or other API clients, you can use the admin token as follows:

1. Add an "Authorization" header to your request.
2. Use the format: `Bearer your_generated_token_here`.
3. This will allow you to access protected endpoints and perform administrative actions.

Example curl command:
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer your_generated_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Description","price":99.99,"category":"Electronics"}'
``` 