import { Injectable, HttpException, HttpStatus, Logger, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import axios from 'axios';

@Injectable({ scope: Scope.REQUEST })
export class UserServiceClient {
  private readonly baseUrl: string;
  private readonly logger = new Logger(UserServiceClient.name);
  private authToken: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: any
  ) {
    this.baseUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://localhost:3000';
    this.logger.log(`User service base URL: ${this.baseUrl}`);
    
    // Extract authorization token from incoming request if available
    if (this.request && this.request.headers && this.request.headers.authorization) {
      this.authToken = this.request.headers.authorization;
      this.logger.debug('Auth token extracted from request');
    }
  }

  async validateToken(token: string) {
    try {
      this.logger.debug(`Validating token at ${this.baseUrl}/auth/profile`);
      const response = await axios.get(`${this.baseUrl}/auth/profile`, {
        headers: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
      });
      this.logger.debug('Token validation successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.response?.status === 401) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(`User service error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserById(id: string) {
    try {
      this.logger.debug(`Getting user by ID: ${id}`);
      const response = await axios.get(`${this.baseUrl}/users/${id}`, {
        headers: this.authToken ? { Authorization: this.authToken } : {}
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Get user error: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.response?.status === 404) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(`User service error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkUserVerificationStatus(id: string) {
    try {
      this.logger.debug(`Checking verification status for user: ${id}`);
      this.logger.debug(`Using auth token: ${this.authToken ? 'Yes' : 'No'}`);
      
      const response = await axios.get(`${this.baseUrl}/users/verification/status/${id}`, {
        headers: this.authToken ? { Authorization: this.authToken } : {}
      });
      
      this.logger.debug(`Verification status result: ${JSON.stringify(response.data)}`);
      return response.data.isVerified;
    } catch (error) {
      this.logger.error(`Verification check error: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.response?.status === 404) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(`User service error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 