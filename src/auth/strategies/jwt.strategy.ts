import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });

    this.logger.log('JWT Strategy initialized with secret key');
  }

  async validate(request: any, payload: any) {
    try {
      this.logger.debug(`Validating JWT token: ${JSON.stringify(payload)}`);

      // Handle both direct payload and nested user object
      const userData = payload.user || payload;

      if (!userData || (!userData.sub && !userData.id)) {
        this.logger.error('Invalid token payload structure: missing user ID');
        throw new UnauthorizedException('Invalid token structure');
      }

      const user = {
        id: userData.sub || userData.id,
        email: userData.email,
        role: userData.role || 'user',
      };

      this.logger.debug(`User extracted from token: ${JSON.stringify(user)}`);
      return user;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      this.logger.error(`Request headers: ${JSON.stringify(request.headers)}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
