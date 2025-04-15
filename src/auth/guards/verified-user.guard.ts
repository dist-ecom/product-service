import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { UserServiceClient } from '../user-service.client';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  private readonly logger = new Logger(VerifiedUserGuard.name);

  constructor(private readonly userServiceClient: UserServiceClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      this.logger.error('User object not found in request');
      return false;
    }

    // Admin role already has full access
    if (user.role.toUpperCase() === 'ADMIN') {
      return true;
    }

    // For merchant role, check verification status
    if (user.role.toUpperCase() === 'MERCHANT') {
      try {
        const isVerified = await this.userServiceClient.checkUserVerificationStatus(user.id);
        if (!isVerified) {
          throw new ForbiddenException('Your merchant account has not been verified yet');
        }
        return isVerified;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.error(`Error checking verification status: ${error.message}`);
        return false;
      }
    }

    // Regular users cannot create products
    return false;
  }
} 