import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateAdminToken() {
  // Create instances of required services
  const configService = new ConfigService();
  const jwtService = new JwtService({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '30d' }, // Long-lived token for service-to-service communication
  });

  // Create payload for admin token
  const payload = {
    sub: 'service-admin',
    email: 'service@admin.com',
    role: 'admin',
  };

  // Generate the token
  const token = jwtService.sign(payload);

  console.log('Admin JWT Token:');
  console.log(token);
  console.log('\nAdd this token to your environment variables as ADMIN_TOKEN');
}

// Run the function
generateAdminToken().catch(console.error);
