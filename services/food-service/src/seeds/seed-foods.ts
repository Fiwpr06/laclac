import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Category, CategorySchema } from '../categories/category.schema';
import { toSlug } from '../common/slug.util';
import { Food, FoodSchema } from '../foods/food.schema';
import { CATEGORIES_SEED } from './categories.seed';
import { FOODS_SEED } from './foods.seed';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function runSeed() {
  console.log('Connecting to MongoDB...', process.env['MONGODB_URI']);
  await mongoose.connect(process.env['MONGODB_URI'] || 'mongodb://localhost:27017/laclac');
  
  const CategoryModel = mongoose.model<Category>('Category', CategorySchema);
  const FoodModel = mongoose.model<Food>('Food', FoodSchema);

  console.log('Clearing old categories...');
  await CategoryModel.deleteMany({});
  
  console.log('Seeding categories...');
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  
  for (const cat of CATEGORIES_SEED) {
    const created = await CategoryModel.create({
      name: cat.name,
      type: 'cuisine', // fallback
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      isActive: true,
      nameSlug: cat.nameSlug,
    });
    categoryMap.set(cat.nameSlug, created._id);
  }

  console.log('Clearing old foods from database not in seed...');
  const seedSlugs = FOODS_SEED.map(f => f.nameSlug);
  await FoodModel.deleteMany({ nameSlug: { $nin: seedSlugs } });

  console.log('Seeding foods...');
  let foodCount = 0;
  
  for (const food of FOODS_SEED) {
    const categoryId = categoryMap.get(food.category);
    if (!categoryId) {
      console.warn(`Category not found for food: ${food.name}`);
      continue;
    }

    const transformedFood = {
      ...food,
      name: typeof food.name === 'string' ? { vi: food.name, en: '' } : food.name,
      description: typeof food.description === 'string' ? { vi: food.description, en: '' } : food.description,
      servingSize: typeof food.servingSize === 'string' ? { vi: food.servingSize, en: '' } : food.servingSize,
      ingredients: Array.isArray(food.ingredients) ? { vi: food.ingredients, en: [] } : food.ingredients,
      tags: Array.isArray(food.tags) ? { vi: food.tags, en: [] } : food.tags,
      recipe: food.recipe ? {
        ...food.recipe,
        steps: Array.isArray(food.recipe.steps) ? { vi: food.recipe.steps, en: [] } : food.recipe.steps,
      } : undefined,
    };

    await FoodModel.findOneAndUpdate(
      { nameSlug: food.nameSlug },
      {
        ...transformedFood,
        category: categoryId,
        isActive: true,
        popularityScore: 0,
        averageRating: 0,
        totalReviews: 0,
        images: [], // Images can be backfilled later
        thumbnailImage: '',
      },
      { upsert: true, new: true }
    ).exec();
    
    foodCount++;
  }

  console.log(`Seed completed successfully with ${foodCount} foods and ${categoryMap.size} categories.`);
  await mongoose.connection.close();
}

runSeed().catch(async (error: unknown) => {
  console.error('Seed failed', error);
  await mongoose.connection.close();
  process.exit(1);
});
