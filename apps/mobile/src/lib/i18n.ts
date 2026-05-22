export const tPriceRange = (p?: string | null, isEn?: boolean) => {
  if (!p) return isEn ? 'N/A' : 'Không rõ';
  if (p === 'cheap') return isEn ? 'Cheap' : 'Tiết kiệm';
  if (p === 'medium') return isEn ? 'Medium' : 'Cân bằng';
  if (p === 'expensive') return isEn ? 'Expensive' : 'Thoải mái';
  return p;
};

export const tCookingStyle = (c?: string | null, isEn?: boolean) => {
  if (!c) return isEn ? 'N/A' : 'Không rõ';
  if (c === 'soup') return isEn ? 'Soup' : 'Nước/Súp';
  if (c === 'dry') return isEn ? 'Dry' : 'Khô';
  if (c === 'fried') return isEn ? 'Fried' : 'Chiên/Rán';
  if (c === 'grilled') return isEn ? 'Grilled' : 'Nướng';
  if (c === 'raw') return isEn ? 'Raw' : 'Sống/Gỏi';
  if (c === 'steamed') return isEn ? 'Steamed' : 'Hấp';
  return c;
};

export const tBudgetBucket = (b?: string | null, isEn?: boolean) => {
  if (!b) return isEn ? 'N/A' : 'Không rõ';
  if (b === 'under_30k') return isEn ? '< 30k' : 'Dưới 30k';
  if (b === 'from_30k_to_50k') return isEn ? '30k - 50k' : '30k - 50k';
  if (b === 'from_50k_to_100k') return isEn ? '50k - 100k' : '50k - 100k';
  if (b === 'over_100k') return isEn ? '> 100k' : 'Trên 100k';
  return b;
};

export const tDishType = (d?: string | null, isEn?: boolean) => {
  if (!d) return isEn ? 'N/A' : 'Không rõ';
  if (d === 'liquid') return isEn ? 'Liquid' : 'Món nước';
  if (d === 'dry') return isEn ? 'Dry' : 'Món khô';
  if (d === 'fried_grilled') return isEn ? 'Fried/Grilled' : 'Món chiên/nướng';
  return d;
};

export const tCuisineType = (c?: string | null, isEn?: boolean) => {
  if (!c) return isEn ? 'N/A' : 'Không rõ';
  if (c === 'vietnamese') return isEn ? 'Vietnamese' : 'Món Việt';
  if (c === 'asian') return isEn ? 'Asian' : 'Món Á';
  if (c === 'european') return isEn ? 'European' : 'Món Âu';
  return c;
};

export const tMealType = (m?: string | null, isEn?: boolean) => {
  if (!m) return isEn ? 'N/A' : 'Không rõ';
  if (m === 'breakfast') return isEn ? 'Breakfast' : 'Ăn sáng';
  if (m === 'lunch') return isEn ? 'Lunch' : 'Ăn trưa';
  if (m === 'dinner') return isEn ? 'Dinner' : 'Ăn tối';
  if (m === 'snack') return isEn ? 'Snack' : 'Ăn vặt/Xế';
  return m;
};

export const tDietTag = (d?: string | null, isEn?: boolean) => {
  if (!d) return isEn ? 'N/A' : 'Không rõ';
  if (d === 'vegetarian') return isEn ? 'Vegetarian' : 'Ăn chay';
  if (d === 'vegan') return isEn ? 'Vegan' : 'Thuần chay';
  if (d === 'keto') return isEn ? 'Keto' : 'Keto';
  if (d === 'clean') return isEn ? 'Clean' : 'Ăn kiêng/Healthy';
  return d;
};

export const tDifficulty = (d?: string | null, isEn?: boolean) => {
  if (!d) return isEn ? 'N/A' : 'Không rõ';
  if (d === 'easy') return isEn ? 'Easy' : 'Dễ';
  if (d === 'medium') return isEn ? 'Medium' : 'Trung bình';
  if (d === 'hard') return isEn ? 'Hard' : 'Khó';
  return d;
};
