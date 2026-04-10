import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

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

type ImageSource = 'wikipedia' | 'fallback';

type ImageResult = {
  url: string;
  source: ImageSource;
};

type BackfillFoodDoc = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  nameSlug?: string;
  images?: string[];
  thumbnailImage?: string;
};

const WIKIPEDIA_HOSTS = ['vi.wikipedia.org', 'en.wikipedia.org'] as const;
const WIKIPEDIA_FETCH_HEADERS = {
  'User-Agent': 'LacLacImageBot/1.0 (+https://laclac.vn)',
  'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
};
const BROKEN_IMAGE_URL_PREFIXES = ['https://res.cloudinary.com/demo/image/upload/lac-lac/'];
const wikipediaImageCache = new Map<string, string | null>();

const escapeSvgText = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildFallbackImageUrl = (nameSlug: string): string => {
  const displayName = (nameSlug || 'food-item').replace(/-/g, ' ').trim();
  const safeDisplayName = escapeSvgText(displayName.slice(0, 40));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#ffedd5"/></linearGradient></defs><rect width="1200" height="800" fill="url(#bg)"/><text x="600" y="392" text-anchor="middle" fill="#9a3412" font-family="Arial, sans-serif" font-size="58" font-weight="700">Lac Lac</text><text x="600" y="462" text-anchor="middle" fill="#c2410c" font-family="Arial, sans-serif" font-size="36">${safeDisplayName}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const isHttpUrl = (value: string | null | undefined): value is string => {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
};

const sanitizeImageUrl = (value: string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (BROKEN_IMAGE_URL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return undefined;
  }

  return normalized;
};

const isFallbackDataImage = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return value.startsWith('data:image/svg+xml,');
};

const buildWikipediaSearchQueries = (dishName: string): string[] => {
  return Array.from(
    new Set([dishName, `${dishName} món ăn`, `${dishName} Việt Nam`, `${dishName} food`]),
  );
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

  const result = await fetchJson<WikipediaSearchResponse>(url.toString());
  const title = result?.query?.search?.[0]?.title?.trim();

  return title || null;
};

const fetchWikipediaImageByTitle = async (
  host: (typeof WIKIPEDIA_HOSTS)[number],
  title: string,
): Promise<string | null> => {
  const summaryUrl = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const result = await fetchJson<WikipediaSummaryResponse>(summaryUrl);
  const imageUrl = result?.thumbnail?.source ?? result?.originalimage?.source;

  return isHttpUrl(imageUrl) ? imageUrl : null;
};

const resolveDishImageUrl = async (dishName: string, nameSlug: string): Promise<ImageResult> => {
  const fallbackUrl = buildFallbackImageUrl(nameSlug);

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

async function runBackfill() {
  const mongoUri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/lac_lac';
  const forceRefresh = process.env['FORCE_REFRESH_DISH_IMAGES'] === 'true';
  const onlyMissing = process.env['ONLY_MISSING_DISH_IMAGES'] !== 'false';
  const dryRun = process.env['DRY_RUN'] === 'true';

  await mongoose.connect(mongoUri);

  const FoodModel = mongoose.model(Food.name, FoodSchema);
  const foods = (await FoodModel.find({})
    .select('_id name nameSlug images thumbnailImage')
    .lean()
    .exec()) as BackfillFoodDoc[];

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let wikipediaImageCount = 0;
  let fallbackImageCount = 0;

  for (const food of foods) {
    scanned += 1;

    const dishName = (food.name ?? '').trim();
    if (!dishName) {
      skipped += 1;
      continue;
    }

    const currentImage =
      sanitizeImageUrl(food.thumbnailImage) ??
      (food.images ?? []).map((value) => sanitizeImageUrl(value)).find((value) => !!value);

    const shouldProcess =
      forceRefresh ||
      !onlyMissing ||
      !currentImage ||
      (onlyMissing && isFallbackDataImage(currentImage));

    if (!shouldProcess) {
      skipped += 1;
      continue;
    }

    const nameSlug = (food.nameSlug ?? '').trim() || toSlug(dishName);
    const imageResult = await resolveDishImageUrl(dishName, nameSlug);

    if (!dryRun) {
      await FoodModel.updateOne(
        { _id: food._id },
        {
          $set: {
            nameSlug,
            images: [imageResult.url],
            thumbnailImage: imageResult.url,
          },
        },
      ).exec();
    }

    updated += 1;

    if (imageResult.source === 'wikipedia') {
      wikipediaImageCount += 1;
    } else {
      fallbackImageCount += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Backfill completed. scanned=${scanned}, updated=${updated}, skipped=${skipped}, wikipedia=${wikipediaImageCount}, fallback=${fallbackImageCount}, dryRun=${dryRun}`,
  );

  await mongoose.connection.close();
}

runBackfill().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Backfill failed', error);
  await mongoose.connection.close();
  process.exit(1);
});
