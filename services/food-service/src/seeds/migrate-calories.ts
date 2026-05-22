import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Food, FoodSchema } from '../foods/food.schema';

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

async function runMigration() {
  console.log('Connecting to MongoDB...', process.env['MONGODB_URI']);
  await mongoose.connect(process.env['MONGODB_URI'] || 'mongodb://localhost:27017/laclac');
  
  const FoodModel = mongoose.model<Food>('Food', FoodSchema);

  console.log('Migrating calories to caloriesPerServing...');
  
  const foodsToMigrate = await FoodModel.find({ 
    calories: { $exists: true }, 
    caloriesPerServing: { $exists: false } 
  });

  let migratedCount = 0;
  for (const food of foodsToMigrate) {
    if (food.calories) {
      food.caloriesPerServing = food.calories;
      await food.save();
      migratedCount++;
    }
  }

  console.log(`Migration completed successfully. Migrated ${migratedCount} foods.`);
  await mongoose.connection.close();
}

runMigration().catch(async (error: unknown) => {
  console.error('Migration failed', error);
  await mongoose.connection.close();
  process.exit(1);
});
