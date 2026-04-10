import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './category.schema';
import { CategoriesService } from './categories.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtAuthGuard, RolesGuard],
  exports: [CategoriesService, MongooseModule],
})
export class CategoriesModule {}
