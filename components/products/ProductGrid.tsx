import type { Product } from "@/lib/commerce/types";
import { pad2 } from "@/lib/format";
import { ProductCard } from "./ProductCard";

type Props = {
  products: Product[];
  columns?: 3 | 4;
  numbered?: boolean;
};

export function ProductGrid({ products, columns = 3, numbered = true }: Props) {
  const cols = columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  const sizes = columns === 4 ? "(min-width: 1024px) 25vw, 50vw" : "(min-width: 1024px) 33vw, 50vw";
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 ${cols}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} index={numbered ? pad2(i + 1) : undefined} sizes={sizes} priority={i < 2} />
        </li>
      ))}
    </ul>
  );
}
