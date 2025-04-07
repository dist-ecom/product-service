import { JwtService } from '@nestjs/jwt';

export class MockAuthService {
  private jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    });
  }

  generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  generateUserToken(userId: string, role: string = 'user'): string {
    return this.generateToken({
      sub: userId,
      email: `user-${userId}@example.com`,
      role: role,
    });
  }

  generateAdminToken(userId: string): string {
    return this.generateUserToken(userId, 'admin');
  }
}

export const mockAuthService = new MockAuthService(); 