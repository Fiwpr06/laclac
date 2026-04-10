import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lay danh sach categories active' })
  async findAll() {
    const data = await this.categoriesService.findAllActive();
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao category moi (admin)' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, data, message: 'Tao category thanh cong' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat category (admin)' })
  async update(@Param('id') categoryId: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.update(categoryId, dto);
    return { success: true, data, message: 'Cap nhat category thanh cong' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa mem category (admin)' })
  async remove(@Param('id') categoryId: string) {
    const data = await this.categoriesService.softDelete(categoryId);
    return { success: true, data, message: 'Xoa category thanh cong' };
  }
}
