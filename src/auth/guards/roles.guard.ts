import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    
    if (!requiredRoles) {
      this.logger.debug('No roles required for this route');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      this.logger.error('User object not found in request');
      return false;
    }
    
    // Convert both user role and required roles to uppercase for case-insensitive comparison
    const userRole = user.role?.toUpperCase();
    const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());
    
    this.logger.debug(`User role: ${userRole}, Required roles: ${normalizedRequiredRoles.join(', ')}`);
    
    const hasRole = normalizedRequiredRoles.includes(userRole);
    
    if (!hasRole) {
      this.logger.warn(`Access denied for user ${user.id} with role ${userRole}. Required roles: ${normalizedRequiredRoles.join(', ')}`);
    } else {
      this.logger.debug(`Access granted for user ${user.id} with role ${userRole}`);
    }
    
    return hasRole;
  }
}
