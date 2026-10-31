import Image from "next/image";

import { productPhotos, type Product } from "@/lib/commerce/types";
import { ProductArt, type ArtView } from "./ProductArt";

type Props = {
  product: Product;
  colorHex?: string;
  colorName?: string;
  view?: ArtView;
  /** Use the illustrated flat even when photos exist. */
  flat?: boolean;
  annotate?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

const PHOTO_SLOT: Record<ArtView, number> = { front: 0, back: 1, detail: 2 };

/**
 * Product imagery: the selected colour's photo for this view when there is
 * one, otherwise the illustrated flat. Add photos via `images` on a colour.
 */
export function ProductMedia({
  product,
  colorHex,
  colorName,
  view = "front",
  flat,
  annotate,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  className = "h-full w-full",
}: Props) {
  const color = product.colors.find((c) => c.hex === colorHex) ?? product.colors[0];
  const photo = flat ? undefined : productPhotos(product, color)[PHOTO_SLOT[view]];

  if (photo) {
    return (
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        priority={priority}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <ProductArt
      garment={product.garment}
      graphic={product.graphic}
      color={colorHex ?? color.hex}
      view={view}
      annotate={annotate}
      label={`${product.name} in ${colorName ?? color.name}, ${view} view — illustration`}
      className={className}
    />
  );
}
