import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/optional-jwt-auth.guard';
import { RequestUser } from '../common/request-user.interface';
import { AddHistoryDto } from './dto/add-history.dto';
import { ActionDto } from './dto/action.dto';
import { FavoriteDto } from './dto/favorite.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActionsService } from './actions.service';

const toDevice = (deviceTypeRaw?: string): 'mobile' | 'web' =>
  deviceTypeRaw === 'mobile' ? 'mobile' : 'web';

@ApiTags('actions')
@Controller()
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('actions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Log user action async (AI data)' })
  async createAction(@Body() dto: ActionDto, @CurrentUser() user?: RequestUser) {
    const data = await this.actionsService.enqueueAction(dto, user);
    return { success: true, data, message: 'Action accepted' };
  }

  @Post('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Them mon vao danh sach ca nhan' })
  async addFavorite(
    @CurrentUser() user: RequestUser,
    @Body() dto: FavoriteDto,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-device-type') deviceTypeRaw?: string,
  ) {
    const data = await this.actionsService.addFavorite(
      user.userId,
      dto,
      sessionId,
      toDevice(deviceTypeRaw),
    );

    return { success: true, data, message: 'Them favorite thanh cong' };
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lay danh sach favorite cua user' })
  async getFavorites(@CurrentUser() user: RequestUser, @Query('listType') listType?: string) {
    const data = await this.actionsService.getFavorites(user.userId, listType);
    return { success: true, data };
  }

  @Delete('favorites/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa favorite theo id' })
  async removeFavorite(
    @CurrentUser() user: RequestUser,
    @Param('id') favoriteId: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-device-type') deviceTypeRaw?: string,
  ) {
    const data = await this.actionsService.removeFavorite(
      user.userId,
      favoriteId,
      sessionId,
      toDevice(deviceTypeRaw),
    );

    return { success: true, data, message: 'Xoa favorite thanh cong' };
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gui danh gia mon an' })
  async addReview(
    @CurrentUser() user: RequestUser,
    @Body() dto: ReviewDto,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-device-type') deviceTypeRaw?: string,
  ) {
    const data = await this.actionsService.addReview(
      user.userId,
      dto,
      sessionId,
      toDevice(deviceTypeRaw),
    );

    return { success: true, data, message: 'Gui review thanh cong' };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Lay review theo foodId' })
  async getReviews(@Query('foodId') foodId: string) {
    const data = await this.actionsService.getReviews(foodId);
    return { success: true, data };
  }

  @Put('users/me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat profile dinh duong user' })
  async updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    const data = await this.actionsService.updateMyProfile(user.userId, dto);
    return { success: true, data, message: 'Cap nhat profile thanh cong' };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lay lich su lac cua user' })
  async getHistory(@CurrentUser() user: RequestUser, @Query('limit') limit?: string) {
    const data = await this.actionsService.getHistory(user.userId, limit ? Number(limit) : 30);
    return { success: true, data };
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Them mon vao lich su lac' })
  async addHistory(@CurrentUser() user: RequestUser, @Body() dto: AddHistoryDto) {
    const data = await this.actionsService.addHistory(user.userId, dto);
    return { success: true, data, message: 'Da luu lich su' };
  }
}
