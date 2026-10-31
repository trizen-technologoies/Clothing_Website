import Image from "next/image";

import type { GarmentKind } from "@/lib/garments";
import { ProductArt } from "./ProductArt";

/** Small product thumbnail: the colour's photo when known, else the illustrated flat. */
export function LineThumb({ image, garment, graphic, colorHex }: { image?: string; garment: GarmentKind; graphic?: boolean; colorHex: string }) {
  return image ? (
    <Image src={image} alt="" width={160} height={200} sizes="80px" className="size-full object-cover" />
  ) : (
    <ProductArt garment={garment} graphic={graphic} color={colorHex} label="" className="size-full" />
  );
}
