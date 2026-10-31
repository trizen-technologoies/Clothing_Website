import "server-only";

import { cacheLife } from "next/cache";

import { demoCollections, demoProducts } from "./catalog";
import { fetchShopifyProducts, isShopifyConfigured } from "./shopify";
import type { Collection, Product } from "./types";

/*
 * Commerce entry point. Pages and route handlers import from here, never from
 * the demo catalogue or Shopify module directly, so the backend can change
 * without touching presentation code.
 */

export type CommerceMode = "shopify" | "demo";

export function getCommerceMode(): CommerceMode {
  return isShopifyConfigured() ? "shopify" : "demo";
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  if (isShopifyConfigured()) return fetchShopifyProducts();
  return demoProducts;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function getCollections(): Promise<Collection[]> {
  return demoCollections;
}

export async function getCollection(slug: string) {
  const [collection, products] = await Promise.all([
    getCollections().then((all) => all.find((c) => c.slug === slug)),
    getProducts(),
  ]);
  if (!collection) return undefined;
  const items = collection.productSlugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p));
  return { ...collection, products: items };
}

export function sortFeatured(products: Product[]) {
  return products
    .filter((p) => p.featuredRank != null)
    .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
}

export function sortBestsellers(products: Product[]) {
  return [...products].sort((a, b) => (a.bestsellerRank ?? 99) - (b.bestsellerRank ?? 99));
}

export function getRelated(products: Product[], product: Product, count = 4) {
  const others = products.filter((p) => p.id !== product.id);
  const sameCollection = others.filter((p) => p.collections.some((c) => product.collections.includes(c)));
  const rest = others.filter((p) => !sameCollection.includes(p));
  return [...sameCollection, ...rest].slice(0, count);
}
