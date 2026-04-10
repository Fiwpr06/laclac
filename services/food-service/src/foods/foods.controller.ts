import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateFoodDto, UpdateFoodDto } from './dto/create-food.dto';
import { ContextRequestDto, FilterDto, FoodsQueryDto } from './dto/filter.dto';
import { ShakeRequestDto } from './dto/shake.dto';
import { FoodsService } from './foods.service';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post('shake')
  @ApiOperation({ summary: 'Lấy món ăn theo hành động lắc hoặc nút Lắc Lắc' })
  async shake(@Body() dto: ShakeRequestDto) {
    const data = await this.foodsService.shake(dto);
    return { success: true, data };
  }

  @Post('random')
  @ApiOperation({ summary: 'Lấy món ăn ngẫu nhiên theo bộ lọc' })
  async random(@Body() filters: FilterDto) {
    const data = await this.foodsService.random(filters);
    return { success: true, data };
  }

  @Post('swipe-queue')
  @ApiOperation({ summary: 'Lấy 10 món ăn cho swipe session' })
  async swipeQueue(@Body() filters: FilterDto) {
    const data = await this.foodsService.swipeQueue(filters);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách món ăn có phân trang' })
  async findAll(@Query() query: FoodsQueryDto) {
    const result = await this.foodsService.findAll(query);
    return { success: true, data: result.items, meta: result.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết món ăn theo ID' })
  async findById(@Param('id') foodId: string) {
    console.log('[DEBUG findById]', foodId);
    const data = await this.foodsService.findById(foodId);
    return { success: true, data };
  }

  @Post('filter')
  @ApiOperation({ summary: 'Filter món ăn theo điều kiện' })
  async filter(@Body() dto: FilterDto) {
    const data = await this.foodsService.filter(dto);
    return { success: true, data };
  }

  @Post('context')
  @ApiOperation({ summary: 'Gợi ý món ăn theo context rule-based' })
  async byContext(@Body() dto: ContextRequestDto) {
    const data = await this.foodsService.byContext(dto);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo món ăn mới (admin)' })
  async create(@Body() dto: CreateFoodDto) {
    const data = await this.foodsService.create(dto);
    return { success: true, data, message: 'Tạo món ăn thành công' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật món ăn (admin)' })
  async update(@Param('id') foodId: string, @Body() dto: UpdateFoodDto) {
    const data = await this.foodsService.update(foodId, dto);
    return { success: true, data, message: 'Cập nhật món ăn thành công' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm món ăn (admin)' })
  async remove(@Param('id') foodId: string) {
    const data = await this.foodsService.softDelete(foodId);
    return { success: true, data, message: 'Xóa món ăn thành công' };
  }
}
