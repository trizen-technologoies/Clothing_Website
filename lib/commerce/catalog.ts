import type { Collection, Product, ProductColor, ProductImage } from "./types";

/*
 * DEMO CATALOGUE
 *
 * Fictional products used when no commerce backend is configured. Nothing
 * here is real inventory. Prices are in minor units (cents). Collections are
 * editorial groupings that reference product slugs — when Shopify is connected
 * the same slugs are matched against product handles.
 */

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST_SIZES = ["28", "30", "32", "34", "36"];

function color(
  id: string,
  name: string,
  hex: string,
  sizes: string[],
  counts: number[],
): ProductColor {
  return {
    id,
    name,
    hex,
    stock: Object.fromEntries(sizes.map((s, i) => [s, counts[i] ?? 0])),
  };
}

/*
 * Photography: free-licence stock photos (Unsplash License / Pexels License),
 * cropped to 4:5 in /public/products. They show similar plain garments, not
 * these fictional products; the graphic tee photo has our emblem composited on.
 * Colours without photos fall back to the illustrated flats.
 */
function photo(file: string, alt: string, credit: NonNullable<ProductImage["credit"]>): ProductImage {
  return { src: `/products/${file}.jpg`, alt, width: 1200, height: 1500, credit };
}

const unsplash = (name: string, id: string) => ({ name, source: "Unsplash" as const, url: `https://unsplash.com/photos/${id}` });
const pexels = (name: string, path: string) => ({ name, source: "Pexels" as const, url: `https://www.pexels.com/photo/${path}/` });

const CREDIT = {
  hoffman: unsplash("Ryan Hoffman", "Cs4GVbMqKGY"),
  salman: unsplash("Md Salman", "iiqg2xbmvk0"),
  setyadi: unsplash("Haryo Setyadi", "acn5ERAeSb4"),
  singh: unsplash("Avtar Singh", "8ACmRoleM24"),
  king: unsplash("alan King", "mAdZ4osNFPg"),
  monstera: pexels("Monstera Production", "stylish-black-man-in-hoodie-6311560"),
  roma: pexels("Angela Roma", "models-and-black-and-white-hoodies-in-studio-7479825"),
  gorbachev: pexels("Vitaly Gorbachev", "man-in-black-coat-leaning-down-towards-camera-19357727"),
  nguyen: pexels("Quang Viet Nguyen", "photo-of-a-person-in-oversize-pants-and-trainers-11716436"),
  timur: pexels("Eyüpcan Timur", "man-posing-in-jumper-20536778"),
};

const VOID = { id: "void", name: "Void", hex: "#0e0f12" };
const BONE = { id: "bone", name: "Bone", hex: "#d6d1c4" };
const GRAPHITE = { id: "graphite", name: "Graphite", hex: "#2b2e34" };

export const demoProducts: Product[] = [
  {
    id: "vt-001",
    slug: "oversized-graphic-tee",
    name: "Oversized Graphic Tee",
    category: "tees",
    price: 4500,
    currency: "USD",
    summary: "Heavy jersey, dropped shoulder, front signal emblem.",
    description:
      "A 260 GSM cotton jersey tee cut wide through the body with a dropped shoulder and a slightly cropped sleeve. The front carries the signal emblem in a raised puff print that catches low light.",
    details: [
      "Oversized fit with dropped shoulder",
      "Raised puff-print emblem on chest",
      "Ribbed crew neck, double-needle hems",
      "Garment-dyed for a soft, lived-in hand",
    ],
    material: "100% cotton jersey, 260 GSM",
    fit: "Oversized. Take your usual size for the intended fit, or size down for a closer cut.",
    care: ["Machine wash cold, inside out", "Do not tumble dry", "Do not iron the print"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, APPAREL_SIZES, [6, 14, 22, 18, 9, 4]),
        images: [photo("oversized-graphic-tee-void-1", "Black tee with the ring-and-V signal emblem on the chest, on a wooden hanger", CREDIT.hoffman)],
      },
      color(BONE.id, BONE.name, BONE.hex, APPAREL_SIZES, [3, 8, 12, 0, 5, 2]),
      color("static", "Static", "#5e636b", APPAREL_SIZES, [0, 4, 7, 6, 3, 0]),
    ],
    sizes: APPAREL_SIZES,
    badge: "NEW",
    garment: "tee",
    graphic: true,
    collections: ["001"],
    featuredRank: 4,
    bestsellerRank: 5,
    releasedAt: "2026-09-12",
    isDemo: true,
  },
  {
    id: "vt-002",
    slug: "essential-heavyweight-hoodie",
    name: "Essential Heavyweight Hoodie",
    category: "hoodies",
    price: 9500,
    currency: "USD",
    summary: "Brushed-back fleece, double-layer hood, no external branding.",
    description:
      "Our heaviest everyday layer. 480 GSM brushed-back cotton fleece, a double-layer hood with flat drawcords and a seamless kangaroo pocket. Unbranded on the outside — the construction does the talking.",
    details: [
      "Relaxed fit with dropped shoulder",
      "Double-layer hood with flat cotton drawcords",
      "Seamless kangaroo pocket",
      "Ribbed cuffs and hem with 3% elastane",
    ],
    material: "100% cotton brushed-back fleece, 480 GSM",
    fit: "Relaxed. Size down for a regular fit.",
    care: ["Machine wash cold", "Dry flat", "Do not bleach"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, APPAREL_SIZES, [8, 16, 25, 21, 12, 6]),
        images: [
          photo("essential-heavyweight-hoodie-void-1", "Plain black pullover hoodie worn with black trousers, against a weathered wall", CREDIT.monstera),
          photo("essential-heavyweight-hoodie-void-2", "Back view of a black hoodie with the hood up, against a terracotta backdrop", CREDIT.roma),
        ],
      },
      color(GRAPHITE.id, GRAPHITE.name, GRAPHITE.hex, APPAREL_SIZES, [2, 9, 14, 11, 7, 3]),
      color("ash", "Ash", "#8d9096", APPAREL_SIZES, [0, 3, 6, 5, 2, 1]),
    ],
    sizes: APPAREL_SIZES,
    badge: "BESTSELLER",
    garment: "hoodie",
    collections: ["essentials"],
    featuredRank: 2,
    bestsellerRank: 1,
    releasedAt: "2026-03-02",
    isDemo: true,
  },
  {
    id: "vt-003",
    slug: "utility-cargo-pants",
    name: "Utility Cargo Pants",
    category: "bottoms",
    price: 11000,
    currency: "USD",
    summary: "Ripstop cargo with articulated knees and drawcord hems.",
    description:
      "A relaxed, straight cargo in durable cotton-nylon ripstop. Bellowed thigh pockets with low-profile snap flaps, articulated knee panels and drawcord hems that let you wear them stacked or cinched.",
    details: [
      "Relaxed straight leg, mid rise",
      "Bellowed cargo pockets with snap flaps",
      "Articulated knee panels",
      "Drawcord ankle hems",
    ],
    material: "65% cotton, 35% nylon ripstop",
    fit: "Relaxed straight. True to waist size.",
    care: ["Machine wash cold", "Hang dry", "Warm iron if needed"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, WAIST_SIZES, [5, 12, 15, 9, 4]),
        images: [photo("utility-cargo-pants-void-1", "Black cargo trousers with side pockets and cuffed hems, studio shot", CREDIT.gorbachev)],
      },
      {
        ...color("olive-night", "Olive Night", "#393d30", WAIST_SIZES, [2, 6, 0, 5, 2]),
        images: [photo("utility-cargo-pants-olive-night-1", "Olive cargo trousers with bellowed thigh pockets, studio shot", CREDIT.nguyen)],
      },
      color("concrete", "Concrete", "#77746c", WAIST_SIZES, [3, 7, 9, 6, 0]),
    ],
    sizes: WAIST_SIZES,
    garment: "cargo",
    collections: ["001"],
    featuredRank: 3,
    bestsellerRank: 3,
    releasedAt: "2026-08-20",
    isDemo: true,
  },
  {
    id: "vt-004",
    slug: "technical-street-jacket",
    name: "Technical Street Jacket",
    category: "outerwear",
    price: 16000,
    currency: "USD",
    summary: "Water-resistant shell, stand collar, reflective signal tape.",
    description:
      "The centrepiece of Collection 001. A water-resistant three-layer shell with a high stand collar, storm-flap zip and reflective signal tape across the back yoke. Boxy through the body and cut to sit at the hip.",
    details: [
      "Boxy fit, hip length",
      "Water-resistant 3-layer shell with DWR finish",
      "Two-way front zip under storm flap",
      "Reflective signal tape across back yoke",
      "Bellowed chest pockets, slanted hand pockets",
    ],
    material: "Shell: 100% recycled polyester. Lining: 100% polyester mesh.",
    fit: "Boxy. Take your usual size; size up to layer over a heavyweight hoodie.",
    care: ["Machine wash cold, gentle cycle", "Do not tumble dry", "Re-proof DWR as needed"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, APPAREL_SIZES, [2, 6, 9, 7, 3, 1]),
        images: [
          photo("technical-street-jacket-void-hanging", "Black jacket hanging from red fire pipes against a white wall", CREDIT.king),
          photo("technical-street-jacket-void-worn", "Black jacket worn open over a white tee with black cargo trousers", CREDIT.gorbachev),
        ],
      },
      color("ultraviolet", "Ultraviolet", "#2a2048", APPAREL_SIZES, [0, 2, 3, 2, 1, 0]),
      color("storm", "Storm", "#3a4047", APPAREL_SIZES, [1, 4, 6, 4, 2, 0]),
    ],
    sizes: APPAREL_SIZES,
    badge: "NEW",
    garment: "jacket",
    collections: ["001"],
    featuredRank: 1,
    bestsellerRank: 6,
    releasedAt: "2026-09-30",
    isDemo: true,
  },
  {
    id: "vt-005",
    slug: "essential-boxy-tee",
    name: "Essential Boxy Tee",
    category: "tees",
    price: 4000,
    currency: "USD",
    summary: "Cropped, boxy, heavyweight. The daily uniform.",
    description:
      "A short, square tee in 240 GSM cotton with a tight rib collar that holds its shape wash after wash. Designed to sit at the waistband of high-rise trousers and cargos.",
    details: [
      "Boxy, cropped body",
      "Tight 1×1 rib collar",
      "Dropped shoulder seam",
      "Pre-shrunk",
    ],
    material: "100% cotton jersey, 240 GSM",
    fit: "Boxy and cropped. Size up for a longer body.",
    care: ["Machine wash cold", "Tumble dry low", "Warm iron"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, APPAREL_SIZES, [10, 20, 30, 24, 14, 6]),
        images: [photo("essential-boxy-tee-void-1", "Two plain black tees on wire hangers against a white wall", CREDIT.salman)],
      },
      {
        ...color(BONE.id, BONE.name, BONE.hex, APPAREL_SIZES, [6, 12, 18, 15, 8, 3]),
        images: [
          photo("essential-boxy-tee-bone-1", "Plain off-white tee on a hanger against dark concrete", CREDIT.setyadi),
          photo("essential-boxy-tee-bone-2", "Plain off-white tee on a wooden hanger against a pale wall", CREDIT.singh),
        ],
      },
      color("slate", "Slate", "#474c55", APPAREL_SIZES, [4, 9, 11, 10, 6, 2]),
    ],
    sizes: APPAREL_SIZES,
    badge: "BESTSELLER",
    garment: "tee-boxy",
    collections: ["essentials"],
    bestsellerRank: 2,
    releasedAt: "2026-02-14",
    isDemo: true,
  },
  {
    id: "vt-006",
    slug: "signature-zip-hoodie",
    name: "Signature Zip Hoodie",
    category: "hoodies",
    price: 10500,
    currency: "USD",
    summary: "Full-zip loopback fleece with tonal hardware and split pockets.",
    description:
      "Our signature full-zip in 420 GSM loopback fleece with a two-way tonal zip, split pockets and a structured hood. A tonal mark is embroidered at the back neck.",
    details: [
      "Regular fit",
      "Two-way tonal metal zip",
      "Structured three-panel hood",
      "Split front pockets",
    ],
    material: "100% cotton loopback fleece, 420 GSM",
    fit: "Regular. Take your usual size.",
    care: ["Machine wash cold, zip closed", "Dry flat", "Do not bleach"],
    colors: [
      {
        ...color(VOID.id, VOID.name, VOID.hex, APPAREL_SIZES, [4, 10, 13, 12, 7, 2]),
        images: [photo("signature-zip-hoodie-void-1", "Black full-zip hoodie with a silver zipper, close crop in low light", CREDIT.timur)],
      },
      color("midnight", "Midnight", "#1b2236", APPAREL_SIZES, [2, 5, 8, 6, 3, 0]),
      color(GRAPHITE.id, GRAPHITE.name, GRAPHITE.hex, APPAREL_SIZES, [0, 4, 6, 5, 2, 1]),
    ],
    sizes: APPAREL_SIZES,
    badge: "NEW",
    garment: "zip-hoodie",
    collections: ["001", "essentials"],
    bestsellerRank: 4,
    releasedAt: "2026-09-05",
    isDemo: true,
  },
];

export const demoCollections: Collection[] = [
  {
    slug: "001",
    title: "Collection 001",
    tagline: "Form. Function. Identity.",
    description:
      "Technical outerwear, utility bottoms and heavyweight layers built around a single idea: clothing as architecture for the city at night.",
    productSlugs: [
      "technical-street-jacket",
      "utility-cargo-pants",
      "signature-zip-hoodie",
      "oversized-graphic-tee",
    ],
  },
  {
    slug: "essentials",
    title: "Essentials",
    tagline: "The daily uniform.",
    description:
      "Heavyweight basics with no noise. Cut boxy, built to last, designed to sit under everything else we make.",
    productSlugs: [
      "essential-heavyweight-hoodie",
      "essential-boxy-tee",
      "signature-zip-hoodie",
    ],
  },
];
