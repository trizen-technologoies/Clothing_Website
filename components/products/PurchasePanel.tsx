"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { btn } from "@/components/ui/buttons";
import { totalStock, type Product } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { ColorSwatches } from "./ColorSwatches";
import { QuantityStepper } from "./QuantityStepper";
import { SizeGuideButton } from "./SizeGuide";
import { SizeSelector } from "./SizeSelector";
import { WishlistButton } from "./WishlistButton";

type Props = {
  product: Product;
  colorId: string;
  onColorChange: (id: string) => void;
  /** Unique prefix so several panels can share a page (radio group names). */
  idPrefix: string;
};

const LOW_STOCK = 3;

/** Color, size and quantity selection plus add-to-cart. */
export function PurchasePanel({ product, colorId, onColorChange, idPrefix }: Props) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const available = size ? (color.stock[size] ?? 0) : 0;
  const colorSoldOut = totalStock(color) === 0;
  const maxQty = Math.max(1, Math.min(available, 10));

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(t);
  }, [added]);

  function changeColor(id: string) {
    onColorChange(id);
    const next = product.colors.find((c) => c.id === id);
    if (size && next && (next.stock[size] ?? 0) <= 0) setSize(null);
    setQuantity(1);
  }

  function add() {
    if (!size || available <= 0) return;
    addItem(product, color, size, Math.min(quantity, available));
    setAdded(true);
  }

  let status: string;
  if (colorSoldOut) status = `Sold out in ${color.name}`;
  else if (!size) status = "Select a size to see availability";
  else if (available <= LOW_STOCK) status = `Low stock — only ${available} left in ${size}`;
  else status = "In stock — ships in 1–2 business days";

  return (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="eyebrow text-muted">
            Color — <span className="text-fg">{color.name}</span>
          </p>
        </div>
        <ColorSwatches name={`${idPrefix}-color`} colors={product.colors} value={color.id} onChange={changeColor} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow text-muted">
            Size{size && <> — <span className="text-fg">{size}</span></>}
          </p>
          <SizeGuideButton garment={product.garment} productName={product.name} />
        </div>
        <SizeSelector
          name={`${idPrefix}-size`}
          sizes={product.sizes}
          stock={color.stock}
          value={size}
          onChange={(s) => {
            setSize(s);
            setQuantity(1);
          }}
          lowStockAt={LOW_STOCK}
        />
        <p aria-live="polite" className={`mt-3 flex items-center gap-2 text-sm ${available > 0 && available <= LOW_STOCK ? "text-cyan" : "text-muted"}`}>
          <span className={`size-1.5 rounded-full ${colorSoldOut ? "bg-danger" : size && available > 0 ? "bg-cyan" : "bg-muted"}`} />
          {status}
        </p>
      </div>

      <div className="flex items-stretch gap-2">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} />
        <button
          type="button"
          onClick={add}
          disabled={!size || available <= 0}
          className={`${btn.primary} h-11 min-w-0 flex-1 px-4 sm:px-7`}
        >
          {added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : !size ? (
            "Select a size"
          ) : (
            <>
              Add to cart
              {/* The price is already shown above; small phones drop it to fit. */}
              <span className="hidden min-[400px]:inline">— {formatPrice(product.price * quantity, product.currency)}</span>
            </>
          )}
        </button>
        <WishlistButton slug={product.slug} name={product.name} className="h-11 w-11 border border-line" />
      </div>
    </div>
  );
}
