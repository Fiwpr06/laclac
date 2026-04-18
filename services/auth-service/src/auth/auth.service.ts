import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtPayload } from './types/jwt-payload';

type SanitizableUser = {
  passwordHash?: unknown;
  refreshTokenHash?: unknown;
  __v?: unknown;
  [key: string]: unknown;
};

export const sanitizeUserData = <T extends SanitizableUser>(userObj: T) => {
  const { passwordHash, refreshTokenHash, __v, ...safeUser } = userObj;
  return safeUser;
};

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID', ''),
    );
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email da ton tai');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const { accessToken, refreshToken } = await this.createTokens(user);
    await this.usersService.updateRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));

    return {
      user: sanitizeUserData(user.toObject() as unknown as SanitizableUser),
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Thong tin dang nhap khong hop le');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Tai khoan nay dung Google dang nhap, vui long su dung Google');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Thong tin dang nhap khong hop le');
    }

    const { accessToken, refreshToken } = await this.createTokens(user);
    await this.usersService.updateRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));

    return {
      user: sanitizeUserData(user.toObject() as unknown as SanitizableUser),
      accessToken,
      refreshToken,
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    if (!googleClientId) {
      throw new BadRequestException('Google OAuth chua duoc cau hinh');
    }

    let payload: { sub?: string; email?: string; name?: string; picture?: string };
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: googleClientId,
      });
      const ticketPayload = ticket.getPayload();
      if (!ticketPayload) throw new Error('Invalid token payload');
      payload = ticketPayload;
    } catch {
      throw new UnauthorizedException('Google token khong hop le');
    }

    if (!payload.email || !payload.sub) {
      throw new UnauthorizedException('Khong lay duoc thong tin tu Google');
    }

    // Find by googleId first, then by email
    let user = await this.usersService.findByGoogleId(payload.sub);
    if (!user) {
      user = await this.usersService.findByEmail(payload.email);
      if (user) {
        // Link existing account with Google
        await this.usersService.updateName(user.id, user.name); // trigger update
      } else {
        // Create new account
        user = await this.usersService.createUser({
          name: payload.name || payload.email.split('@')[0] || 'User',
          email: payload.email,
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null,
          passwordHash: null,
        });
      }
    }

    const { accessToken, refreshToken } = await this.createTokens(user);
    await this.usersService.updateRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));

    return {
      user: sanitizeUserData(user.toObject() as unknown as SanitizableUser),
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new BadRequestException('Thieu refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'lac-lac-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token khong hop le');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token khong hop le');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token khong hop le');
    }

    const { accessToken, refreshToken } = await this.createTokens(user);
    await this.usersService.updateRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));

    return { accessToken };
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Nguoi dung khong ton tai');
    }

    return sanitizeUserData(user.toObject() as unknown as SanitizableUser);
  }

  async updateAvatar(userId: string, dto: UpdateAvatarDto) {
    const user = await this.usersService.updateAvatar(userId, dto.avatarUrl);
    if (!user) throw new UnauthorizedException('Nguoi dung khong ton tai');
    return sanitizeUserData(user.toObject() as unknown as SanitizableUser);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.usersService.updateSettings(userId, dto);
    if (!user) throw new UnauthorizedException('Nguoi dung khong ton tai');
    return sanitizeUserData(user.toObject() as unknown as SanitizableUser);
  }

  private async createTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'lac-lac-default-secret-32-characters-minimum'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'lac-lac-refresh-secret'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken };
  }
}
