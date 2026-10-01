import { PrismaClient, Prisma, PricingType, MaterialType, Availability, ProductStatus, Role, AuthProvider, PreOrderStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const img = (slug: string, n: number) => `https://picsum.photos/seed/${slug}-${n}/900/700`;

function referencePriceOf(pricingType: PricingType, amount: number | null, min: number | null) {
  if (pricingType === PricingType.FIXED) return amount;
  if (pricingType === PricingType.RANGE) return min;
  return null;
}

type ProductSeed = {
  slug: string;
  sku: string;
  title: { en: string; fa: string };
  shortDescription: { en: string; fa: string };
  description: { en: string; fa: string };
  categorySlug: string;
  materialType: MaterialType;
  material: { en: string; fa: string };
  finish?: { en: string; fa: string } | null;
  dims: { length: number | null; width: number | null; height: number | null; weight: number | null };
  pricing:
    | { type: 'FIXED'; amount: number }
    | { type: 'RANGE'; min: number; max: number }
    | { type: 'ON_REQUEST' };
  availability: Availability;
  isFeatured?: boolean;
  status: ProductStatus;
  tags: string[];
  preOrder: { enabled: boolean; minQuantity: number; maxQuantity: number; leadTimeDays: number | null };
  options?: {
    name: { en: string; fa: string };
    required: boolean;
    values: { label: { en: string; fa: string }; priceDelta: number }[];
  }[];
};

const categories = [
  {
    slug: 'tables',
    name: { en: 'Tables', fa: 'میز' },
    description: { en: 'Dining, coffee and console tables.', fa: 'میزهای ناهارخوری، جلومبلی و کنسول.' },
    imageUrl: 'https://picsum.photos/seed/cat-tables/600/400',
    sortOrder: 1,
  },
  {
    slug: 'accessories',
    name: { en: 'Accessories', fa: 'لوازم جانبی' },
    description: { en: 'Small stone and wood decor pieces.', fa: 'اقلام کوچک دکوری سنگی و چوبی.' },
    imageUrl: 'https://picsum.photos/seed/cat-accessories/600/400',
    sortOrder: 2,
  },
  {
    slug: 'pots',
    name: { en: 'Pots', fa: 'گلدان' },
    description: { en: 'Planters and garden pots.', fa: 'گلدان و ظروف باغچه.' },
    imageUrl: 'https://picsum.photos/seed/cat-pots/600/400',
    sortOrder: 3,
  },
  {
    slug: 'plates',
    name: { en: 'Plates', fa: 'بشقاب' },
    description: { en: 'Serving plates and boards.', fa: 'بشقاب و تخته‌های سرو.' },
    imageUrl: 'https://picsum.photos/seed/cat-plates/600/400',
    sortOrder: 4,
  },
  {
    slug: 'mirrors',
    name: { en: 'Mirrors', fa: 'آینه' },
    description: { en: 'Framed and frameless mirrors.', fa: 'آینه‌های قاب‌دار و بدون قاب.' },
    imageUrl: 'https://picsum.photos/seed/cat-mirrors/600/400',
    sortOrder: 5,
  },
];

const products: ProductSeed[] = [
  {
    slug: 'luna-coffee-table',
    sku: 'SOS-TB-002',
    title: { en: 'Luna Coffee Table', fa: 'میز جلومبلی لونا' },
    shortDescription: { en: 'Round white marble coffee table.', fa: 'میز جلومبلی گرد از مرمر سفید.' },
    description: { en: 'Luna is carved from a single block of white marble with a softly rounded silhouette.', fa: 'لونا از یک بلوک یکپارچه مرمر سفید با طرحی گرد و ملایم تراش خورده است.' },
    categorySlug: 'tables',
    materialType: MaterialType.STONE,
    material: { en: 'White marble', fa: 'مرمر سفید' },
    finish: { en: 'Polished', fa: 'براق' },
    dims: { length: 90, width: 90, height: 38, weight: 95 },
    pricing: { type: 'FIXED', amount: 78_000_000 },
    availability: Availability.IN_STOCK,
    isFeatured: true,
    status: ProductStatus.PUBLISHED,
    tags: ['marble', 'coffee-table', 'round'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 10, leadTimeDays: 30 },
    options: [
      {
        name: { en: 'Finish', fa: 'پرداخت' },
        required: true,
        values: [
          { label: { en: 'Polished', fa: 'براق' }, priceDelta: 0 },
          { label: { en: 'Honed', fa: 'مات' }, priceDelta: 2_500_000 },
        ],
      },
    ],
  },
  {
    slug: 'nature-dining-table',
    sku: 'SOS-TB-010',
    title: { en: 'Nature Dining Table', fa: 'میز ناهارخوری نیچر' },
    shortDescription: { en: 'Solid walnut dining table with a live edge.', fa: 'میز ناهارخوری چوب گردوی جامد با حاشیه طبیعی.' },
    description: { en: 'A statement dining table hand-finished from solid walnut, available in two sizes.', fa: 'میزی خاص و دست‌ساز از چوب گردوی جامد که در دو اندازه ارائه می‌شود.' },
    categorySlug: 'tables',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid walnut', fa: 'گردوی جامد' },
    finish: { en: 'Oiled', fa: 'روغن‌خورده' },
    dims: { length: 220, width: 100, height: 75, weight: 120 },
    pricing: { type: 'RANGE', min: 185_000_000, max: 240_000_000 },
    availability: Availability.MADE_TO_ORDER,
    isFeatured: true,
    status: ProductStatus.PUBLISHED,
    tags: ['walnut', 'dining-table', 'live-edge'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 5, leadTimeDays: 45 },
    options: [
      {
        name: { en: 'Size', fa: 'اندازه' },
        required: true,
        values: [
          { label: { en: '180 × 90 cm', fa: '۱۸۰ × ۹۰ سانتی‌متر' }, priceDelta: 0 },
          { label: { en: '220 × 100 cm', fa: '۲۲۰ × ۱۰۰ سانتی‌متر' }, priceDelta: 25_000_000 },
        ],
      },
    ],
  },
  {
    slug: 'atlas-console-table',
    sku: 'SOS-TB-014',
    title: { en: 'Atlas Console Table', fa: 'میز کنسول اطلس' },
    shortDescription: { en: 'Slim travertine console table.', fa: 'میز کنسول باریک از تراورتن.' },
    description: { en: 'A slender console table in honed travertine, ideal for entryways.', fa: 'یک میز کنسول باریک از تراورتن مات، مناسب ورودی خانه.' },
    categorySlug: 'tables',
    materialType: MaterialType.STONE,
    material: { en: 'Travertine', fa: 'تراورتن' },
    finish: { en: 'Honed', fa: 'مات' },
    dims: { length: 120, width: 35, height: 80, weight: 60 },
    pricing: { type: 'FIXED', amount: 54_000_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['travertine', 'console-table'],
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
  },
  {
    slug: 'birch-side-table',
    sku: 'SOS-TB-018',
    title: { en: 'Birch Side Table', fa: 'میز عسلی بیرچ' },
    shortDescription: { en: 'Compact birch side table.', fa: 'میز عسلی کوچک از چوب غان.' },
    description: { en: 'A compact side table in solid birch with gently tapered legs.', fa: 'میز عسلی کوچکی از چوب غان جامد با پاهای باریک‌شونده.' },
    categorySlug: 'tables',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid birch', fa: 'غان جامد' },
    finish: { en: 'Matte lacquer', fa: 'لاک مات' },
    dims: { length: 45, width: 45, height: 50, weight: 12 },
    pricing: { type: 'FIXED', amount: 21_000_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['birch', 'side-table'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 20, leadTimeDays: 14 },
  },
  {
    slug: 'onyx-accent-table',
    sku: 'SOS-TB-021',
    title: { en: 'Onyx Accent Table', fa: 'میز تزیینی اونیکس' },
    shortDescription: { en: 'Backlit onyx and oak accent table.', fa: 'میز تزیینی اونیکس و چوب بلوط با نورپردازی.' },
    description: { en: 'Combines a backlit onyx top with a solid oak base; pricing on request given the custom lighting work.', fa: 'ترکیبی از رویه اونیکس نورپرداز و پایه بلوط جامد؛ به دلیل کار سفارشی نورپردازی، قیمت‌گذاری بر اساس درخواست است.' },
    categorySlug: 'tables',
    materialType: MaterialType.MIXED,
    material: { en: 'Onyx & oak', fa: 'اونیکس و بلوط' },
    finish: null,
    dims: { length: 70, width: 70, height: 45, weight: 55 },
    pricing: { type: 'ON_REQUEST' },
    availability: Availability.MADE_TO_ORDER,
    status: ProductStatus.PUBLISHED,
    tags: ['onyx', 'oak', 'backlit'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 3, leadTimeDays: 60 },
  },
  {
    slug: 'marble-coaster-set',
    sku: 'SOS-AC-004',
    title: { en: 'Marble Coaster Set', fa: 'ست زیرلیوانی مرمر' },
    shortDescription: { en: 'Set of 4 marble coasters.', fa: 'ست ۴ تایی زیرلیوانی مرمر.' },
    description: { en: 'Four round coasters cut from Carrara marble offcuts.', fa: 'چهار زیرلیوانی گرد بریده‌شده از باقیمانده مرمر کارارا.' },
    categorySlug: 'accessories',
    materialType: MaterialType.STONE,
    material: { en: 'Carrara marble', fa: 'مرمر کارارا' },
    finish: { en: 'Polished', fa: 'براق' },
    dims: { length: 10, width: 10, height: 1, weight: 0.4 },
    pricing: { type: 'FIXED', amount: 3_200_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['marble', 'coasters'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 20, leadTimeDays: 7 },
  },
  {
    slug: 'walnut-serving-board',
    sku: 'SOS-AC-007',
    title: { en: 'Walnut Serving Board', fa: 'تخته سرو گردو' },
    shortDescription: { en: 'Long walnut serving board.', fa: 'تخته سرو بلند از چوب گردو.' },
    description: { en: 'An oversized serving board hand-sanded from a single walnut plank. Currently out of stock.', fa: 'یک تخته سرو بزرگ که از یک تخته گردوی یکپارچه ساخته شده است. در حال حاضر ناموجود.' },
    categorySlug: 'accessories',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid walnut', fa: 'گردوی جامد' },
    finish: { en: 'Food-safe oil', fa: 'روغن مناسب غذا' },
    dims: { length: 60, width: 20, height: 2, weight: 2.5 },
    pricing: { type: 'FIXED', amount: 4_800_000 },
    availability: Availability.OUT_OF_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['walnut', 'serving-board'],
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
  },
  {
    slug: 'travertine-bookends',
    sku: 'SOS-AC-011',
    title: { en: 'Travertine Bookends', fa: 'نگهدارنده کتاب تراورتن' },
    shortDescription: { en: 'Pair of sculptural travertine bookends.', fa: 'جفت نگهدارنده کتاب تراورتن با طرح مجسمه‌ای.' },
    description: { en: 'A sculptural pair of bookends cut from solid travertine blocks.', fa: 'جفت نگهدارنده کتاب با طرح مجسمه‌ای، بریده‌شده از بلوک‌های تراورتن جامد.' },
    categorySlug: 'accessories',
    materialType: MaterialType.STONE,
    material: { en: 'Travertine', fa: 'تراورتن' },
    finish: { en: 'Honed', fa: 'مات' },
    dims: { length: 12, width: 10, height: 18, weight: 3.2 },
    pricing: { type: 'FIXED', amount: 6_500_000 },
    availability: Availability.IN_STOCK,
    isFeatured: true,
    status: ProductStatus.PUBLISHED,
    tags: ['travertine', 'bookends'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 10, leadTimeDays: 10 },
  },
  {
    slug: 'terracotta-planter',
    sku: 'SOS-PT-002',
    title: { en: 'Terracotta Planter', fa: 'گلدان سفالی' },
    shortDescription: { en: 'Hand-thrown terracotta planter.', fa: 'گلدان سفالی دست‌ساز.' },
    description: { en: 'A hand-thrown terracotta planter with a travertine-dust glaze.', fa: 'گلدان سفالی دست‌ساز با لعاب حاوی پودر تراورتن.' },
    categorySlug: 'pots',
    materialType: MaterialType.MIXED,
    material: { en: 'Terracotta & stone dust', fa: 'سفال و پودر سنگ' },
    finish: { en: 'Matte glaze', fa: 'لعاب مات' },
    dims: { length: 30, width: 30, height: 35, weight: 6 },
    pricing: { type: 'FIXED', amount: 5_400_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['terracotta', 'planter'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 15, leadTimeDays: 10 },
  },
  {
    slug: 'teak-planter-box',
    sku: 'SOS-PT-005',
    title: { en: 'Teak Planter Box', fa: 'باکس گلدان چوب تیک' },
    shortDescription: { en: 'Rectangular teak planter box.', fa: 'باکس گلدان مستطیلی از چوب تیک.' },
    description: { en: 'A weather-resistant rectangular planter box in solid teak. Still in draft while we finalise finishing.', fa: 'باکس گلدان مستطیلی مقاوم در برابر شرایط جوی از چوب تیک جامد. هنوز در حال نهایی‌سازی پرداخت است.' },
    categorySlug: 'pots',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid teak', fa: 'تیک جامد' },
    finish: { en: 'Weatherproof oil', fa: 'روغن ضدآب' },
    dims: { length: 80, width: 30, height: 30, weight: 14 },
    pricing: { type: 'FIXED', amount: 7_900_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.DRAFT,
    tags: ['teak', 'planter-box'],
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
  },
  {
    slug: 'granite-garden-pot',
    sku: 'SOS-PT-009',
    title: { en: 'Granite Garden Pot', fa: 'گلدان باغچه گرانیت' },
    shortDescription: { en: 'Carved granite garden pot, two sizes.', fa: 'گلدان باغچه تراش‌خورده از گرانیت، در دو اندازه.' },
    description: { en: 'A heavy, carved granite garden pot available in two sizes.', fa: 'یک گلدان باغچه سنگین و تراش‌خورده از گرانیت که در دو اندازه موجود است.' },
    categorySlug: 'pots',
    materialType: MaterialType.STONE,
    material: { en: 'Granite', fa: 'گرانیت' },
    finish: { en: 'Natural split', fa: 'شکافت طبیعی' },
    dims: { length: 50, width: 50, height: 45, weight: 70 },
    pricing: { type: 'RANGE', min: 8_200_000, max: 11_000_000 },
    availability: Availability.MADE_TO_ORDER,
    status: ProductStatus.PUBLISHED,
    tags: ['granite', 'garden-pot'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 6, leadTimeDays: 21 },
    options: [
      {
        name: { en: 'Size', fa: 'اندازه' },
        required: true,
        values: [
          { label: { en: 'Small', fa: 'کوچک' }, priceDelta: 0 },
          { label: { en: 'Large', fa: 'بزرگ' }, priceDelta: 2_800_000 },
        ],
      },
    ],
  },
  {
    slug: 'ceramic-serving-plate-set',
    sku: 'SOS-PL-003',
    title: { en: 'Ceramic Serving Plate Set', fa: 'ست بشقاب سرو سرامیکی' },
    shortDescription: { en: 'Set of 4 ceramic serving plates.', fa: 'ست ۴ تایی بشقاب سرو سرامیکی.' },
    description: { en: 'A set of four stoneware serving plates with a stone-dust glaze.', fa: 'ست چهار تایی بشقاب سرو سرامیکی با لعاب حاوی پودر سنگ.' },
    categorySlug: 'plates',
    materialType: MaterialType.MIXED,
    material: { en: 'Stoneware & stone dust', fa: 'سرامیک و پودر سنگ' },
    finish: { en: 'Satin glaze', fa: 'لعاب ساتن' },
    dims: { length: 28, width: 28, height: 2, weight: 1.1 },
    pricing: { type: 'FIXED', amount: 2_100_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['ceramic', 'serving-plate'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 20, leadTimeDays: 7 },
  },
  {
    slug: 'slate-cheese-plate',
    sku: 'SOS-PL-006',
    title: { en: 'Slate Cheese Plate', fa: 'بشقاب پنیر سنگ لوح' },
    shortDescription: { en: 'Natural-edge slate cheese plate.', fa: 'بشقاب پنیر با حاشیه طبیعی از سنگ لوح.' },
    description: { en: 'A natural-edge serving plate cut from dark slate, perfect for cheese boards.', fa: 'بشقابی با حاشیه طبیعی، بریده‌شده از سنگ لوح تیره، مناسب برای سرو پنیر.' },
    categorySlug: 'plates',
    materialType: MaterialType.STONE,
    material: { en: 'Slate', fa: 'سنگ لوح' },
    finish: { en: 'Natural split', fa: 'شکافت طبیعی' },
    dims: { length: 35, width: 20, height: 1, weight: 1.6 },
    pricing: { type: 'FIXED', amount: 3_400_000 },
    availability: Availability.IN_STOCK,
    isFeatured: true,
    status: ProductStatus.PUBLISHED,
    tags: ['slate', 'cheese-plate'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 15, leadTimeDays: 7 },
  },
  {
    slug: 'walnut-charger-plate',
    sku: 'SOS-PL-009',
    title: { en: 'Walnut Charger Plate', fa: 'زیربشقابی گردو' },
    shortDescription: { en: 'Round walnut charger plate.', fa: 'زیربشقابی گرد از چوب گردو.' },
    description: { en: 'A round charger plate turned from solid walnut.', fa: 'زیربشقابی گرد تراشیده‌شده از چوب گردوی جامد.' },
    categorySlug: 'plates',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid walnut', fa: 'گردوی جامد' },
    finish: { en: 'Food-safe oil', fa: 'روغن مناسب غذا' },
    dims: { length: 33, width: 33, height: 1.5, weight: 0.8 },
    pricing: { type: 'FIXED', amount: 1_800_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['walnut', 'charger-plate'],
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 30, leadTimeDays: 5 },
  },
  {
    slug: 'calacatta-wall-mirror',
    sku: 'SOS-MR-002',
    title: { en: 'Calacatta Wall Mirror', fa: 'آینه دیواری کالاکاتا' },
    shortDescription: { en: 'Calacatta marble framed wall mirror.', fa: 'آینه دیواری با قاب مرمر کالاکاتا.' },
    description: { en: 'A wall mirror framed in Calacatta marble. This piece has been discontinued and is no longer available for pre-order.', fa: 'آینه دیواری با قابی از مرمر کالاکاتا. این محصول متوقف شده و دیگر برای پیش‌سفارش موجود نیست.' },
    categorySlug: 'mirrors',
    materialType: MaterialType.STONE,
    material: { en: 'Calacatta marble', fa: 'مرمر کالاکاتا' },
    finish: { en: 'Polished', fa: 'براق' },
    dims: { length: 70, width: 5, height: 100, weight: 25 },
    pricing: { type: 'FIXED', amount: 32_000_000 },
    availability: Availability.DISCONTINUED,
    status: ProductStatus.PUBLISHED,
    tags: ['marble', 'mirror'],
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
  },
  {
    slug: 'oak-framed-mirror',
    sku: 'SOS-MR-005',
    title: { en: 'Oak Framed Mirror', fa: 'آینه قاب بلوط' },
    shortDescription: { en: 'Solid oak framed mirror.', fa: 'آینه با قاب بلوط جامد.' },
    description: { en: 'A round mirror framed in solid oak. Archived from the current catalogue.', fa: 'آینه گرد با قابی از بلوط جامد. از کاتالوگ فعلی بایگانی شده است.' },
    categorySlug: 'mirrors',
    materialType: MaterialType.WOOD,
    material: { en: 'Solid oak', fa: 'بلوط جامد' },
    finish: { en: 'Natural oil', fa: 'روغن طبیعی' },
    dims: { length: 60, width: 60, height: 4, weight: 8 },
    pricing: { type: 'FIXED', amount: 15_500_000 },
    availability: Availability.IN_STOCK,
    status: ProductStatus.ARCHIVED,
    tags: ['oak', 'mirror'],
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@senseofstone.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'customer@example.com';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'customer1234';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await argon2.hash(adminPassword),
      role: Role.ADMIN,
      authProvider: AuthProvider.PASSWORD,
      firstName: 'Sara',
      lastName: 'Admin',
      phone: '09120000000',
      addressCity: 'Tehran',
      addressLine: 'No 73, Modern Center, Eastern Yaft Abad',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      passwordHash: await argon2.hash(customerPassword),
      role: Role.CUSTOMER,
      authProvider: AuthProvider.PASSWORD,
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09121234567',
      addressCity: 'Tehran',
      addressLine: 'Valiasr St., No. 12',
      addressPostalCode: '1234567890',
    },
  });

  console.log(`Seeded users: admin=${admin.email}, customer=${customer.email}`);

  const categoryIdBySlug = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
    categoryIdBySlug.set(category.slug, created.id);
  }
  console.log(`Seeded ${categories.length} categories`);

  const productIdBySlug = new Map<string, string>();
  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${product.categorySlug}`);

    const amount = product.pricing.type === 'FIXED' ? product.pricing.amount : null;
    const min = product.pricing.type === 'RANGE' ? product.pricing.min : null;
    const max = product.pricing.type === 'RANGE' ? product.pricing.max : null;

    await prisma.product.deleteMany({ where: { slug: product.slug } });
    const created = await prisma.product.create({
      data: {
        slug: product.slug,
        sku: product.sku,
        title: product.title,
        shortDescription: product.shortDescription,
        description: product.description,
        categoryId,
        materialType: product.materialType,
        material: product.material,
        finish: product.finish ?? Prisma.JsonNull,
        origin: Prisma.JsonNull,
        dimLength: product.dims.length,
        dimWidth: product.dims.width,
        dimHeight: product.dims.height,
        dimWeight: product.dims.weight,
        pricingType: product.pricing.type as PricingType,
        priceAmount: amount,
        priceMin: min,
        priceMax: max,
        referencePrice: referencePriceOf(product.pricing.type as PricingType, amount, min),
        specifications: [],
        availability: product.availability,
        preOrderEnabled: product.preOrder.enabled,
        preOrderMinQuantity: product.preOrder.minQuantity,
        preOrderMaxQuantity: product.preOrder.maxQuantity,
        preOrderLeadTimeDays: product.preOrder.leadTimeDays,
        isFeatured: product.isFeatured ?? false,
        status: product.status,
        tags: product.tags,
        images: {
          create: [0, 1].map((n) => ({
            url: img(product.slug, n),
            alt: product.title,
            sortOrder: n,
          })),
        },
        options: product.options
          ? {
              create: product.options.map((option, optionIndex) => ({
                name: option.name,
                required: option.required,
                sortOrder: optionIndex,
                values: {
                  create: option.values.map((value, valueIndex) => ({
                    label: value.label,
                    priceDelta: value.priceDelta,
                    sortOrder: valueIndex,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: { options: { include: { values: true } } },
    });
    productIdBySlug.set(product.slug, created.id);
  }
  console.log(`Seeded ${products.length} products`);

  // --- Seed pre-orders (use the real sequence so later real pre-orders continue from here) ---
  const existingPreOrders = await prisma.preOrder.count();
  if (existingPreOrders === 0) {
    const year = new Date().getUTCFullYear();
    const customerSnapshot = {
      userId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: { city: customer.addressCity, line: customer.addressLine, postalCode: customer.addressPostalCode },
    };

    const lunaId = productIdBySlug.get('luna-coffee-table')!;
    const dinningId = productIdBySlug.get('nature-dining-table')!;
    const plateId = productIdBySlug.get('slate-cheese-plate')!;

    const seedPreOrders: {
      productId: string;
      productSlug: string;
      productTitle: { en: string; fa: string };
      quantity: number;
      unitAmount: number;
      status: PreOrderStatus;
    }[] = [
      { productId: lunaId, productSlug: 'luna-coffee-table', productTitle: { en: 'Luna Coffee Table', fa: 'میز جلومبلی لونا' }, quantity: 1, unitAmount: 78_000_000, status: PreOrderStatus.PENDING },
      { productId: dinningId, productSlug: 'nature-dining-table', productTitle: { en: 'Nature Dining Table', fa: 'میز ناهارخوری نیچر' }, quantity: 1, unitAmount: 210_000_000, status: PreOrderStatus.CONFIRMED },
      { productId: plateId, productSlug: 'slate-cheese-plate', productTitle: { en: 'Slate Cheese Plate', fa: 'بشقاب پنیر سنگ لوح' }, quantity: 2, unitAmount: 3_400_000, status: PreOrderStatus.COMPLETED },
    ];

    for (const seedOrder of seedPreOrders) {
      const [{ nextval }] = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
        `SELECT nextval('pre_order_reference_seq') as nextval`,
      );
      const reference = `PO-${year}-${String(nextval).padStart(5, '0')}`;
      const total = seedOrder.unitAmount * seedOrder.quantity;

      const history: { status: string; changedAt: string; changedBy: 'customer' | 'admin'; note: string | null }[] = [
        { status: 'pending', changedAt: new Date().toISOString(), changedBy: 'customer', note: null },
      ];
      if (seedOrder.status !== PreOrderStatus.PENDING) {
        history.push({ status: 'confirmed', changedAt: new Date().toISOString(), changedBy: 'admin', note: 'Production scheduled' });
      }
      if (seedOrder.status === PreOrderStatus.COMPLETED) {
        history.push({ status: 'completed', changedAt: new Date().toISOString(), changedBy: 'admin', note: 'Delivered' });
      }

      await prisma.preOrder.create({
        data: {
          reference,
          status: seedOrder.status,
          userId: customer.id,
          customerSnapshot,
          items: [
            {
              id: `poi_${reference}`,
              productId: seedOrder.productId,
              productSlug: seedOrder.productSlug,
              productTitle: seedOrder.productTitle,
              productImageUrl: img(seedOrder.productSlug, 0),
              quantity: seedOrder.quantity,
              selectedOptions: [],
              unitPrice: { type: 'fixed', amount: seedOrder.unitAmount },
            },
          ],
          estimatedTotalMin: total,
          estimatedTotalMax: total,
          customerNote: null,
          adminNote: null,
          history,
        },
      });
    }
    console.log(`Seeded ${seedPreOrders.length} pre-orders`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
