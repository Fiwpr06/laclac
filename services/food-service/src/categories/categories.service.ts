import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAllActive(): Promise<unknown[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
  }

  async create(dto: CreateCategoryDto): Promise<unknown> {
    const nameVi = dto.name?.vi?.trim();
    if (!nameVi) {
      throw new BadRequestException('Ten category khong hop le');
    }
    dto.name.vi = nameVi;
    if (dto.name.en) {
      dto.name.en = dto.name.en.trim();
    }

    const existing = await this.categoryModel.findOne({ 'name.vi': nameVi }).lean().exec();
    if (existing) {
      throw new ConflictException('Category da ton tai');
    }

    const created = await this.categoryModel.create({
      ...dto,
      icon: dto.icon?.trim() || undefined,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return created.toObject();
  }

  async update(categoryId: string, dto: UpdateCategoryDto): Promise<unknown> {
    if (!isValidObjectId(categoryId)) {
      throw new BadRequestException('Category id khong hop le');
    }

    const existing = await this.categoryModel.findById(categoryId).lean().exec();
    if (!existing) {
      throw new NotFoundException('Khong tim thay category');
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.name !== undefined) {
      const nameVi = dto.name.vi?.trim();
      if (!nameVi) {
        throw new BadRequestException('Ten category khong hop le');
      }

      dto.name.vi = nameVi;
      if (dto.name.en) {
        dto.name.en = dto.name.en.trim();
      }

      if (nameVi !== existing.name.vi) {
        const duplicate = await this.categoryModel
          .findOne({ 'name.vi': nameVi, _id: { $ne: categoryId } })
          .lean()
          .exec();
        if (duplicate) {
          throw new ConflictException('Category da ton tai');
        }
      }

      updateData['name'] = dto.name;
    }

    if (dto.icon !== undefined) {
      updateData['icon'] = dto.icon.trim() || undefined;
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(categoryId, updateData, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Khong tim thay category');
    }

    return updated;
  }

  async softDelete(categoryId: string): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(categoryId)) {
      throw new BadRequestException('Category id khong hop le');
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(categoryId, { isActive: false }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Khong tim thay category');
    }

    return { deleted: true };
  }
}
