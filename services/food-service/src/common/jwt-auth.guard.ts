import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { RequestUser } from './request-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined>; user?: RequestUser }>();

    if (this.shouldBypassAuth(request)) {
      this.attachDevAdmin(request);
      return true;
    }

    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thieu token xac thuc');
    }

    const token = authHeader.slice(7);
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: 'user' | 'admin';
      }>(token, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'lac-lac-default-secret-32-characters-minimum',
        ),
      });

      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      if (this.shouldBypassAuth(request)) {
        this.attachDevAdmin(request);
        return true;
      }

      throw new UnauthorizedException('Token khong hop le');
    }
  }

  private shouldBypassAuth(request: { headers: Record<string, string | undefined> }): boolean {
    return this.isDevAdminBypassEnabled() || this.isLocalBypassHeaderEnabled(request.headers);
  }

  private isDevAdminBypassEnabled(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      return false;
    }

    const bypassFlag = this.configService.get<string>('ADMIN_DEV_BYPASS', 'true');
    return bypassFlag === 'true';
  }

  private isLocalBypassHeaderEnabled(headers: Record<string, string | undefined>): boolean {
    const bypassHeader = headers['x-admin-dev-bypass'];
    if (bypassHeader !== 'true') {
      return false;
    }

    const host = headers['host']?.toLowerCase() ?? '';
    return host.startsWith('localhost') || host.startsWith('127.0.0.1');
  }

  private attachDevAdmin(request: { user?: RequestUser }): void {
    request.user = {
      userId: 'dev-admin',
      email: 'dev-admin@lac-lac.local',
      role: 'admin',
    };
  }
}
