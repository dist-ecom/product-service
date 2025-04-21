import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
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
      throw new UnauthorizedException('Authentication required');
    }

    // Log user details for debugging
    this.logger.debug(
      `Checking verification for user: ${JSON.stringify({
        id: user.id,
        role: user.role,
      })}`,
    );

    // Admin role already has full access
    if (user.role.toUpperCase() === 'ADMIN') {
      this.logger.debug('Admin user detected, allowing access');
      return true;
    }

    // For merchant role, check verification status
    if (user.role.toUpperCase() === 'MERCHANT') {
      try {
        this.logger.debug(`Checking verification status for merchant: ${user.id}`);
        const isVerified = await this.userServiceClient.checkUserVerificationStatus(user.id);

        this.logger.debug(`Merchant verification status: ${isVerified}`);

        if (!isVerified) {
          throw new ForbiddenException('Your merchant account has not been verified yet');
        }
        return isVerified;
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }

        this.logger.error(`Error checking verification status: ${error.message}`);

        // Log more details about the error
        if (error.response) {
          this.logger.error(`Error response: ${JSON.stringify(error.response.data || {})}`);
        }

        throw new ForbiddenException('Failed to verify merchant status. Please try again later.');
      }
    }

    // Regular users cannot create products
    this.logger.debug(`User with role ${user.role} is not authorized to access this resource`);
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}
