import { FilterQuery } from 'mongoose';

import { FoodDocument } from './food.schema';

export const applyContextRules = (
  context: 'solo' | 'date' | 'group' | 'travel' | 'office',
  query: FilterQuery<FoodDocument>,
): FilterQuery<FoodDocument> => {
  const next = { ...query };

  switch (context) {
    case 'solo': {
      if (!next.priceRange) {
        next.priceRange = { $in: ['cheap', 'medium'] };
      }
      break;
    }
    case 'date': {
      if (!next.priceRange) {
        next.priceRange = { $in: ['medium', 'expensive'] };
      }
      next.contextTags = 'date';
      next.allergens = { $nin: ['shrimp_paste', 'fermented_shrimp_paste'] };
      break;
    }
    case 'group': {
      next.contextTags = 'group';
      next.calories = { ...(typeof next.calories === 'object' ? next.calories : {}), $gt: 400 };
      break;
    }
    case 'travel': {
      next.contextTags = 'travel';
      break;
    }
    case 'office': {
      next.mealTypes = 'lunch';
      next.cookingStyle = { $ne: 'soup' };
      next['recipe.prepTimeMinutes'] = { $lte: 15 };
      break;
    }
    default:
      break;
  }

  return next;
};
