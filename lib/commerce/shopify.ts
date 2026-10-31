import "server-only";

import type { Category, Product, ProductColor } from "./types";
import type { GarmentKind } from "@/lib/garments";

/*
 * Shopify Storefront API integration layer.
 *
 * Inactive until SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are
 * set. Tokens are only read on the server — never import this file from a
 * client component. See README → "Connecting Shopify" for the store setup this
 * mapping expects (Color/Size options, product types, `garment:*` tags).
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-07";

export function isShopifyConfigured() {
  return Boolean(domain && token);
}

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

async function storefront<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!domain || !token) throw new Error("Shopify is not configured");

  const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Private Storefront token: server-side only.
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Shopify request failed: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("Shopify returned no data");
  return json.data;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

type ShopifyVariant = {
  id: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string; currencyCode: string };
};

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  publishedAt: string;
  options: { name: string; optionValues: { name: string; swatch: { color: string | null } | null }[] }[];
  images: { nodes: { url: string; altText: string | null; width: number; height: number }[] };
  variants: { nodes: ShopifyVariant[] };
};

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        description
        productType
        tags
        publishedAt
        options {
          name
          optionValues {
            name
            swatch { color }
          }
        }
        images(first: 6) {
          nodes { url altText width height }
        }
        variants(first: 100) {
          nodes {
            id
            availableForSale
            quantityAvailable
            selectedOptions { name value }
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

const CATEGORY_BY_TYPE: Record<string, Category> = {
  "t-shirt": "tees",
  tee: "tees",
  hoodie: "hoodies",
  outerwear: "outerwear",
  jacket: "outerwear",
  pants: "bottoms",
  bottoms: "bottoms",
};

const GARMENT_BY_CATEGORY: Record<Category, GarmentKind> = {
  tees: "tee",
  hoodies: "hoodie",
  outerwear: "jacket",
  bottoms: "cargo",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapProduct(p: ShopifyProduct, index: number): Product {
  const category = CATEGORY_BY_TYPE[p.productType.toLowerCase()] ?? "tees";
  const garmentTag = p.tags.find((t) => t.startsWith("garment:"))?.slice(8) as GarmentKind | undefined;
  const colorOption = p.options.find((o) => o.name.toLowerCase() === "color");
  const sizeOption = p.options.find((o) => o.name.toLowerCase() === "size");
  const sizes = sizeOption?.optionValues.map((v) => v.name) ?? ["One Size"];
  const colorValues = colorOption?.optionValues ?? [{ name: "Default", swatch: null }];

  const colors: ProductColor[] = colorValues.map((cv) => {
    const stock: Record<string, number> = {};
    const variantIds: Record<string, string> = {};
    for (const v of p.variants.nodes) {
      const vColor = v.selectedOptions.find((o) => o.name.toLowerCase() === "color")?.value ?? "Default";
      const vSize = v.selectedOptions.find((o) => o.name.toLowerCase() === "size")?.value ?? "One Size";
      if (vColor !== cv.name) continue;
      variantIds[vSize] = v.id;
      // quantityAvailable needs the unauthenticated_read_product_inventory scope.
      stock[vSize] = v.availableForSale ? Math.max(v.quantityAvailable ?? 10, 0) : 0;
    }
    return { id: slugify(cv.name), name: cv.name, hex: cv.swatch?.color ?? "#1a1c20", stock, variantIds };
  });

  const first = p.variants.nodes[0];
  return {
    id: p.id,
    slug: p.handle,
    name: p.title,
    category,
    price: Math.round(parseFloat(first?.price.amount ?? "0") * 100),
    currency: first?.price.currencyCode ?? "USD",
    summary: p.description.split(". ")[0] ?? "",
    description: p.description,
    details: [],
    material: "",
    fit: "",
    care: [],
    colors,
    sizes,
    badge: p.tags.includes("bestseller") ? "BESTSELLER" : p.tags.includes("new") ? "NEW" : undefined,
    garment: garmentTag ?? GARMENT_BY_CATEGORY[category],
    images: p.images.nodes.map((img) => ({
      src: img.url,
      alt: img.altText ?? p.title,
      width: img.width,
      height: img.height,
    })),
    collections: p.tags.filter((t) => t.startsWith("collection:")).map((t) => t.slice(11)),
    featuredRank: p.tags.includes("featured") ? index + 1 : undefined,
    bestsellerRank: index + 1,
    releasedAt: p.publishedAt,
    isDemo: false,
  };
}

export async function fetchShopifyProducts(): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: ShopifyProduct[] } }>(PRODUCTS_QUERY, { first: 50 });
  return data.products.nodes.map(mapProduct);
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { checkoutUrl }
      userErrors { field message }
    }
  }
`;

/**
 * Creates a Shopify cart and returns its hosted checkout URL. Payment,
 * taxes and shipping are handled entirely by Shopify Checkout.
 */
export async function createShopifyCheckout(lines: { merchandiseId: string; quantity: number }[]) {
  const data = await storefront<{
    cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(CART_CREATE, { lines });

  if (data.cartCreate.userErrors.length || !data.cartCreate.cart) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; ") || "Cart creation failed");
  }
  return data.cartCreate.cart.checkoutUrl;
}
