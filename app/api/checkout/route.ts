import { getCommerceMode, getProducts } from "@/lib/commerce";
import { createShopifyCheckout } from "@/lib/commerce/shopify";

type IncomingLine = { productId: string; colorId: string; size: string; quantity: number };

function isLine(value: unknown): value is IncomingLine {
  const l = value as IncomingLine;
  return (
    typeof l?.productId === "string" &&
    typeof l.colorId === "string" &&
    typeof l.size === "string" &&
    Number.isInteger(l.quantity) &&
    l.quantity > 0 &&
    l.quantity <= 10
  );
}

/**
 * Starts checkout for the client cart. Lines are re-validated against the
 * catalogue — prices and stock never come from the client.
 *
 * - Shopify mode: creates a Shopify cart and returns its hosted checkout URL.
 * - Demo mode: returns the local demo checkout page. No payment is taken.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lines = (body as { lines?: unknown })?.lines;
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50 || !lines.every(isLine)) {
    return Response.json({ error: "Your cart is empty or invalid" }, { status: 400 });
  }

  const products = await getProducts();
  const resolved = [];
  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    const color = product?.colors.find((c) => c.id === line.colorId);
    const stock = color?.stock[line.size] ?? 0;
    if (!product || !color || !product.sizes.includes(line.size)) {
      return Response.json({ error: "An item in your cart is no longer available" }, { status: 409 });
    }
    if (stock < line.quantity) {
      return Response.json({ error: `Only ${stock} left of ${product.name} (${color.name}, ${line.size})` }, { status: 409 });
    }
    resolved.push({ line, product, color });
  }

  if (getCommerceMode() === "shopify") {
    const merchandise = resolved.map(({ line, color }) => ({ merchandiseId: color.variantIds?.[line.size], quantity: line.quantity }));
    if (merchandise.some((m) => !m.merchandiseId)) {
      return Response.json({ error: "Some items are missing a Shopify variant" }, { status: 409 });
    }
    try {
      const url = await createShopifyCheckout(merchandise as { merchandiseId: string; quantity: number }[]);
      return Response.json({ mode: "shopify", url });
    } catch (e) {
      console.error("[checkout] Shopify cart creation failed", e);
      return Response.json({ error: "Checkout is temporarily unavailable" }, { status: 502 });
    }
  }

  return Response.json({ mode: "demo", url: "/checkout" });
}
