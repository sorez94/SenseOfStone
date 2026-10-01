import type { LocalizedText, PreOrder, ProductImage, ProductOption, ProductSpecification } from "@/domain";
import type { MockDatabase, StoredProduct, StoredUser } from "./types";

/**
 * Demo data for the fake backend. Image files come from /public/images.
 * Demo credentials are listed in README.md.
 */

const t = (en: string, fa: string): LocalizedText => ({ en, fa });
const iso = (daysAgo: number) => new Date(Date.UTC(2026, 8, 30) - daysAgo * 86_400_000).toISOString();

const categories: MockDatabase["categories"] = [
  {
    id: "cat_tables",
    slug: "tables",
    name: t("Tables", "میز"),
    description: t("Dining, coffee and side tables in natural stone and solid wood.", "میزهای ناهارخوری، جلومبلی و عسلی از سنگ طبیعی و چوب ماسیو."),
    imageUrl: "/images/category-carousel/cat-02.png",
    sortOrder: 1,
    createdAt: iso(200),
    updatedAt: iso(200),
  },
  {
    id: "cat_accessories",
    slug: "accessories",
    name: t("Accessories", "اکسسوری"),
    description: t("Trays, bookends and decorative objects.", "سینی، نگهدارنده کتاب و اشیای تزئینی."),
    imageUrl: "/images/category-carousel/cat-03.png",
    sortOrder: 2,
    createdAt: iso(200),
    updatedAt: iso(200),
  },
  {
    id: "cat_pots",
    slug: "pots",
    name: t("Pots & Vases", "گلدان"),
    description: t("Hand-carved planters and vases.", "گلدان‌های حکاکی‌شده با دست."),
    imageUrl: "/images/category-carousel/cat-04.png",
    sortOrder: 3,
    createdAt: iso(200),
    updatedAt: iso(200),
  },
  {
    id: "cat_plates",
    slug: "plates",
    name: t("Plates & Bowls", "بشقاب و کاسه"),
    description: t("Serving plates and bowls in marble, onyx and walnut.", "بشقاب و کاسه‌های سرو از مرمر، اونیکس و گردو."),
    imageUrl: "/images/category-carousel/cat-01.png",
    sortOrder: 4,
    createdAt: iso(200),
    updatedAt: iso(200),
  },
  {
    id: "cat_mirrors",
    slug: "mirrors",
    name: t("Mirrors", "آینه"),
    description: t("Mirrors framed in stone and wood.", "آینه با قاب سنگی و چوبی."),
    imageUrl: "/images/category-carousel/cat-04.png",
    sortOrder: 5,
    createdAt: iso(200),
    updatedAt: iso(200),
  },
];

function images(folder: string, files: string[], alt: LocalizedText): ProductImage[] {
  return files.map((file, index) => ({
    id: `img_${folder}_${file.replace(".", "_")}`,
    url: `/images/products/${folder}/${file}`,
    alt,
    sortOrder: index,
  }));
}

const sizeOption = (id: string, values: Array<[string, string, string, number]>): ProductOption => ({
  id: `opt_${id}_size`,
  name: t("Size", "اندازه"),
  required: true,
  values: values.map(([key, en, fa, priceDelta]) => ({ id: `val_${id}_${key}`, label: t(en, fa), priceDelta })),
});

const finishOption = (id: string): ProductOption => ({
  id: `opt_${id}_finish`,
  name: t("Finish", "پرداخت"),
  required: true,
  values: [
    { id: `val_${id}_polished`, label: t("Polished", "براق"), priceDelta: 0 },
    { id: `val_${id}_honed`, label: t("Honed (matte)", "مات"), priceDelta: 0 },
    { id: `val_${id}_leather`, label: t("Leathered", "چرمی"), priceDelta: 1_500_000 },
  ],
});

const spec = (en: [string, string], fa: [string, string]): ProductSpecification => ({
  label: t(en[0], fa[0]),
  value: t(en[1], fa[1]),
});

type SeedProduct = Pick<StoredProduct, "id" | "slug" | "sku" | "title" | "shortDescription" | "description" | "categoryId" | "materialType" | "material" | "images" | "pricing"> &
  Partial<StoredProduct>;

function product(input: SeedProduct, index: number): StoredProduct {
  return {
    finish: null,
    origin: t("Iran", "ایران"),
    dimensions: { length: null, width: null, height: null, weight: null },
    currency: "IRT",
    options: [],
    specifications: [],
    availability: "made_to_order",
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 10, leadTimeDays: 30 },
    isFeatured: false,
    status: "published",
    tags: [],
    createdAt: iso(120 - index * 5),
    updatedAt: iso(60 - index * 2),
    ...input,
  };
}

const seedProducts: SeedProduct[] = [
  {
    id: "prd_nature_dining",
    slug: "nature-dining-table",
    sku: "SOS-TB-001",
    title: t("Nature Dining Table", "میز ناهارخوری نیچر"),
    shortDescription: t("Green granite top with a leathered finish on solid oak legs.", "صفحه گرانیت سبز با پرداخت چرمی روی پایه‌های بلوط ماسیو."),
    description: t(
      "The Nature table pairs a slab of leathered green granite with hand-finished solid oak legs. Every top is cut from a single slab, so veining is unique to your piece. Sealed against stains and suitable for daily family use.",
      "میز نیچر ترکیبی از یک اسلب گرانیت سبز با پرداخت چرمی و پایه‌های بلوط ماسیو است که با دست پرداخت شده‌اند. هر صفحه از یک اسلب یکپارچه برش می‌خورد و رگه‌های آن منحصربه‌فرد است. سطح در برابر لک محافظت شده و برای استفاده روزانه خانواده مناسب است.",
    ),
    categoryId: "cat_tables",
    materialType: "mixed",
    material: t("Green granite & oak", "گرانیت سبز و بلوط"),
    finish: t("Leathered", "چرمی"),
    dimensions: { length: 220, width: 100, height: 76, weight: 180 },
    images: images("tables", ["02.jpg", "01.jpg", "06.jpg"], t("Nature dining table", "میز ناهارخوری نیچر")),
    pricing: { type: "range", min: 185_000_000, max: 240_000_000 },
    options: [
      sizeOption("nature", [
        ["180", "180 × 90 cm", "۱۸۰ × ۹۰ سانتی‌متر", 0],
        ["220", "220 × 100 cm", "۲۲۰ × ۱۰۰ سانتی‌متر", 25_000_000],
        ["260", "260 × 110 cm", "۲۶۰ × ۱۱۰ سانتی‌متر", 55_000_000],
      ]),
    ],
    specifications: [
      spec(["Top thickness", "3 cm"], ["ضخامت صفحه", "۳ سانتی‌متر"]),
      spec(["Seats", "6–10"], ["ظرفیت", "۶ تا ۱۰ نفر"]),
      spec(["Care", "Reseal yearly"], ["نگهداری", "سالی یک‌بار سیل شود"]),
    ],
    isFeatured: true,
    tags: ["granite", "oak", "dining"],
  },
  {
    id: "prd_luna_coffee",
    slug: "luna-coffee-table",
    sku: "SOS-TB-002",
    title: t("Luna Coffee Table", "میز جلومبلی لونا"),
    shortDescription: t("Round white marble coffee table with a sculpted pedestal.", "میز جلومبلی گرد از مرمر سفید با پایه حجاری‌شده."),
    description: t(
      "Luna is carved from Iranian white marble with soft grey veins. The sculpted pedestal is turned from the same block for a monolithic look.",
      "لونا از مرمر سفید ایرانی با رگه‌های خاکستری ملایم تراشیده شده است. پایه حجاری‌شده از همان بلوک ساخته می‌شود تا ظاهری یکپارچه داشته باشد.",
    ),
    categoryId: "cat_tables",
    materialType: "stone",
    material: t("White marble", "مرمر سفید"),
    finish: t("Polished", "براق"),
    dimensions: { length: 90, width: 90, height: 38, weight: 95 },
    images: images("tables", ["03.jpg", "07.jpg"], t("Luna coffee table", "میز جلومبلی لونا")),
    pricing: { type: "fixed", amount: 78_000_000 },
    options: [finishOption("luna")],
    specifications: [spec(["Shape", "Round"], ["شکل", "گرد"])],
    availability: "in_stock",
    isFeatured: true,
    tags: ["marble", "coffee table"],
  },
  {
    id: "prd_walnut_side",
    slug: "walnut-side-table",
    sku: "SOS-TB-003",
    title: t("Walnut Side Table", "میز عسلی گردو"),
    shortDescription: t("Solid walnut side table with an inlaid travertine top.", "میز عسلی از گردوی ماسیو با صفحه تراورتن."),
    description: t(
      "A compact side table in solid Persian walnut, finished with natural oil and topped with an inlaid honed travertine disc.",
      "میز عسلی جمع‌وجور از چوب گردوی ایرانی ماسیو که با روغن طبیعی پرداخت شده و صفحه‌ای از تراورتن مات روی آن نشسته است.",
    ),
    categoryId: "cat_tables",
    materialType: "mixed",
    material: t("Walnut & travertine", "گردو و تراورتن"),
    finish: t("Natural oil", "روغن طبیعی"),
    dimensions: { length: 45, width: 45, height: 55, weight: 14 },
    images: images("tables", ["04.jpg", "05.jpg"], t("Walnut side table", "میز عسلی گردو")),
    pricing: { type: "fixed", amount: 24_500_000 },
    availability: "in_stock",
    tags: ["walnut", "travertine"],
  },
  {
    id: "prd_oak_console",
    slug: "oak-console-table",
    sku: "SOS-TB-004",
    title: t("Oak Console Table", "کنسول بلوط"),
    shortDescription: t("Minimal solid oak console with hidden joinery.", "کنسول مینیمال از بلوط ماسیو با اتصالات پنهان."),
    description: t(
      "Built entirely from solid oak using traditional mortise-and-tenon joinery. Available in natural or smoked oak.",
      "این کنسول تماماً از بلوط ماسیو و با اتصالات سنتی فاق و زبانه ساخته شده است. در دو رنگ طبیعی و دودی موجود است.",
    ),
    categoryId: "cat_tables",
    materialType: "wood",
    material: t("Solid oak", "بلوط ماسیو"),
    dimensions: { length: 140, width: 35, height: 80, weight: 28 },
    images: images("tables", ["08.jpg", "09.jpg"], t("Oak console table", "کنسول بلوط")),
    pricing: { type: "range", min: 32_000_000, max: 38_000_000 },
    options: [
      {
        id: "opt_console_tone",
        name: t("Wood tone", "رنگ چوب"),
        required: true,
        values: [
          { id: "val_console_natural", label: t("Natural oak", "بلوط طبیعی"), priceDelta: 0 },
          { id: "val_console_smoked", label: t("Smoked oak", "بلوط دودی"), priceDelta: 4_000_000 },
        ],
      },
    ],
    tags: ["oak", "console"],
  },
  {
    id: "prd_black_angel_tray",
    slug: "black-angel-tray",
    sku: "SOS-AC-001",
    title: t("Black Angel Tray", "سینی بلک انجل"),
    shortDescription: t("Leathered black granite serving tray.", "سینی سرو از گرانیت مشکی با پرداخت چرمی."),
    description: t(
      "Hard-wearing black granite with a tactile leathered finish. Felt pads protect your furniture.",
      "گرانیت مشکی مقاوم با پرداخت چرمی لمسی. پدهای نمدی از سطح مبلمان شما محافظت می‌کنند.",
    ),
    categoryId: "cat_accessories",
    materialType: "stone",
    material: t("Black granite", "گرانیت مشکی"),
    finish: t("Leathered", "چرمی"),
    dimensions: { length: 40, width: 25, height: 3, weight: 4 },
    images: images("accessories", ["01.jpg", "02.jpg"], t("Black Angel tray", "سینی بلک انجل")),
    pricing: { type: "fixed", amount: 6_800_000 },
    availability: "in_stock",
    isFeatured: true,
    tags: ["granite", "tray"],
  },
  {
    id: "prd_onyx_bookends",
    slug: "onyx-bookends",
    sku: "SOS-AC-002",
    title: t("Onyx Bookends", "نگهدارنده کتاب اونیکس"),
    shortDescription: t("A pair of translucent green onyx bookends.", "یک جفت نگهدارنده کتاب از اونیکس سبز نیمه‌شفاف."),
    description: t("Cut from green Iranian onyx; each pair is unique.", "از اونیکس سبز ایرانی برش خورده؛ هر جفت منحصربه‌فرد است."),
    categoryId: "cat_accessories",
    materialType: "stone",
    material: t("Green onyx", "اونیکس سبز"),
    dimensions: { length: 15, width: 10, height: 18, weight: 5 },
    images: images("accessories", ["03.jpg", "04.jpg"], t("Onyx bookends", "نگهدارنده کتاب اونیکس")),
    pricing: { type: "fixed", amount: 9_200_000 },
    tags: ["onyx"],
  },
  {
    id: "prd_walnut_board",
    slug: "walnut-serving-board",
    sku: "SOS-AC-003",
    title: t("Walnut Serving Board", "تخته سرو گردو"),
    shortDescription: t("End-grain walnut board with a marble insert.", "تخته سرو گردو با اینسرت مرمر."),
    description: t("Food-safe oiled walnut with a removable white marble cheese insert.", "گردوی روغن‌خورده ایمن برای غذا با اینسرت جداشدنی مرمر سفید."),
    categoryId: "cat_accessories",
    materialType: "mixed",
    material: t("Walnut & marble", "گردو و مرمر"),
    dimensions: { length: 50, width: 25, height: 3, weight: 3 },
    images: images("accessories", ["05.jpg"], t("Walnut serving board", "تخته سرو گردو")),
    pricing: { type: "fixed", amount: 4_300_000 },
    availability: "out_of_stock",
    tags: ["walnut", "kitchen"],
  },
  {
    id: "prd_pyramid_vase",
    slug: "pyramid-vase",
    sku: "SOS-PT-001",
    title: t("Pyramid Vase", "گلدان پیرامید"),
    shortDescription: t("Rose marble vase with faceted geometry.", "گلدان مرمر صورتی با فرم هندسی."),
    description: t("Faceted rose marble vase, hand-polished inside and out. Watertight.", "گلدان مرمر صورتی با سطوح هندسی که داخل و بیرون آن با دست صیقل خورده است. کاملاً آب‌بند است."),
    categoryId: "cat_pots",
    materialType: "stone",
    material: t("Rose marble", "مرمر صورتی"),
    dimensions: { length: 20, width: 20, height: 35, weight: 9 },
    images: images("pots", ["01.jpg", "02.jpg"], t("Pyramid vase", "گلدان پیرامید")),
    pricing: { type: "fixed", amount: 12_500_000 },
    options: [
      sizeOption("pyramid", [
        ["s", "Small (25 cm)", "کوچک (۲۵ سانتی‌متر)", -3_000_000],
        ["m", "Medium (35 cm)", "متوسط (۳۵ سانتی‌متر)", 0],
        ["l", "Large (50 cm)", "بزرگ (۵۰ سانتی‌متر)", 6_000_000],
      ]),
    ],
    isFeatured: true,
    tags: ["marble", "vase"],
  },
  {
    id: "prd_travertine_planter",
    slug: "travertine-planter",
    sku: "SOS-PT-002",
    title: t("Travertine Planter", "گلدان تراورتن"),
    shortDescription: t("Large indoor/outdoor planter in honed travertine.", "گلدان بزرگ داخلی و بیرونی از تراورتن مات."),
    description: t("Frost-resistant travertine planter with a drainage hole.", "گلدان تراورتن مقاوم در برابر یخ‌زدگی با سوراخ زهکشی."),
    categoryId: "cat_pots",
    materialType: "stone",
    material: t("Travertine", "تراورتن"),
    dimensions: { length: 45, width: 45, height: 50, weight: 40 },
    images: images("pots", ["03.jpg", "04.jpg"], t("Travertine planter", "گلدان تراورتن")),
    pricing: { type: "on_request" },
    tags: ["travertine", "outdoor"],
  },
  {
    id: "prd_teak_planter",
    slug: "teak-planter-box",
    sku: "SOS-PT-003",
    title: t("Teak Planter Box", "جعبه گلدان ساج"),
    shortDescription: t("Weather-proof teak planter box.", "جعبه گلدان ساج مقاوم در برابر هوا."),
    description: t("Solid teak slats with stainless fixings; ages to a silver patina outdoors.", "تخته‌های ساج ماسیو با اتصالات استیل؛ در فضای باز به رنگ نقره‌ای طبیعی درمی‌آید."),
    categoryId: "cat_pots",
    materialType: "wood",
    material: t("Teak", "ساج"),
    dimensions: { length: 80, width: 30, height: 35, weight: 12 },
    images: images("pots", ["05.jpg", "06.jpg"], t("Teak planter box", "جعبه گلدان ساج")),
    pricing: { type: "fixed", amount: 15_800_000 },
    status: "draft",
    tags: ["teak", "outdoor"],
  },
  {
    id: "prd_onyx_bowl",
    slug: "green-onyx-bowl",
    sku: "SOS-PL-001",
    title: t("Green Onyx Bowl", "کاسه اونیکس سبز"),
    shortDescription: t("Hand-turned green onyx bowl with banded layers.", "کاسه اونیکس سبز خراطی‌شده با لایه‌های نواری."),
    description: t("Turned from a single block of banded green onyx. Glows when back-lit.", "از یک بلوک اونیکس سبز نواری خراطی شده و در نور پشت می‌درخشد."),
    categoryId: "cat_plates",
    materialType: "stone",
    material: t("Green onyx", "اونیکس سبز"),
    dimensions: { length: 30, width: 30, height: 12, weight: 6 },
    images: images("plates", ["01.jpg", "02.jpg"], t("Green onyx bowl", "کاسه اونیکس سبز")),
    pricing: { type: "fixed", amount: 11_000_000 },
    availability: "in_stock",
    isFeatured: true,
    tags: ["onyx", "bowl"],
  },
  {
    id: "prd_marble_plates",
    slug: "marble-plate-set",
    sku: "SOS-PL-002",
    title: t("Marble Plate Set", "ست بشقاب مرمر"),
    shortDescription: t("Set of four white marble dinner plates.", "ست چهار عددی بشقاب مرمر سفید."),
    description: t("Food-safe sealed white marble plates.", "بشقاب‌های مرمر سفید سیل‌شده و ایمن برای غذا."),
    categoryId: "cat_plates",
    materialType: "stone",
    material: t("White marble", "مرمر سفید"),
    dimensions: { length: 27, width: 27, height: 2, weight: 6 },
    images: images("plates", ["03.jpg", "04.jpg"], t("Marble plate set", "ست بشقاب مرمر")),
    pricing: { type: "fixed", amount: 8_900_000 },
    tags: ["marble", "tableware"],
  },
  {
    id: "prd_olive_bowl",
    slug: "olive-wood-bowl",
    sku: "SOS-PL-003",
    title: t("Olive Wood Bowl", "کاسه چوب زیتون"),
    shortDescription: t("Hand-carved olive wood salad bowl.", "کاسه سالاد چوب زیتون حکاکی‌شده با دست."),
    description: t("Carved from a single piece of olive wood with a food-safe finish.", "از یک تکه چوب زیتون با پرداخت ایمن برای غذا حکاکی شده است."),
    categoryId: "cat_plates",
    materialType: "wood",
    material: t("Olive wood", "چوب زیتون"),
    dimensions: { length: 32, width: 32, height: 10, weight: 2 },
    images: images("plates", ["05.jpg"], t("Olive wood bowl", "کاسه چوب زیتون")),
    pricing: { type: "fixed", amount: 3_900_000 },
    availability: "in_stock",
    tags: ["olive", "kitchen"],
  },
  {
    id: "prd_arch_mirror",
    slug: "travertine-arch-mirror",
    sku: "SOS-MR-001",
    title: t("Travertine Arch Mirror", "آینه قوسی تراورتن"),
    shortDescription: t("Arched mirror framed in honed travertine.", "آینه قوسی با قاب تراورتن مات."),
    description: t("A statement arched mirror with a 6 cm travertine frame. Wall fixings included.", "آینه قوسی شاخص با قاب ۶ سانتی‌متری تراورتن. وسایل نصب همراه است."),
    categoryId: "cat_mirrors",
    materialType: "stone",
    material: t("Travertine", "تراورتن"),
    dimensions: { length: 70, width: 4, height: 120, weight: 35 },
    images: images("mirrors", ["01.jpg", "02.jpg", "03.jpg"], t("Travertine arch mirror", "آینه قوسی تراورتن")),
    pricing: { type: "range", min: 42_000_000, max: 58_000_000 },
    options: [
      sizeOption("arch", [
        ["m", "70 × 120 cm", "۷۰ × ۱۲۰ سانتی‌متر", 0],
        ["l", "90 × 160 cm", "۹۰ × ۱۶۰ سانتی‌متر", 12_000_000],
      ]),
    ],
    isFeatured: true,
    tags: ["travertine", "mirror"],
  },
  {
    id: "prd_walnut_mirror",
    slug: "walnut-round-mirror",
    sku: "SOS-MR-002",
    title: t("Walnut Round Mirror", "آینه گرد گردو"),
    shortDescription: t("Round mirror with a solid walnut frame.", "آینه گرد با قاب گردوی ماسیو."),
    description: t("Steam-bent solid walnut frame with a bevelled mirror.", "قاب گردوی ماسیو خم‌شده با بخار و آینه فارسی‌بُر."),
    categoryId: "cat_mirrors",
    materialType: "wood",
    material: t("Walnut", "گردو"),
    dimensions: { length: 80, width: 3, height: 80, weight: 9 },
    images: images("mirrors", ["04.jpg", "05.jpg"], t("Walnut round mirror", "آینه گرد گردو")),
    pricing: { type: "fixed", amount: 19_500_000 },
    tags: ["walnut", "mirror"],
  },
  {
    id: "prd_marble_mirror",
    slug: "calacatta-mirror",
    sku: "SOS-MR-003",
    title: t("Calacatta Mirror", "آینه کالاکاتا"),
    shortDescription: t("Rectangular mirror with a Calacatta-style marble frame.", "آینه مستطیلی با قاب مرمر طرح کالاکاتا."),
    description: t("Discontinued design, shown for reference.", "این طرح تولید نمی‌شود و فقط برای نمایش است."),
    categoryId: "cat_mirrors",
    materialType: "stone",
    material: t("Marble", "مرمر"),
    dimensions: { length: 60, width: 4, height: 100, weight: 30 },
    images: images("mirrors", ["06.jpg", "07.jpg"], t("Calacatta mirror", "آینه کالاکاتا")),
    pricing: { type: "fixed", amount: 36_000_000 },
    availability: "discontinued",
    preOrder: { enabled: false, minQuantity: 1, maxQuantity: 1, leadTimeDays: null },
    tags: ["marble", "mirror"],
  },
];

const products: StoredProduct[] = seedProducts.map(product);

const users: StoredUser[] = [
  {
    id: "usr_admin",
    email: "admin@senseofstone.com",
    password: "admin1234",
    role: "admin",
    authProvider: "password",
    avatarUrl: null,
    profile: { firstName: "Sara", lastName: "Admin", phone: "09120000000", address: { city: "Tehran", line: "No 73, Modern Center, Eastern Yaft Abad" } },
    isProfileComplete: true,
    createdAt: iso(300),
    updatedAt: iso(300),
  },
  {
    id: "usr_customer",
    email: "customer@example.com",
    password: "customer1234",
    role: "customer",
    authProvider: "password",
    avatarUrl: null,
    profile: { firstName: "Ali", lastName: "Rezaei", phone: "09121234567", address: { city: "Tehran", line: "Valiasr St., No. 12", postalCode: "1234567890" } },
    isProfileComplete: true,
    createdAt: iso(90),
    updatedAt: iso(90),
  },
];

function seedPreOrder(
  n: number,
  status: PreOrder["status"],
  productIndex: number,
  quantity: number,
  daysAgo: number,
  history: PreOrder["history"],
): PreOrder {
  const p = products[productIndex]!;
  const customer = users[1]!;
  const unitPrice = p.pricing;
  const total =
    unitPrice.type === "fixed"
      ? { min: unitPrice.amount * quantity, max: unitPrice.amount * quantity }
      : unitPrice.type === "range"
        ? { min: unitPrice.min * quantity, max: unitPrice.max * quantity }
        : null;
  return {
    id: `po_seed_${n}`,
    reference: `PO-2026-${String(n).padStart(5, "0")}`,
    status,
    customer: {
      userId: customer.id,
      email: customer.email,
      firstName: customer.profile!.firstName!,
      lastName: customer.profile!.lastName!,
      phone: customer.profile!.phone!,
      address: customer.profile!.address!,
    },
    items: [
      {
        id: `poi_seed_${n}`,
        productId: p.id,
        productSlug: p.slug,
        productTitle: p.title,
        productImageUrl: p.images[0]?.url ?? null,
        quantity,
        selectedOptions: [],
        unitPrice,
      },
    ],
    estimatedTotal: total,
    currency: "IRT",
    customerNote: null,
    adminNote: null,
    history,
    createdAt: iso(daysAgo),
    updatedAt: history.at(-1)?.changedAt ?? iso(daysAgo),
  };
}

const preOrders: PreOrder[] = [
  seedPreOrder(1, "completed", 1, 1, 40, [
    { status: "pending", changedAt: iso(40), changedBy: "customer", note: null },
    { status: "confirmed", changedAt: iso(38), changedBy: "admin", note: "Production scheduled." },
    { status: "completed", changedAt: iso(10), changedBy: "admin", note: "Delivered." },
  ]),
  seedPreOrder(2, "confirmed", 7, 2, 7, [
    { status: "pending", changedAt: iso(7), changedBy: "customer", note: null },
    { status: "confirmed", changedAt: iso(6), changedBy: "admin", note: null },
  ]),
  seedPreOrder(3, "pending", 13, 1, 1, [{ status: "pending", changedAt: iso(1), changedBy: "customer", note: null }]),
];

export function createSeedDatabase(): MockDatabase {
  // Deep clone so tests and resets never share mutable seed objects.
  return {
    users: structuredClone(users),
    sessions: new Map(),
    categories: structuredClone(categories),
    products: structuredClone(products),
    preOrders: structuredClone(preOrders),
    uploads: new Map(),
    contactMessages: [],
    sequences: { preOrder: preOrders.length },
  };
}
