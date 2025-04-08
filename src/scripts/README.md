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

3. The script will output a JWT token. Add this token to your environment variables in the order service:
   ```
   ADMIN_TOKEN=your_generated_token_here
   ```

### Security Considerations

- The generated token has a 30-day expiration period, which is suitable for service-to-service communication.
- Keep this token secure and don't expose it in client-side code or public repositories.
- Consider using a more secure method for service-to-service authentication in production environments, such as mutual TLS (mTLS) or API keys. 