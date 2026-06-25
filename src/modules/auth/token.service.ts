import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Generate both access and refresh tokens
  async generateTokens(userId: string, email: string, activeRole: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, activeRole),
      this.generateRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  // Short-lived token with full user context
  async generateAccessToken(userId: string, email: string, activeRole: string) {
    return this.jwtService.signAsync(
      { sub: userId, email, activeRole },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: process.env.ENVIRONMENT === 'Development' ? '1d' : '15m',
      },
    );
  }

  // Long-lived token with minimal payload
  async generateRefreshToken(userId: string) {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  // Verify an access token
  async verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Verify a refresh token
  async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
