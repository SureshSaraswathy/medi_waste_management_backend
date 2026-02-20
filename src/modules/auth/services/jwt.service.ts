import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userId: string;
  userName: string;
  companyId: string;
  userRoleId: string | null;
  email?: string;
  permissions?: string[];
  userType?: 'USER' | 'HCF'; // NEW: Distinguish user type
  hcfId?: string; // NEW: If HCF user
}

@Injectable()
export class AuthJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate JWT token for authenticated user
   */
  async generateToken(payload: JwtPayload): Promise<string> {
    const jwtConfig = this.configService.get('app.jwt');
    return this.jwtService.signAsync(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    });
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    const jwtConfig = this.configService.get('app.jwt');
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: jwtConfig.secret,
    });
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpiration(): number {
    const jwtConfig = this.configService.get('app.jwt');
    const expiresIn = jwtConfig.expiresIn;
    
    // Parse expiration string (e.g., '24h', '7d', '30d')
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 60 * 60; // hours to seconds
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 60 * 60; // days to seconds
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60; // minutes to seconds
    } else if (expiresIn.endsWith('s')) {
      return parseInt(expiresIn); // already in seconds
    }
    
    // Default: 24 hours
    return 24 * 60 * 60;
  }
}
