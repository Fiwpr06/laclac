import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Dang ky tai khoan moi' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, data, message: 'Dang ky thanh cong' };
  }

  @Post('login')
  @ApiOperation({ summary: 'Dang nhap' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data, message: 'Dang nhap thanh cong' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Lam moi access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refresh(dto);
    return { success: true, data, message: 'Lam moi token thanh cong' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dang xuat' })
  async logout(@CurrentUser() user: RequestUser) {
    const data = await this.authService.logout(user.userId);
    return { success: true, data, message: 'Dang xuat thanh cong' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lay thong tin nguoi dung hien tai' })
  async me(@CurrentUser() user: RequestUser) {
    const data = await this.authService.me(user.userId);
    return { success: true, data };
  }
}
