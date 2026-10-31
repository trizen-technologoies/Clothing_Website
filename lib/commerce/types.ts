import type { GarmentKind } from "@/lib/garments";

export type Category = "tees" | "hoodies" | "outerwear" | "bottoms";

export type Badge = "NEW" | "BESTSELLER";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Photographer credit for licensed stock photography. */
  credit?: { name: string; source: "Unsplash" | "Pexels"; url: string };
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  /** Units available per size. Missing sizes count as sold out. */
  stock: Record<string, number>;
  /** Commerce backend variant ids per size (e.g. Shopify ProductVariant GIDs). */
  variantIds?: Record<string, string>;
  /** Photos of this colour: [0] main, [1] alternate (card hover), then any extras. */
  images?: ProductImage[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  /** Price in minor units (cents). */
  price: number;
  currency: string;
  summary: string;
  description: string;
  details: string[];
  material: string;
  fit: string;
  care: string[];
  colors: ProductColor[];
  sizes: string[];
  badge?: Badge;
  /** Silhouette used for the illustrated flats and the 3D form study. */
  garment: GarmentKind;
  graphic?: boolean;
  /** Product-level photography, used for colours without their own `images`. */
  images?: ProductImage[];
  /** Optional path to a .glb model in /public, e.g. "/models/jacket.glb". */
  model3d?: string;
  collections: string[];
  featuredRank?: number;
  bestsellerRank?: number;
  releasedAt: string;
  /** True for the built-in demo catalogue. */
  isDemo: boolean;
};

export type Collection = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  productSlugs: string[];
};

export type CartLine = {
  /** productId:colorId:size — the same product in another size/color is a separate line. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  size: string;
  quantity: number;
  garment: GarmentKind;
  graphic?: boolean;
  /** Main photo of the chosen colour, if there is one. */
  image?: string;
  variantId?: string;
  /** Snapshot of available stock when added; quantity is clamped to it. */
  maxQuantity: number;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  tees: "T-Shirts",
  hoodies: "Hoodies",
  outerwear: "Outerwear",
  bottoms: "Bottoms",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function lineKey(productId: string, colorId: string, size: string) {
  return `${productId}:${colorId}:${size}`;
}

export function stockFor(product: Product, colorId: string, size: string) {
  return product.colors.find((c) => c.id === colorId)?.stock[size] ?? 0;
}

/**
 * Photos for a colour: its own images, else product-level images. Empty when
 * there is no photography — callers then fall back to the illustrated flat.
 */
export function productPhotos(product: Product, color?: ProductColor) {
  return color?.images?.length ? color.images : (product.images ?? []);
}

export function totalStock(color: ProductColor) {
  return Object.values(color.stock).reduce((a, b) => a + b, 0);
}
