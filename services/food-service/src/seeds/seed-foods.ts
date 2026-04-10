import path from 'node:path';
import fs from 'node:fs';

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Category, CategorySchema } from '../categories/category.schema';
import { toSlug } from '../common/slug.util';
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

type SeedFoodInput = {
  name: string;
  description: string;
  categoryName: string;
  mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;
  priceRange: 'cheap' | 'medium' | 'expensive';
  cookingStyle: 'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed';
  origin: string;
  ingredients: string[];
  tags: string[];
  contextTags: Array<'solo' | 'date' | 'group' | 'travel' | 'office'>;
  calories: number;
  allergens?: string[];
  dietTags?: Array<'vegetarian' | 'vegan' | 'keto' | 'clean'>;
  priceMin: number;
  priceMax: number;
};

type SeedImageSource = 'wikipedia' | 'fallback';

type SeedImageResult = {
  url: string;
  source: SeedImageSource;
};

type MediaUploadResult = {
  ok: boolean;
  url?: string;
  provider?: string;
  error?: string;
};

type WikipediaSearchResponse = {
  query?: {
    search?: Array<{
      title?: string;
    }>;
  };
};

type WikipediaSummaryResponse = {
  originalimage?: {
    source?: string;
  };
  thumbnail?: {
    source?: string;
  };
};

const WIKIPEDIA_HOSTS = ['vi.wikipedia.org', 'en.wikipedia.org'] as const;
const WIKIPEDIA_FETCH_HEADERS = {
  'User-Agent': 'LacLacImageBot/1.0 (+https://laclac.vn)',
  'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
};
const REMOTE_IMAGE_TIMEOUT_MS = 15_000;
const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const wikipediaImageCache = new Map<string, string | null>();

const categorySeeds = [
  { name: 'Mon Viet', type: 'cuisine' as const, icon: 'restaurant-outline', sortOrder: 1 },
  { name: 'Do Chay', type: 'diet' as const, icon: 'leaf-outline', sortOrder: 2 },
  { name: 'An Vat', type: 'meal_type' as const, icon: 'ice-cream-outline', sortOrder: 3 },
  { name: 'Lau Va Nuong', type: 'cuisine' as const, icon: 'flame-outline', sortOrder: 4 },
];

const dish = (item: SeedFoodInput): SeedFoodInput => item;

const vietnameseNameMap: Record<string, string> = {
  'Pho bo': 'Phở bò',
  'Pho ga': 'Phở gà',
  'Bun bo Hue': 'Bún bò Huế',
  'Banh mi thit': 'Bánh mì thịt',
  'Banh mi trung': 'Bánh mì trứng',
  'Xoi xeo': 'Xôi xéo',
  'Xoi ga': 'Xôi gà',
  'Chao long': 'Cháo lòng',
  'Banh cuon': 'Bánh cuốn',
  'Hu tieu': 'Hủ tiếu',
  'Bun rieu': 'Bún riêu',
  'Com tam': 'Cơm tấm',
  'Banh uot': 'Bánh ướt',
  'Mi Quang': 'Mì Quảng',
  'Sup cua': 'Súp cua',
  'Com suon': 'Cơm sườn',
  'Bun cha': 'Bún chả',
  'Bun nem': 'Bún nem',
  'Ca kho to': 'Cá kho tộ',
  'Thit kho tau': 'Thịt kho tàu',
  'Canh chua': 'Canh chua',
  'Lau thai': 'Lẩu Thái',
  'Lau mam': 'Lẩu mắm',
  'Ga nuong': 'Gà nướng',
  'Vit quay': 'Vịt quay',
  'Com ga Hoi An': 'Cơm gà Hội An',
  'Mi xao bo': 'Mì xào bò',
  'Banh xeo': 'Bánh xèo',
  'Bo luc lac': 'Bò lúc lắc',
  'Oc len xao dua': 'Ốc len xào dừa',
  'Cha ca La Vong': 'Chả cá Lã Vọng',
  'Bun dau mam tom': 'Bún đậu mắm tôm',
  'Com nieu': 'Cơm niêu',
  'Luon um la chuoi': 'Lươn um lá chuối',
  'Goi cuon tom thit': 'Gỏi cuốn tôm thịt',
  'Hen xuc banh trang': 'Hến xúc bánh tráng',
  'Nem lui': 'Nem lụi',
  'Banh canh cua': 'Bánh canh cua',
  'Bo 7 mon': 'Bò 7 món',
  'Chao vit': 'Cháo vịt',
  'Banh trang tron': 'Bánh tráng trộn',
  'Bap xao': 'Bắp xào',
  'Hot vit lon': 'Hột vịt lộn',
  'Banh flan': 'Bánh flan',
  'Che thai': 'Chè Thái',
  'Che ba mau': 'Chè ba màu',
  'Kem bo': 'Kem bơ',
  'Sau rieng': 'Sầu riêng',
  'Sinh to bo': 'Sinh tố bơ',
  'Tra sua tran chau': 'Trà sữa trân châu',
  'Banh tieu': 'Bánh tiêu',
  'Bo bia': 'Bò bía',
  'Banh chuoi nuong': 'Bánh chuối nướng',
  'Oi lac muoi ot': 'Ổi lắc muối ớt',
  'Xoai lac': 'Xoài lắc',
  'Com chay': 'Cơm chay',
  'Bun chay': 'Bún chay',
  'Pho chay': 'Phở chay',
  'Banh mi chay': 'Bánh mì chay',
  'Lau chay': 'Lẩu chay',
};

const normalizeDishName = (name: string): string => vietnameseNameMap[name] ?? name;

const legacyDescriptionMap: Record<string, string> = {
  'Banh canh soi day, nuoc dung cua.': 'Bánh canh sợi dày, nước dùng cua.',
  'Banh chuoi nuong thom cot dua.': 'Bánh chuối nướng thơm cốt dừa.',
  'Banh cuon nong nhan thit moc nhi.': 'Bánh cuốn nóng nhân thịt mộc nhĩ.',
  'Banh flan mem min ngot thanh.': 'Bánh flan mềm mịn ngọt thanh.',
  'Banh mi chay voi cha chay.': 'Bánh mì chay với chả chay.',
  'Banh mi op la don gian.': 'Bánh mì ốp la đơn giản.',
  'Banh mi thit nguoi Viet quen thuoc.': 'Bánh mì thịt nguội kiểu Việt quen thuộc.',
  'Banh tieu chien nong gion xop.': 'Bánh tiêu chiên nóng giòn xốp.',
  'Banh trang tron vi chua ngot cay.': 'Bánh tráng trộn vị chua ngọt cay.',
  'Banh uot mem an kem cha lua.': 'Bánh ướt mềm ăn kèm chả lụa.',
  'Banh xeo vang gion cuon rau.': 'Bánh xèo vàng giòn cuốn rau.',
  'Bap xao bo hanh thom.': 'Bắp xào bơ hành thơm.',
  'Bo bia ngot nhe voi lap xuong.': 'Bò bía ngọt nhẹ với lạp xưởng.',
  'Bo luc lac mem, sot tieu den.': 'Bò lúc lắc mềm, sốt tiêu đen.',
  'Bun an kem nem ran gion.': 'Bún ăn kèm nem rán giòn.',
  'Bun bo cay nhe, thom sa.': 'Bún bò cay nhẹ, thơm sả.',
  'Bun cha Ha Noi nuong than.': 'Bún chả Hà Nội nướng than.',
  'Bun chay nuoc dung nam ngot thanh.': 'Bún chay nước dùng nấm ngọt thanh.',
  'Bun dau day du topping.': 'Bún đậu đầy đủ topping.',
  'Bun rieu cua chua nhe.': 'Bún riêu cua chua nhẹ.',
  'Ca kho to dam vi, hao com.': 'Cá kho tộ đậm vị, hao cơm.',
  'Canh chua ca mien Tay giai nhiet.': 'Canh chua cá miền Tây giải nhiệt.',
  'Cha ca Ha Noi an kem thi la.': 'Chả cá Hà Nội ăn kèm thì là.',
  'Chao nong an kem long heo.': 'Cháo nóng ăn kèm lòng heo.',
  'Chao vit nong an kem goi.': 'Cháo vịt nóng ăn kèm gỏi.',
  'Che ba mau truyen thong.': 'Chè ba màu truyền thống.',
  'Che thai mat lanh day topping.': 'Chè Thái mát lạnh đầy topping.',
  'Com chay day du rau cu va dau hu.': 'Cơm chay đầy đủ rau củ và đậu hũ.',
  'Com ga xe Hoi An vang nghe.': 'Cơm gà xé Hội An vàng nghệ.',
  'Com nieu nong gion day no.': 'Cơm niêu nóng giòn, đầy no bụng.',
  'Com suon nuong than thom.': 'Cơm sườn nướng than thơm.',
  'Com tam suon bi cha phong cach Sai Gon.': 'Cơm tấm sườn bì chả phong cách Sài Gòn.',
  'Ga nuong than da gion.': 'Gà nướng than da giòn.',
  'Goi cuon tuoi mat, cham mam nem.': 'Gỏi cuốn tươi mát, chấm mắm nêm.',
  'Hen xao cay nhe, an kem banh trang.': 'Hến xào cay nhẹ, ăn kèm bánh tráng.',
  'Hot vit lon gung rau ram.': 'Hột vịt lộn gừng rau răm.',
  'Hu tieu nuoc ngot xuong.': 'Hủ tiếu nước ngọt xương.',
  'Kem bo Da Lat beo ngay.': 'Kem bơ Đà Lạt béo ngậy.',
  'Lau chay rau nam cho nhom.': 'Lẩu chay rau nấm cho nhóm.',
  'Lau mam mien Tay dam da.': 'Lẩu mắm miền Tây đậm đà.',
  'Lau thai chua cay cho nhom ban.': 'Lẩu Thái chua cay cho nhóm bạn.',
  'Luon um mui nghe va tieu.': 'Lươn um mùi nghệ và tiêu.',
  'Mi Quang it nuoc, dam da.': 'Mì Quảng ít nước, đậm đà.',
  'Mi xao bo rau cu nhanh gon.': 'Mì xào bò rau củ nhanh gọn.',
  'Nem lui nuong cuon banh trang.': 'Nem lụi nướng cuốn bánh tráng.',
  'Oc len beo va thom dua.': 'Ốc len béo và thơm dừa.',
  'Oi lac muoi ot gion cay.': 'Ổi lắc muối ớt giòn cay.',
  'Pho bo nuoc dung trong vi que hoi.': 'Phở bò nước dùng trong vị quế hồi.',
  'Pho chay voi nuoc dung rau cu.': 'Phở chay với nước dùng rau củ.',
  'Pho ga thanh ngot tu xuong ga.': 'Phở gà thanh ngọt từ xương gà.',
  'Sau rieng chin thom dac trung.': 'Sầu riêng chín thơm đặc trưng.',
  'Set bo 7 mon cho ban tiec.': 'Set bò 7 món cho bàn tiệc.',
  'Sinh to bo mat lanh.': 'Sinh tố bơ mát lạnh.',
  'Sup cua nong, dang snack sang.': 'Súp cua nóng, dạng snack sáng.',
  'Thit kho trung nuoc dua.': 'Thịt kho trứng nước dừa.',
  'Tra sua tran chau phien ban pho bien.': 'Trà sữa trân châu phiên bản phổ biến.',
  'Vit quay da gion, sot dam.': 'Vịt quay da giòn, sốt đậm.',
  'Xoai lac chua ngot cay.': 'Xoài lắc chua ngọt cay.',
  'Xoi ga quay mem, no bung.': 'Xôi gà quay mềm, no bụng.',
  'Xoi nep deo an kem dau xanh phi hanh.': 'Xôi nếp dẻo ăn kèm đậu xanh phi hành.',
};

const legacyOriginMap: Record<string, string> = {
  'Da Lat': 'Đà Lạt',
  'Ha Noi': 'Hà Nội',
  'Hoi An': 'Hội An',
  Hue: 'Huế',
  'Lang Son': 'Lạng Sơn',
  'Mien Nam': 'Miền Nam',
  'Mien Tay': 'Miền Tây',
  'Nghe An': 'Nghệ An',
  'Nha Trang': 'Nha Trang',
  'Quang Nam': 'Quảng Nam',
  'TP.HCM': 'TP.HCM',
  'Viet Nam': 'Việt Nam',
};

const legacyIngredientMap: Record<string, string> = {
  'bac ha': 'bạc hà',
  'banh mi': 'bánh mì',
  'banh pho': 'bánh phở',
  'banh trang': 'bánh tráng',
  'banh trang mong': 'bánh tráng mỏng',
  bap: 'bắp',
  bi: 'bì',
  'bot gao': 'bột gạo',
  'bot loc': 'bột lọc',
  'bot mi': 'bột mì',
  'bot nang': 'bột năng',
  bun: 'bún',
  ca: 'cá',
  'ca chua': 'cà chua',
  'ca kho': 'cá kho',
  'ca lang': 'cá lăng',
  'ca loc': 'cá lóc',
  cha: 'chả',
  'cha chay': 'chả chay',
  'cha lua': 'chả lụa',
  chuoi: 'chuối',
  com: 'cơm',
  'com nghe': 'cơm nghệ',
  'com tam': 'cơm tấm',
  'cu san': 'củ sắn',
  cua: 'cua',
  da: 'đá',
  'dau do': 'đậu đỏ',
  'dau hu': 'đậu hũ',
  'dau hu chien': 'đậu hũ chiên',
  'dau phong': 'đậu phộng',
  'dau xanh': 'đậu xanh',
  'do chua': 'đồ chua',
  dua: 'dứa',
  'dua chua': 'dưa chua',
  'dua nao': 'dừa nạo',
  duong: 'đường',
  ga: 'gà',
  'ga quay': 'gà quay',
  'ga ta': 'gà ta',
  'ga xe': 'gà xé',
  gao: 'gạo',
  'gao nep': 'gạo nếp',
  gia: 'giá',
  'gio heo': 'giò heo',
  gung: 'gừng',
  hanh: 'hành',
  'hanh la': 'hành lá',
  'hanh phi': 'hành phi',
  'hanh tay': 'hành tây',
  hen: 'hến',
  'hu tieu': 'hủ tiếu',
  'kem tuoi': 'kem tươi',
  'la chuoi': 'lá chuối',
  lac: 'lạc',
  'lap xuong': 'lạp xưởng',
  'long heo': 'lòng heo',
  luon: 'lươn',
  'mam ca': 'mắm cá',
  'mam tom': 'mắm tôm',
  'mat ong': 'mật ong',
  'me trang': 'mè trắng',
  'mi quang': 'mì Quảng',
  'mi trung': 'mì trứng',
  mit: 'mít',
  'moc nhi': 'mộc nhĩ',
  muc: 'mực',
  'muoi ot': 'muối ớt',
  'muoi tom': 'muối tôm',
  nam: 'nấm',
  'nam huong': 'nấm hương',
  'nem ran': 'nem rán',
  nghe: 'nghệ',
  'ngu vi huong': 'ngũ vị hương',
  'nuoc cot dua': 'nước cốt dừa',
  'nuoc dua': 'nước dừa',
  'nuoc lau thai': 'nước lẩu Thái',
  'nuoc mam': 'nước mắm',
  'oc len': 'ốc len',
  oi: 'ổi',
  ot: 'ớt',
  'ot chuong': 'ớt chuông',
  que: 'quế',
  rau: 'rau',
  'rau cai': 'rau cải',
  'rau cu': 'rau củ',
  'rau luoc': 'rau luộc',
  'rau mui': 'rau mùi',
  'rau ram': 'rau răm',
  'rau song': 'rau sống',
  'rau xanh': 'rau xanh',
  ruoc: 'ruốc',
  sa: 'sả',
  'sau rieng': 'sầu riêng',
  sua: 'sữa',
  'sua dac': 'sữa đặc',
  'suon heo': 'sườn heo',
  'suon nuong': 'sườn nướng',
  thach: 'thạch',
  'thi la': 'thì là',
  thit: 'thịt',
  'thit ba chi': 'thịt ba chỉ',
  'thit bo': 'thịt bò',
  'thit cua': 'thịt cua',
  'thit heo': 'thịt heo',
  'thit heo xay': 'thịt heo xay',
  'thit nguoi': 'thịt nguội',
  tieu: 'tiêu',
  tom: 'tôm',
  'tra den': 'trà đen',
  'tran chau': 'trân châu',
  trung: 'trứng',
  'trung cut': 'trứng cút',
  'trung ga': 'trứng gà',
  'trung vit': 'trứng vịt',
  'trung vit lon': 'trứng vịt lộn',
  vit: 'vịt',
  'xoai xanh': 'xoài xanh',
};

const legacyTagMap: Record<string, string> = {
  banh: 'bánh',
  beo: 'béo',
  'binh dan': 'bình dân',
  bo: 'bò',
  'bo duong': 'bổ dưỡng',
  'can bang': 'cân bằng',
  cay: 'cay',
  chay: 'chay',
  chua: 'chua',
  'chua cay': 'chua cay',
  com: 'cơm',
  'com nha': 'cơm nhà',
  'com xoi': 'cơm xôi',
  cuon: 'cuốn',
  'dac san': 'đặc sản',
  'dam vi': 'đậm vị',
  'de an': 'dễ ăn',
  dem: 'đêm',
  'gen z': 'gen z',
  'gia dinh': 'gia đình',
  gion: 'giòn',
  'hai san': 'hải sản',
  'it nuoc': 'ít nước',
  lanh: 'lạnh',
  lau: 'lẩu',
  mem: 'mềm',
  'mien Bac': 'miền Bắc',
  'mien Nam': 'miền Nam',
  'mien Tay': 'miền Tây',
  'mien Trung': 'miền Trung',
  'mui manh': 'mùi mạnh',
  ngot: 'ngọt',
  nhanh: 'nhanh',
  'nhe bung': 'nhẹ bụng',
  nhom: 'nhóm',
  no: 'no',
  'no lau': 'no lâu',
  nong: 'nóng',
  nuoc: 'nước',
  'nuoc uong': 'nước uống',
  nuong: 'nướng',
  quay: 'quay',
  'sang trong': 'sang trọng',
  'set menu': 'set menu',
  'street food': 'street food',
  'thanh mat': 'thanh mát',
  thom: 'thơm',
  'trai cay': 'trái cây',
  'trang mieng': 'tráng miệng',
  'truyen thong': 'truyền thống',
  tuoi: 'tươi',
};

const normalizeLegacyTextFields = (item: SeedFoodInput): SeedFoodInput => {
  const normalizedName = normalizeDishName(item.name);
  const ingredientOverridesByDish: Record<string, string[]> = {
    'Bún bò Huế': ['bún', 'giò heo', 'bò', 'sả'],
    'Bánh mì trứng': ['bánh mì', 'trứng gà', 'bơ', 'rau'],
    'Bắp xào': ['bắp', 'bơ', 'hành lá'],
    'Kem bơ': ['bơ', 'kem tươi', 'dừa nạo'],
    'Sinh tố bơ': ['bơ', 'sữa đặc', 'đá'],
  };

  const normalizedIngredients = item.ingredients.map(
    (ingredient) => legacyIngredientMap[ingredient] ?? ingredient,
  );

  return {
    ...item,
    description: legacyDescriptionMap[item.description] ?? item.description,
    origin: legacyOriginMap[item.origin] ?? item.origin,
    ingredients: ingredientOverridesByDish[normalizedName] ?? normalizedIngredients,
    tags: item.tags.map((tag) => legacyTagMap[tag] ?? tag),
  };
};

const baseFoods: SeedFoodInput[] = [
  // Breakfast (15)
  dish({
    name: 'Pho bo',
    description: 'Pho bo nuoc dung trong vi que hoi.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Ha Noi',
    ingredients: ['banh pho', 'thit bo', 'hanh', 'que'],
    tags: ['nuoc', 'mien Bac'],
    contextTags: ['solo', 'office', 'travel'],
    calories: 520,
    allergens: ['gluten'],
    priceMin: 45000,
    priceMax: 70000,
  }),
  dish({
    name: 'Pho ga',
    description: 'Pho ga thanh ngot tu xuong ga.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Ha Noi',
    ingredients: ['banh pho', 'ga ta', 'gung', 'hanh'],
    tags: ['nuoc', 'de an'],
    contextTags: ['solo', 'office'],
    calories: 460,
    allergens: ['gluten'],
    priceMin: 40000,
    priceMax: 65000,
  }),
  dish({
    name: 'Bun bo Hue',
    description: 'Bun bo cay nhe, thom sa.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Hue',
    ingredients: ['bun', 'gio heo', 'bo', 'sa'],
    tags: ['mien Trung', 'cay'],
    contextTags: ['solo', 'group', 'travel'],
    calories: 590,
    allergens: ['seafood'],
    priceMin: 50000,
    priceMax: 75000,
  }),
  dish({
    name: 'Banh mi thit',
    description: 'Banh mi thit nguoi Viet quen thuoc.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'dry',
    origin: 'TP.HCM',
    ingredients: ['banh mi', 'thit nguoi', 'do chua', 'rau mui'],
    tags: ['nhanh', 'street food'],
    contextTags: ['solo', 'office', 'travel'],
    calories: 430,
    allergens: ['gluten'],
    priceMin: 20000,
    priceMax: 35000,
  }),
  dish({
    name: 'Banh mi trung',
    description: 'Banh mi op la don gian.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['banh mi', 'trung ga', 'bo', 'rau'],
    tags: ['nhanh', 'de an'],
    contextTags: ['solo', 'office'],
    calories: 390,
    allergens: ['gluten', 'egg'],
    priceMin: 18000,
    priceMax: 30000,
  }),
  dish({
    name: 'Xoi xeo',
    description: 'Xoi nep deo an kem dau xanh phi hanh.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'Ha Noi',
    ingredients: ['gao nep', 'dau xanh', 'hanh phi'],
    tags: ['no lau', 'mien Bac'],
    contextTags: ['solo', 'office'],
    calories: 610,
    allergens: [],
    priceMin: 20000,
    priceMax: 35000,
  }),
  dish({
    name: 'Xoi ga',
    description: 'Xoi ga quay mem, no bung.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'TP.HCM',
    ingredients: ['gao nep', 'ga quay', 'dua chua'],
    tags: ['no lau', 'com xoi'],
    contextTags: ['solo', 'office'],
    calories: 650,
    allergens: [],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Chao long',
    description: 'Chao nong an kem long heo.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'Mien Nam',
    ingredients: ['gao', 'long heo', 'gung'],
    tags: ['nong', 'binh dan'],
    contextTags: ['solo', 'group'],
    calories: 500,
    allergens: [],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Banh cuon',
    description: 'Banh cuon nong nhan thit moc nhi.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'Ha Noi',
    ingredients: ['bot gao', 'thit heo', 'moc nhi'],
    tags: ['mien Bac', 'mem'],
    contextTags: ['solo', 'date'],
    calories: 420,
    allergens: [],
    priceMin: 30000,
    priceMax: 50000,
  }),
  dish({
    name: 'Hu tieu',
    description: 'Hu tieu nuoc ngot xuong.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Mien Tay',
    ingredients: ['hu tieu', 'tom', 'thit heo'],
    tags: ['mien Nam', 'nuoc'],
    contextTags: ['solo', 'group', 'travel'],
    calories: 530,
    allergens: ['seafood'],
    priceMin: 40000,
    priceMax: 65000,
  }),
  dish({
    name: 'Bun rieu',
    description: 'Bun rieu cua chua nhe.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Ha Noi',
    ingredients: ['bun', 'cua', 'ca chua'],
    tags: ['chua', 'mien Bac'],
    contextTags: ['solo', 'office'],
    calories: 510,
    allergens: ['seafood'],
    priceMin: 40000,
    priceMax: 65000,
  }),
  dish({
    name: 'Com tam',
    description: 'Com tam suon bi cha phong cach Sai Gon.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'TP.HCM',
    ingredients: ['com tam', 'suon nuong', 'bi', 'cha'],
    tags: ['mien Nam', 'com'],
    contextTags: ['solo', 'office', 'group'],
    calories: 760,
    allergens: ['egg'],
    priceMin: 45000,
    priceMax: 75000,
  }),
  dish({
    name: 'Banh uot',
    description: 'Banh uot mem an kem cha lua.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'Da Lat',
    ingredients: ['bot gao', 'cha lua', 'hanh phi'],
    tags: ['mem', 'de an'],
    contextTags: ['solo', 'date'],
    calories: 400,
    allergens: [],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Mi Quang',
    description: 'Mi Quang it nuoc, dam da.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'dry',
    origin: 'Quang Nam',
    ingredients: ['mi quang', 'tom', 'thit heo', 'dau phong'],
    tags: ['mien Trung', 'it nuoc'],
    contextTags: ['solo', 'group', 'travel'],
    calories: 580,
    allergens: ['peanut', 'seafood'],
    priceMin: 45000,
    priceMax: 70000,
  }),
  dish({
    name: 'Sup cua',
    description: 'Sup cua nong, dang snack sang.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['thit cua', 'trung cut', 'bot nang'],
    tags: ['nong', 'street food'],
    contextTags: ['solo', 'office'],
    calories: 320,
    allergens: ['seafood', 'egg'],
    priceMin: 20000,
    priceMax: 35000,
  }),

  // Lunch/Dinner (25)
  dish({
    name: 'Com suon',
    description: 'Com suon nuong than thom.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'TP.HCM',
    ingredients: ['com', 'suon heo', 'nuoc mam'],
    tags: ['com', 'no'],
    contextTags: ['solo', 'office', 'group'],
    calories: 740,
    priceMin: 50000,
    priceMax: 80000,
  }),
  dish({
    name: 'Bun cha',
    description: 'Bun cha Ha Noi nuong than.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'Ha Noi',
    ingredients: ['bun', 'thit heo', 'rau song'],
    tags: ['mien Bac', 'nuong'],
    contextTags: ['date', 'group', 'travel'],
    calories: 620,
    priceMin: 50000,
    priceMax: 85000,
  }),
  dish({
    name: 'Bun nem',
    description: 'Bun an kem nem ran gion.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'Ha Noi',
    ingredients: ['bun', 'nem ran', 'rau song'],
    tags: ['gion', 'mien Bac'],
    contextTags: ['solo', 'group'],
    calories: 600,
    allergens: ['gluten'],
    priceMin: 45000,
    priceMax: 70000,
  }),
  dish({
    name: 'Ca kho to',
    description: 'Ca kho to dam vi, hao com.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'dry',
    origin: 'Mien Tay',
    ingredients: ['ca loc', 'nuoc mam', 'tieu'],
    tags: ['com nha', 'dam vi'],
    contextTags: ['group', 'office'],
    calories: 520,
    allergens: ['fish'],
    priceMin: 60000,
    priceMax: 120000,
  }),
  dish({
    name: 'Thit kho tau',
    description: 'Thit kho trung nuoc dua.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'dry',
    origin: 'Mien Nam',
    ingredients: ['thit ba chi', 'trung vit', 'nuoc dua'],
    tags: ['truyen thong', 'com'],
    contextTags: ['group', 'office'],
    calories: 680,
    allergens: ['egg'],
    priceMin: 55000,
    priceMax: 110000,
  }),
  dish({
    name: 'Canh chua',
    description: 'Canh chua ca mien Tay giai nhiet.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Mien Tay',
    ingredients: ['ca', 'dua', 'bac ha', 'ca chua'],
    tags: ['chua', 'thanh mat'],
    contextTags: ['group', 'travel'],
    calories: 360,
    allergens: ['fish'],
    priceMin: 50000,
    priceMax: 100000,
  }),
  dish({
    name: 'Lau thai',
    description: 'Lau thai chua cay cho nhom ban.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['nuoc lau thai', 'tom', 'muc', 'nam'],
    tags: ['lau', 'chua cay'],
    contextTags: ['group', 'date'],
    calories: 820,
    allergens: ['seafood'],
    priceMin: 220000,
    priceMax: 450000,
  }),
  dish({
    name: 'Lau mam',
    description: 'Lau mam mien Tay dam da.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'Mien Tay',
    ingredients: ['mam ca', 'tom', 'muc', 'rau song'],
    tags: ['lau', 'mien Tay'],
    contextTags: ['group', 'travel'],
    calories: 900,
    allergens: ['seafood', 'fish'],
    priceMin: 250000,
    priceMax: 500000,
  }),
  dish({
    name: 'Ga nuong',
    description: 'Ga nuong than da gion.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'Nha Trang',
    ingredients: ['ga', 'mat ong', 'sa'],
    tags: ['nuong', 'thom'],
    contextTags: ['group', 'date'],
    calories: 720,
    priceMin: 150000,
    priceMax: 300000,
  }),
  dish({
    name: 'Vit quay',
    description: 'Vit quay da gion, sot dam.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'grilled',
    origin: 'Lang Son',
    ingredients: ['vit', 'ngu vi huong', 'mat ong'],
    tags: ['quay', 'gion'],
    contextTags: ['group', 'date'],
    calories: 860,
    priceMin: 180000,
    priceMax: 380000,
  }),
  dish({
    name: 'Com ga Hoi An',
    description: 'Com ga xe Hoi An vang nghe.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'dry',
    origin: 'Hoi An',
    ingredients: ['com nghe', 'ga xe', 'rau ram'],
    tags: ['mien Trung', 'com'],
    contextTags: ['solo', 'travel'],
    calories: 630,
    priceMin: 55000,
    priceMax: 90000,
  }),
  dish({
    name: 'Mi xao bo',
    description: 'Mi xao bo rau cu nhanh gon.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['mi trung', 'thit bo', 'rau cai'],
    tags: ['xao', 'nhanh'],
    contextTags: ['solo', 'office'],
    calories: 610,
    allergens: ['gluten', 'egg'],
    priceMin: 50000,
    priceMax: 85000,
  }),
  dish({
    name: 'Banh xeo',
    description: 'Banh xeo vang gion cuon rau.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'Mien Tay',
    ingredients: ['bot gao', 'tom', 'thit', 'gia'],
    tags: ['gion', 'cuon'],
    contextTags: ['group', 'date', 'travel'],
    calories: 700,
    allergens: ['seafood'],
    priceMin: 60000,
    priceMax: 120000,
  }),
  dish({
    name: 'Bo luc lac',
    description: 'Bo luc lac mem, sot tieu den.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['thit bo', 'ot chuong', 'hanh tay'],
    tags: ['bo', 'sang trong'],
    contextTags: ['date', 'group'],
    calories: 680,
    priceMin: 120000,
    priceMax: 220000,
  }),
  dish({
    name: 'Oc len xao dua',
    description: 'Oc len beo va thom dua.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner', 'snack'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['oc len', 'nuoc cot dua', 'sa'],
    tags: ['hai san', 'beo'],
    contextTags: ['group', 'date'],
    calories: 540,
    allergens: ['seafood'],
    priceMin: 70000,
    priceMax: 130000,
  }),
  dish({
    name: 'Cha ca La Vong',
    description: 'Cha ca Ha Noi an kem thi la.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'fried',
    origin: 'Ha Noi',
    ingredients: ['ca lang', 'nghe', 'thi la'],
    tags: ['mien Bac', 'dac san'],
    contextTags: ['date', 'group', 'travel'],
    calories: 640,
    allergens: ['fish'],
    priceMin: 150000,
    priceMax: 300000,
  }),
  dish({
    name: 'Bun dau mam tom',
    description: 'Bun dau day du topping.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'Ha Noi',
    ingredients: ['bun', 'dau hu chien', 'mam tom'],
    tags: ['mien Bac', 'street food'],
    contextTags: ['group', 'travel'],
    calories: 620,
    allergens: ['soy'],
    priceMin: 45000,
    priceMax: 90000,
  }),
  dish({
    name: 'Com nieu',
    description: 'Com nieu nong gion day no.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'dry',
    origin: 'Nha Trang',
    ingredients: ['gao', 'ca kho', 'rau luoc'],
    tags: ['com', 'gia dinh'],
    contextTags: ['group', 'date'],
    calories: 780,
    priceMin: 160000,
    priceMax: 320000,
  }),
  dish({
    name: 'Luon um la chuoi',
    description: 'Luon um mui nghe va tieu.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'steamed',
    origin: 'Nghe An',
    ingredients: ['luon', 'nghe', 'la chuoi'],
    tags: ['dac san', 'mien Trung'],
    contextTags: ['group', 'travel'],
    calories: 660,
    allergens: ['fish'],
    priceMin: 150000,
    priceMax: 280000,
  }),
  dish({
    name: 'Goi cuon tom thit',
    description: 'Goi cuon tuoi mat, cham mam nem.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Mien Nam',
    ingredients: ['banh trang', 'tom', 'thit heo', 'rau song'],
    tags: ['tuoi', 'nhe bung'],
    contextTags: ['date', 'group', 'office'],
    calories: 330,
    allergens: ['seafood'],
    priceMin: 35000,
    priceMax: 70000,
  }),
  dish({
    name: 'Hen xuc banh trang',
    description: 'Hen xao cay nhe, an kem banh trang.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner', 'snack'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'Hue',
    ingredients: ['hen', 'hanh phi', 'lac', 'banh trang'],
    tags: ['mien Trung', 'cay'],
    contextTags: ['group', 'travel'],
    calories: 470,
    allergens: ['seafood', 'peanut'],
    priceMin: 60000,
    priceMax: 120000,
  }),
  dish({
    name: 'Nem lui',
    description: 'Nem lui nuong cuon banh trang.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'Hue',
    ingredients: ['thit heo xay', 'sa', 'banh trang'],
    tags: ['nuong', 'cuon'],
    contextTags: ['date', 'group', 'travel'],
    calories: 590,
    allergens: ['peanut'],
    priceMin: 65000,
    priceMax: 130000,
  }),
  dish({
    name: 'Banh canh cua',
    description: 'Banh canh soi day, nuoc dung cua.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['bot loc', 'cua', 'tom'],
    tags: ['nuoc', 'hai san'],
    contextTags: ['solo', 'group'],
    calories: 620,
    allergens: ['seafood'],
    priceMin: 60000,
    priceMax: 110000,
  }),
  dish({
    name: 'Bo 7 mon',
    description: 'Set bo 7 mon cho ban tiec.',
    categoryName: 'Mon Viet',
    mealTypes: ['dinner'],
    priceRange: 'expensive',
    cookingStyle: 'grilled',
    origin: 'TP.HCM',
    ingredients: ['thit bo', 'rau song', 'banh trang'],
    tags: ['set menu', 'nhom'],
    contextTags: ['group', 'date'],
    calories: 980,
    priceMin: 280000,
    priceMax: 550000,
  }),
  dish({
    name: 'Chao vit',
    description: 'Chao vit nong an kem goi.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Mien Tay',
    ingredients: ['gao', 'vit', 'gung'],
    tags: ['nong', 'bo duong'],
    contextTags: ['solo', 'group'],
    calories: 560,
    priceMin: 55000,
    priceMax: 100000,
  }),

  // Snacks (15)
  dish({
    name: 'Banh trang tron',
    description: 'Banh trang tron vi chua ngot cay.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'dry',
    origin: 'TP.HCM',
    ingredients: ['banh trang', 'xoai xanh', 'ruoc'],
    tags: ['street food', 'cay'],
    contextTags: ['group', 'travel', 'office'],
    calories: 360,
    allergens: ['seafood'],
    priceMin: 15000,
    priceMax: 30000,
  }),
  dish({
    name: 'Bap xao',
    description: 'Bap xao bo hanh thom.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['bap', 'bo', 'hanh la'],
    tags: ['nong', 'dem'],
    contextTags: ['solo', 'group'],
    calories: 340,
    allergens: ['milk'],
    priceMin: 15000,
    priceMax: 30000,
  }),
  dish({
    name: 'Hot vit lon',
    description: 'Hot vit lon gung rau ram.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'Viet Nam',
    ingredients: ['trung vit lon', 'gung', 'rau ram'],
    tags: ['bo duong', 'street food'],
    contextTags: ['solo', 'group'],
    calories: 260,
    allergens: ['egg'],
    priceMin: 12000,
    priceMax: 25000,
  }),
  dish({
    name: 'Banh flan',
    description: 'Banh flan mem min ngot thanh.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'TP.HCM',
    ingredients: ['trung', 'sua', 'duong'],
    tags: ['trang mieng', 'ngot'],
    contextTags: ['date', 'solo'],
    calories: 230,
    allergens: ['egg', 'milk'],
    priceMin: 18000,
    priceMax: 35000,
  }),
  dish({
    name: 'Che thai',
    description: 'Che thai mat lanh day topping.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'TP.HCM',
    ingredients: ['sau rieng', 'mit', 'thach'],
    tags: ['lanh', 'ngot'],
    contextTags: ['group', 'date'],
    calories: 320,
    allergens: ['milk'],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Che ba mau',
    description: 'Che ba mau truyen thong.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Mien Nam',
    ingredients: ['dau do', 'dau xanh', 'thach'],
    tags: ['trang mieng', 'lanh'],
    contextTags: ['solo', 'group'],
    calories: 300,
    allergens: [],
    priceMin: 20000,
    priceMax: 40000,
  }),
  dish({
    name: 'Kem bo',
    description: 'Kem bo Da Lat beo ngay.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Da Lat',
    ingredients: ['bo', 'kem tuoi', 'dua nao'],
    tags: ['lanh', 'beo'],
    contextTags: ['date', 'travel'],
    calories: 380,
    allergens: ['milk'],
    priceMin: 25000,
    priceMax: 50000,
  }),
  dish({
    name: 'Sau rieng',
    description: 'Sau rieng chin thom dac trung.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'medium',
    cookingStyle: 'raw',
    origin: 'Mien Tay',
    ingredients: ['sau rieng'],
    tags: ['trai cay', 'mui manh'],
    contextTags: ['solo', 'group'],
    calories: 450,
    allergens: [],
    priceMin: 60000,
    priceMax: 120000,
  }),
  dish({
    name: 'Sinh to bo',
    description: 'Sinh to bo mat lanh.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Viet Nam',
    ingredients: ['bo', 'sua dac', 'da'],
    tags: ['nuoc uong', 'lanh'],
    contextTags: ['solo', 'office'],
    calories: 340,
    allergens: ['milk'],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Tra sua tran chau',
    description: 'Tra sua tran chau phien ban pho bien.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'TP.HCM',
    ingredients: ['tra den', 'sua', 'tran chau'],
    tags: ['nuoc uong', 'gen z'],
    contextTags: ['group', 'date', 'office'],
    calories: 420,
    allergens: ['milk'],
    priceMin: 30000,
    priceMax: 65000,
  }),
  dish({
    name: 'Banh tieu',
    description: 'Banh tieu chien nong gion xop.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['bot mi', 'me trang', 'duong'],
    tags: ['gion', 'banh'],
    contextTags: ['solo', 'travel'],
    calories: 320,
    allergens: ['gluten'],
    priceMin: 10000,
    priceMax: 20000,
  }),
  dish({
    name: 'Bo bia',
    description: 'Bo bia ngot nhe voi lap xuong.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'TP.HCM',
    ingredients: ['banh trang mong', 'lap xuong', 'cu san'],
    tags: ['cuon', 'street food'],
    contextTags: ['group', 'travel'],
    calories: 280,
    allergens: ['gluten'],
    priceMin: 15000,
    priceMax: 30000,
  }),
  dish({
    name: 'Banh chuoi nuong',
    description: 'Banh chuoi nuong thom cot dua.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'grilled',
    origin: 'Mien Tay',
    ingredients: ['chuoi', 'bot mi', 'nuoc cot dua'],
    tags: ['ngot', 'banh'],
    contextTags: ['date', 'solo'],
    calories: 360,
    allergens: ['gluten', 'milk'],
    priceMin: 20000,
    priceMax: 40000,
  }),
  dish({
    name: 'Oi lac muoi ot',
    description: 'Oi lac muoi ot gion cay.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Viet Nam',
    ingredients: ['oi', 'muoi tom', 'ot'],
    tags: ['trai cay', 'cay'],
    contextTags: ['solo', 'office'],
    calories: 120,
    allergens: [],
    priceMin: 15000,
    priceMax: 30000,
  }),
  dish({
    name: 'Xoai lac',
    description: 'Xoai lac chua ngot cay.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Viet Nam',
    ingredients: ['xoai xanh', 'duong', 'muoi ot'],
    tags: ['trai cay', 'street food'],
    contextTags: ['solo', 'group', 'office'],
    calories: 140,
    allergens: [],
    priceMin: 15000,
    priceMax: 30000,
  }),

  // Vegetarian (5)
  dish({
    name: 'Com chay',
    description: 'Com chay day du rau cu va dau hu.',
    categoryName: 'Do Chay',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'cheap',
    cookingStyle: 'dry',
    origin: 'TP.HCM',
    ingredients: ['com', 'dau hu', 'rau cu'],
    tags: ['chay', 'can bang'],
    contextTags: ['solo', 'office', 'group'],
    calories: 490,
    dietTags: ['vegetarian', 'clean'],
    priceMin: 45000,
    priceMax: 80000,
  }),
  dish({
    name: 'Bun chay',
    description: 'Bun chay nuoc dung nam ngot thanh.',
    categoryName: 'Do Chay',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'Hue',
    ingredients: ['bun', 'nam', 'dau hu'],
    tags: ['chay', 'nuoc'],
    contextTags: ['solo', 'office'],
    calories: 420,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    priceMin: 35000,
    priceMax: 70000,
  }),
  dish({
    name: 'Pho chay',
    description: 'Pho chay voi nuoc dung rau cu.',
    categoryName: 'Do Chay',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'Ha Noi',
    ingredients: ['banh pho', 'nam huong', 'rau cu'],
    tags: ['chay', 'mien Bac'],
    contextTags: ['solo', 'office'],
    calories: 410,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    priceMin: 35000,
    priceMax: 70000,
  }),
  dish({
    name: 'Banh mi chay',
    description: 'Banh mi chay voi cha chay.',
    categoryName: 'Do Chay',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'dry',
    origin: 'TP.HCM',
    ingredients: ['banh mi', 'cha chay', 'do chua'],
    tags: ['chay', 'nhanh'],
    contextTags: ['solo', 'office', 'travel'],
    calories: 360,
    dietTags: ['vegetarian', 'vegan'],
    allergens: ['gluten'],
    priceMin: 20000,
    priceMax: 40000,
  }),
  dish({
    name: 'Lau chay',
    description: 'Lau chay rau nam cho nhom.',
    categoryName: 'Do Chay',
    mealTypes: ['dinner'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['nam', 'dau hu', 'rau xanh'],
    tags: ['chay', 'lau'],
    contextTags: ['group', 'date'],
    calories: 560,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    priceMin: 150000,
    priceMax: 280000,
  }),
];

const extraFoods: SeedFoodInput[] = [
  // More dishes
  dish({
    name: 'Bánh giò',
    description: 'Bánh giò nóng với nhân thịt băm và mộc nhĩ.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'steamed',
    origin: 'Hà Nội',
    ingredients: ['bột gạo', 'thịt băm', 'mộc nhĩ'],
    tags: ['bữa sáng', 'mềm'],
    contextTags: ['solo', 'office'],
    calories: 380,
    allergens: ['gluten'],
    priceMin: 18000,
    priceMax: 35000,
  }),
  dish({
    name: 'Cháo sườn',
    description: 'Cháo sườn mịn, rắc quẩy giòn.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'Hà Nội',
    ingredients: ['gạo', 'sườn non', 'quẩy'],
    tags: ['nóng', 'dễ ăn'],
    contextTags: ['solo', 'office'],
    calories: 360,
    allergens: ['gluten'],
    priceMin: 20000,
    priceMax: 40000,
  }),
  dish({
    name: 'Bún mắm',
    description: 'Bún mắm miền Tây đậm đà hải sản.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Sóc Trăng',
    ingredients: ['bún', 'mắm cá', 'tôm', 'mực'],
    tags: ['miền Tây', 'đậm vị'],
    contextTags: ['group', 'travel'],
    calories: 690,
    allergens: ['seafood', 'fish'],
    priceMin: 65000,
    priceMax: 120000,
  }),
  dish({
    name: 'Bánh đa cua',
    description: 'Bánh đa đỏ nước dùng cua thơm ngọt.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Hải Phòng',
    ingredients: ['bánh đa đỏ', 'riêu cua', 'chả lá lốt'],
    tags: ['miền Bắc', 'nước'],
    contextTags: ['solo', 'travel'],
    calories: 560,
    allergens: ['seafood'],
    priceMin: 50000,
    priceMax: 85000,
  }),
  dish({
    name: 'Bún cá Châu Đốc',
    description: 'Bún cá nghệ vàng, thêm rau bông điên điển.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'An Giang',
    ingredients: ['bún', 'cá lóc', 'nghệ', 'rau sống'],
    tags: ['miền Tây', 'đặc sản'],
    contextTags: ['solo', 'travel'],
    calories: 540,
    allergens: ['fish'],
    priceMin: 50000,
    priceMax: 90000,
  }),
  dish({
    name: 'Hủ tiếu gõ',
    description: 'Tô hủ tiếu bình dân, nhanh gọn buổi tối.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner', 'snack'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['hủ tiếu', 'thịt heo', 'gan', 'hẹ'],
    tags: ['street food', 'đêm'],
    contextTags: ['solo', 'travel'],
    calories: 500,
    allergens: ['gluten'],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Bún mọc',
    description: 'Bún mọc thanh nhẹ với mọc nấm thơm.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'soup',
    origin: 'Hà Nội',
    ingredients: ['bún', 'mọc heo', 'nấm hương'],
    tags: ['thanh nhẹ', 'miền Bắc'],
    contextTags: ['solo', 'office'],
    calories: 490,
    priceMin: 45000,
    priceMax: 75000,
  }),
  dish({
    name: 'Bánh hỏi heo quay',
    description: 'Bánh hỏi mềm ăn kèm heo quay giòn bì.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'dry',
    origin: 'Bình Định',
    ingredients: ['bánh hỏi', 'heo quay', 'hẹ dầu'],
    tags: ['miền Trung', 'đặc sản'],
    contextTags: ['group', 'travel'],
    calories: 720,
    allergens: ['gluten'],
    priceMin: 65000,
    priceMax: 120000,
  }),
  dish({
    name: 'Cơm gà xối mỡ',
    description: 'Gà chiên da giòn ăn cùng cơm vàng.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['cơm', 'đùi gà', 'dưa leo'],
    tags: ['giòn', 'no lâu'],
    contextTags: ['solo', 'office'],
    calories: 780,
    allergens: [],
    priceMin: 55000,
    priceMax: 95000,
  }),
  dish({
    name: 'Mì vịt tiềm',
    description: 'Mì vịt tiềm thuốc bắc, nước dùng đậm vị.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['mì trứng', 'vịt', 'thuốc bắc'],
    tags: ['bổ dưỡng', 'nước'],
    contextTags: ['date', 'group'],
    calories: 790,
    allergens: ['gluten'],
    priceMin: 90000,
    priceMax: 160000,
  }),
  dish({
    name: 'Bún thịt nướng',
    description: 'Bún thịt nướng mỡ hành, chấm nước mắm chua ngọt.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'TP.HCM',
    ingredients: ['bún', 'thịt nướng', 'đậu phộng', 'rau sống'],
    tags: ['street food', 'đậm vị'],
    contextTags: ['solo', 'office', 'travel'],
    calories: 650,
    allergens: ['peanut'],
    priceMin: 45000,
    priceMax: 80000,
  }),
  dish({
    name: 'Bò né',
    description: 'Bò né chảo nóng ăn kèm trứng và pate.',
    categoryName: 'Mon Viet',
    mealTypes: ['breakfast', 'lunch'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['thịt bò', 'trứng', 'pate', 'bánh mì'],
    tags: ['chảo nóng', 'bữa sáng'],
    contextTags: ['solo', 'date'],
    calories: 730,
    allergens: ['egg', 'gluten'],
    priceMin: 60000,
    priceMax: 110000,
  }),
  dish({
    name: 'Cơm chiên hải sản',
    description: 'Cơm chiên tơi với tôm mực và rau củ.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'fried',
    origin: 'Nha Trang',
    ingredients: ['cơm', 'tôm', 'mực', 'trứng'],
    tags: ['hải sản', 'đậm vị'],
    contextTags: ['group', 'date'],
    calories: 700,
    allergens: ['seafood', 'egg'],
    priceMin: 70000,
    priceMax: 130000,
  }),
  dish({
    name: 'Gỏi ngó sen tôm thịt',
    description: 'Gỏi ngó sen chua ngọt giòn mát.',
    categoryName: 'Mon Viet',
    mealTypes: ['lunch', 'dinner', 'snack'],
    priceRange: 'medium',
    cookingStyle: 'raw',
    origin: 'Đồng Tháp',
    ingredients: ['ngó sen', 'tôm', 'thịt ba chỉ', 'rau răm'],
    tags: ['khai vị', 'thanh mát'],
    contextTags: ['date', 'group'],
    calories: 360,
    allergens: ['seafood'],
    priceMin: 70000,
    priceMax: 140000,
  }),
  dish({
    name: 'Ốc hương rang muối',
    description: 'Ốc hương rang muối cay mặn hấp dẫn.',
    categoryName: 'Mon Viet',
    mealTypes: ['dinner', 'snack'],
    priceRange: 'expensive',
    cookingStyle: 'fried',
    origin: 'Vũng Tàu',
    ingredients: ['ốc hương', 'muối ớt', 'bơ'],
    tags: ['hải sản', 'lai rai'],
    contextTags: ['group', 'date', 'travel'],
    calories: 520,
    allergens: ['seafood', 'milk'],
    priceMin: 150000,
    priceMax: 280000,
  }),
  dish({
    name: 'Chân gà sả tắc',
    description: 'Chân gà giòn dai ngâm sả tắc.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'TP.HCM',
    ingredients: ['chân gà', 'sả', 'tắc', 'ớt'],
    tags: ['chua cay', 'ăn vặt'],
    contextTags: ['group', 'office'],
    calories: 320,
    allergens: [],
    priceMin: 30000,
    priceMax: 60000,
  }),
  dish({
    name: 'Bánh tráng nướng',
    description: 'Bánh tráng nướng giòn với topping trứng, xúc xích.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'grilled',
    origin: 'Đà Lạt',
    ingredients: ['bánh tráng', 'trứng', 'hành lá', 'xúc xích'],
    tags: ['đà lạt', 'giòn'],
    contextTags: ['group', 'travel'],
    calories: 410,
    allergens: ['egg', 'gluten'],
    priceMin: 20000,
    priceMax: 45000,
  }),
  dish({
    name: 'Khoai lang kén',
    description: 'Khoai lang kén chiên giòn, chấm tương ớt.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'Việt Nam',
    ingredients: ['khoai lang', 'bột mì', 'vừng'],
    tags: ['chiên', 'ăn vặt'],
    contextTags: ['solo', 'group'],
    calories: 300,
    allergens: ['gluten'],
    priceMin: 18000,
    priceMax: 35000,
  }),
  dish({
    name: 'Tàu hũ đá',
    description: 'Tàu hũ mềm mịn chan nước đường gừng.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Việt Nam',
    ingredients: ['đậu nành', 'đường', 'gừng'],
    tags: ['tráng miệng', 'mát'],
    contextTags: ['solo', 'office'],
    calories: 180,
    allergens: ['soy'],
    priceMin: 12000,
    priceMax: 25000,
  }),
  dish({
    name: 'Sữa chua nếp cẩm',
    description: 'Sữa chua nếp cẩm dẻo, vị ngọt dịu.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'Hà Nội',
    ingredients: ['sữa chua', 'nếp cẩm', 'sữa đặc'],
    tags: ['tráng miệng', 'lạnh'],
    contextTags: ['date', 'solo'],
    calories: 280,
    allergens: ['milk'],
    priceMin: 20000,
    priceMax: 40000,
  }),
  dish({
    name: 'Chè khúc bạch',
    description: 'Chè khúc bạch thanh mát với hạnh nhân.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'raw',
    origin: 'TP.HCM',
    ingredients: ['khúc bạch', 'vải', 'hạnh nhân'],
    tags: ['ngọt', 'mát'],
    contextTags: ['date', 'group'],
    calories: 260,
    allergens: ['milk', 'peanut'],
    priceMin: 25000,
    priceMax: 45000,
  }),
  dish({
    name: 'Bánh cam',
    description: 'Bánh cam nhân đậu xanh, vỏ mè giòn.',
    categoryName: 'An Vat',
    mealTypes: ['snack'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'Miền Nam',
    ingredients: ['bột nếp', 'đậu xanh', 'mè'],
    tags: ['ngọt', 'chiên'],
    contextTags: ['solo', 'travel'],
    calories: 290,
    allergens: [],
    priceMin: 8000,
    priceMax: 18000,
  }),
  dish({
    name: 'Lẩu gà lá é',
    description: 'Lẩu gà lá é vị chua thanh, thơm nồng.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'Phú Yên',
    ingredients: ['gà ta', 'lá é', 'nấm', 'măng'],
    tags: ['lẩu', 'đặc sản'],
    contextTags: ['group', 'travel'],
    calories: 850,
    allergens: [],
    priceMin: 220000,
    priceMax: 420000,
  }),
  dish({
    name: 'Lẩu bò nhúng giấm',
    description: 'Thịt bò nhúng giấm chua nhẹ, ăn kèm rau.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['thịt bò', 'giấm', 'hành tây', 'rau sống'],
    tags: ['lẩu', 'bò'],
    contextTags: ['group', 'date'],
    calories: 820,
    allergens: [],
    priceMin: 260000,
    priceMax: 480000,
  }),
  dish({
    name: 'Lẩu cua đồng',
    description: 'Lẩu cua đồng thơm riêu, ăn cùng rau mồng tơi.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['dinner'],
    priceRange: 'expensive',
    cookingStyle: 'soup',
    origin: 'Miền Bắc',
    ingredients: ['riêu cua', 'bò', 'đậu phụ', 'rau mồng tơi'],
    tags: ['lẩu', 'riêu cua'],
    contextTags: ['group', 'travel'],
    calories: 880,
    allergens: ['seafood'],
    priceMin: 250000,
    priceMax: 500000,
  }),
  dish({
    name: 'Sườn nướng mật ong',
    description: 'Sườn nướng mềm thơm vị mật ong.',
    categoryName: 'Lau Va Nuong',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'expensive',
    cookingStyle: 'grilled',
    origin: 'TP.HCM',
    ingredients: ['sườn heo', 'mật ong', 'tỏi', 'tiêu'],
    tags: ['nướng', 'đậm vị'],
    contextTags: ['date', 'group'],
    calories: 760,
    allergens: [],
    priceMin: 140000,
    priceMax: 260000,
  }),
  dish({
    name: 'Cơm chiên rau củ chay',
    description: 'Cơm chiên chay với nấm và rau củ nhiều màu.',
    categoryName: 'Do Chay',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'cheap',
    cookingStyle: 'fried',
    origin: 'TP.HCM',
    ingredients: ['cơm', 'nấm', 'cà rốt', 'đậu Hà Lan'],
    tags: ['chay', 'nhanh'],
    contextTags: ['solo', 'office'],
    calories: 460,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    allergens: ['soy'],
    priceMin: 45000,
    priceMax: 75000,
  }),
  dish({
    name: 'Bún Thái chay',
    description: 'Bún Thái chay chua cay từ nấm và thơm.',
    categoryName: 'Do Chay',
    mealTypes: ['lunch', 'dinner'],
    priceRange: 'cheap',
    cookingStyle: 'soup',
    origin: 'TP.HCM',
    ingredients: ['bún', 'nấm', 'thơm', 'cà chua'],
    tags: ['chay', 'chua cay'],
    contextTags: ['solo', 'group'],
    calories: 430,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    allergens: [],
    priceMin: 45000,
    priceMax: 80000,
  }),
  dish({
    name: 'Nấm nướng giấy bạc',
    description: 'Nấm nướng bơ tỏi thơm, phù hợp ăn nhẹ.',
    categoryName: 'Do Chay',
    mealTypes: ['snack', 'dinner'],
    priceRange: 'medium',
    cookingStyle: 'grilled',
    origin: 'Đà Lạt',
    ingredients: ['nấm đùi gà', 'nấm kim châm', 'bơ thực vật'],
    tags: ['chay', 'nướng'],
    contextTags: ['date', 'group'],
    calories: 320,
    dietTags: ['vegetarian', 'vegan', 'clean'],
    allergens: ['soy'],
    priceMin: 70000,
    priceMax: 130000,
  }),
];

const escapeSvgText = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildFallbackImageUrl = (nameSlug: string): string => {
  const displayName = (nameSlug || 'mon-an-lac-lac').replace(/-/g, ' ').trim();
  const safeDisplayName = escapeSvgText(displayName.slice(0, 40));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#ffedd5"/></linearGradient></defs><rect width="1200" height="800" fill="url(#bg)"/><text x="600" y="392" text-anchor="middle" fill="#9a3412" font-family="Arial, sans-serif" font-size="58" font-weight="700">Lac Lac</text><text x="600" y="462" text-anchor="middle" fill="#c2410c" font-family="Arial, sans-serif" font-size="36">${safeDisplayName}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const buildWikipediaSearchQueries = (dishName: string): string[] => {
  return Array.from(
    new Set([dishName, `${dishName} món ăn`, `${dishName} Việt Nam`, `${dishName} food`]),
  );
};

const isHttpUrl = (value: string | null | undefined): value is string => {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetriableUploadError = (error?: string): boolean => {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();
  return (
    normalized.includes('429') ||
    normalized.includes('timeout') ||
    normalized.includes('network') ||
    normalized.includes('fetch failed')
  );
};

const toCloudinaryPublicId = (assetName: string): string | undefined => {
  const normalized = assetName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s/_-]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return normalized || undefined;
};

const hasCloudinaryConfig = (): boolean => {
  return (
    !!process.env['CLOUDINARY_CLOUD_NAME'] &&
    !!process.env['CLOUDINARY_API_KEY'] &&
    !!process.env['CLOUDINARY_API_SECRET']
  );
};

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
};

const fetchImageAsDataUrl = async (imageUrl: string): Promise<string> => {
  const parsedUrl = new URL(imageUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('imageUrl must start with http or https');
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(REMOTE_IMAGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Cannot fetch image from URL (HTTP ${response.status})`);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('URL does not return valid image content');
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error('Image payload is empty');
  }

  if (bytes.length > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('Image is larger than 10MB');
  }

  return `data:${contentType};base64,${bytes.toString('base64')}`;
};

const uploadDishImageDirectToCloudinary = async (
  imageInput: string,
  assetName: string,
): Promise<MediaUploadResult> => {
  if (!hasCloudinaryConfig()) {
    return { ok: false, error: 'Missing CLOUDINARY_* configuration in environment' };
  }

  cloudinary.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
    api_key: process.env['CLOUDINARY_API_KEY'],
    api_secret: process.env['CLOUDINARY_API_SECRET'],
  });

  const publicId = toCloudinaryPublicId(assetName);
  const uploadOptions = {
    folder: 'lac-lac',
    ...(publicId
      ? {
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          unique_filename: false,
          use_filename: false,
        }
      : {}),
    format: 'webp',
    resource_type: 'image' as const,
  };

  try {
    const uploaded = await cloudinary.uploader.upload(imageInput, uploadOptions);

    return {
      ok: true,
      provider: 'cloudinary',
      url: uploaded.secure_url,
    };
  } catch (firstError) {
    if (!imageInput.startsWith('data:image/')) {
      try {
        const dataUrl = await fetchImageAsDataUrl(imageInput);
        const uploaded = await cloudinary.uploader.upload(dataUrl, uploadOptions);
        return {
          ok: true,
          provider: 'cloudinary',
          url: uploaded.secure_url,
        };
      } catch (secondError) {
        return {
          ok: false,
          error: combineUploadErrors(
            toErrorMessage(firstError, 'Direct URL upload failed'),
            toErrorMessage(secondError, 'Data URL upload failed'),
          ),
        };
      }
    }

    return {
      ok: false,
      error: toErrorMessage(firstError, 'Unknown direct upload error'),
    };
  }
};

const combineUploadErrors = (firstError?: string, secondError?: string): string => {
  const errors = [firstError, secondError].filter((value): value is string => !!value);
  if (errors.length === 0) {
    return 'Unknown upload error';
  }

  return errors.join(' | ');
};

const probeMediaService = async (mediaServiceUrl: string): Promise<boolean> => {
  try {
    const endpoint = new URL('/api/v1/media/upload', mediaServiceUrl);
    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(2_000),
    });

    // 400 is expected for empty payload but means service is reachable.
    return response.status < 500;
  } catch {
    return false;
  }
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, {
      headers: WIKIPEDIA_FETCH_HEADERS,
    });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const searchWikipediaTitle = async (
  host: (typeof WIKIPEDIA_HOSTS)[number],
  query: string,
): Promise<string | null> => {
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('utf8', '1');
  url.searchParams.set('srlimit', '1');
  url.searchParams.set('srsearch', query);

  const response = await fetchJson<WikipediaSearchResponse>(url.toString());
  const title = response?.query?.search?.[0]?.title?.trim();
  return title || null;
};

const fetchWikipediaImageByTitle = async (
  host: (typeof WIKIPEDIA_HOSTS)[number],
  title: string,
): Promise<string | null> => {
  const summaryUrl = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summary = await fetchJson<WikipediaSummaryResponse>(summaryUrl);
  const imageUrl = summary?.thumbnail?.source ?? summary?.originalimage?.source;

  return isHttpUrl(imageUrl) ? imageUrl : null;
};

const resolveDishImageUrl = async (
  dishName: string,
  nameSlug: string,
  autoFetchDishImages: boolean,
): Promise<SeedImageResult> => {
  const fallbackUrl = buildFallbackImageUrl(nameSlug);

  if (!autoFetchDishImages) {
    return { url: fallbackUrl, source: 'fallback' };
  }

  if (wikipediaImageCache.has(dishName)) {
    const cached = wikipediaImageCache.get(dishName);
    if (cached) {
      return { url: cached, source: 'wikipedia' };
    }

    return { url: fallbackUrl, source: 'fallback' };
  }

  const queries = buildWikipediaSearchQueries(dishName);

  for (const host of WIKIPEDIA_HOSTS) {
    for (const query of queries) {
      const title = await searchWikipediaTitle(host, query);
      if (!title) {
        continue;
      }

      const imageUrl = await fetchWikipediaImageByTitle(host, title);
      if (imageUrl) {
        wikipediaImageCache.set(dishName, imageUrl);
        return { url: imageUrl, source: 'wikipedia' };
      }
    }
  }

  wikipediaImageCache.set(dishName, null);
  return { url: fallbackUrl, source: 'fallback' };
};

const uploadDishImageToMediaService = async (
  mediaServiceUrl: string,
  imageInput: string,
  assetName: string,
): Promise<MediaUploadResult | null> => {
  const endpoint = new URL('/api/v1/media/upload', mediaServiceUrl);
  const body = imageInput.startsWith('data:image/')
    ? { imageBase64: imageInput, assetName }
    : { imageUrl: imageInput, assetName };

  const maxAttempts = Number(process.env['CLOUDINARY_UPLOAD_RETRY_COUNT'] ?? 4);

  let lastError = 'Unknown upload error';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string };
          if (errorPayload?.message) {
            message = errorPayload.message;
          }
        } catch {
          // no-op
        }

        lastError = message;
      } else {
        const payload = (await response.json()) as {
          data?: { url?: string; provider?: string };
        };
        const uploadedUrl = payload?.data?.url?.trim();
        const provider = payload?.data?.provider?.trim().toLowerCase();

        if (!isHttpUrl(uploadedUrl) || !provider) {
          lastError = 'Invalid upload response payload';
        } else {
          return {
            ok: true,
            url: uploadedUrl,
            provider,
          };
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown upload error';
    }

    if (!isRetriableUploadError(lastError) || attempt === maxAttempts) {
      break;
    }

    const backoffMs = attempt * 1000;
    await sleep(backoffMs);
  }

  return { ok: false, error: lastError };
};

const foods: SeedFoodInput[] = [...baseFoods, ...extraFoods];

async function runSeed() {
  const mongoUri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/lac_lac';
  const autoFetchDishImages = process.env['AUTO_FETCH_DISH_IMAGES'] !== 'false';
  const autoUploadDishImages = process.env['AUTO_UPLOAD_DISH_IMAGES'] !== 'false';
  const requireCloudinaryUpload = process.env['REQUIRE_CLOUDINARY_UPLOAD'] !== 'false';
  const mediaServiceUrl = process.env['MEDIA_SERVICE_URL'] ?? 'http://localhost:3005';
  const useMediaServiceUpload = process.env['USE_MEDIA_SERVICE_UPLOAD'] !== 'false';
  const uploadDelayMs = Number(process.env['CLOUDINARY_UPLOAD_DELAY_MS'] ?? 250);

  if (mongoUri.includes('<db>')) {
    throw new Error('MONGODB_URI contains <db>. Replace it with your database name.');
  }

  if (requireCloudinaryUpload && !autoUploadDishImages) {
    throw new Error('REQUIRE_CLOUDINARY_UPLOAD=true needs AUTO_UPLOAD_DISH_IMAGES=true.');
  }

  if (requireCloudinaryUpload && !hasCloudinaryConfig()) {
    throw new Error('REQUIRE_CLOUDINARY_UPLOAD=true needs CLOUDINARY_* values in .env.');
  }

  await mongoose.connect(mongoUri);

  const CategoryModel = mongoose.model(Category.name, CategorySchema);
  const FoodModel = mongoose.model(Food.name, FoodSchema);

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  let wikipediaImageCount = 0;
  let fallbackImageCount = 0;
  let uploadedImageCount = 0;
  let canUseMediaServiceUpload = false;

  if (autoUploadDishImages && useMediaServiceUpload) {
    canUseMediaServiceUpload = await probeMediaService(mediaServiceUrl);

    if (!canUseMediaServiceUpload) {
      // eslint-disable-next-line no-console
      console.warn(
        `Media service is not reachable at ${mediaServiceUrl}. Falling back to direct Cloudinary upload.`,
      );
    }
  }

  for (const item of categorySeeds) {
    const category = await CategoryModel.findOneAndUpdate(
      { name: item.name },
      { ...item, isActive: true },
      { new: true, upsert: true },
    ).exec();

    categoryMap.set(item.name, category._id as mongoose.Types.ObjectId);
  }

  for (const item of foods) {
    const normalizedItem = normalizeLegacyTextFields(item);
    const categoryId = categoryMap.get(normalizedItem.categoryName);
    if (!categoryId) {
      continue;
    }

    const dishName = normalizeDishName(normalizedItem.name);
    const nameSlug = toSlug(dishName);
    const imageResult = await resolveDishImageUrl(dishName, nameSlug, autoFetchDishImages);
    let imageUrl = imageResult.url;

    if (autoUploadDishImages) {
      if (uploadDelayMs > 0) {
        await sleep(uploadDelayMs);
      }

      let uploaded: MediaUploadResult | null = null;

      if (canUseMediaServiceUpload) {
        const viaService = await uploadDishImageToMediaService(
          mediaServiceUrl,
          imageResult.url,
          dishName,
        );

        if (viaService?.ok && viaService.provider === 'cloudinary' && viaService.url) {
          uploaded = viaService;
        } else {
          const serviceError = viaService?.error;
          if ((serviceError ?? '').toLowerCase().includes('fetch failed')) {
            canUseMediaServiceUpload = false;
          }

          const directUpload = await uploadDishImageDirectToCloudinary(imageResult.url, dishName);
          if (directUpload.ok) {
            uploaded = directUpload;
          } else {
            uploaded = {
              ok: false,
              error: combineUploadErrors(serviceError, directUpload.error),
            };
          }
        }
      } else {
        uploaded = await uploadDishImageDirectToCloudinary(imageResult.url, dishName);
      }

      if (uploaded?.ok && uploaded.provider === 'cloudinary' && uploaded.url) {
        imageUrl = uploaded.url;
        uploadedImageCount += 1;
      } else if (requireCloudinaryUpload) {
        throw new Error(
          `Cloudinary upload failed for dish: ${dishName}. Reason: ${uploaded?.error ?? 'Unknown error'}`,
        );
      }
    }

    if (imageResult.source === 'wikipedia') {
      wikipediaImageCount += 1;
    } else {
      fallbackImageCount += 1;
    }

    await FoodModel.findOneAndUpdate(
      { nameSlug },
      {
        name: dishName,
        nameSlug,
        description: normalizedItem.description,
        images: [imageUrl],
        thumbnailImage: imageUrl,
        category: categoryId,
        mealTypes: normalizedItem.mealTypes,
        priceRange: normalizedItem.priceRange,
        priceMin: normalizedItem.priceMin,
        priceMax: normalizedItem.priceMax,
        cookingStyle: normalizedItem.cookingStyle,
        dietTags: normalizedItem.dietTags ?? [],
        allergens: normalizedItem.allergens ?? [],
        calories: normalizedItem.calories,
        nutritionInfo: {
          protein: Math.max(5, Math.floor(normalizedItem.calories * 0.08)),
          carbs: Math.max(10, Math.floor(normalizedItem.calories * 0.1)),
          fat: Math.max(4, Math.floor(normalizedItem.calories * 0.04)),
          fiber: Math.max(2, Math.floor(normalizedItem.calories * 0.01)),
        },
        ingredients: normalizedItem.ingredients,
        tags: normalizedItem.tags,
        origin: normalizedItem.origin,
        contextTags: normalizedItem.contextTags,
        popularityScore: 0,
        averageRating: 0,
        totalReviews: 0,
        isActive: true,
      },
      { upsert: true, new: true },
    ).exec();
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed completed with ${foods.length} foods. images: wikipedia=${wikipediaImageCount}, fallback=${fallbackImageCount}, uploaded=${uploadedImageCount}`,
  );

  await mongoose.connection.close();
}

runSeed().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', error);
  await mongoose.connection.close();
  process.exit(1);
});
