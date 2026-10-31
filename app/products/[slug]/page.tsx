import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductExperience } from "@/components/products/ProductExperience";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProductSkeleton } from "@/components/ui/Skeletons";
import { getProduct, getProducts, getRelated } from "@/lib/commerce";
import { CATEGORY_LABELS } from "@/lib/commerce/types";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.summary } : {};
}

// The shell renders instantly on navigation; the product streams in once params resolve.
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const [product, products] = await Promise.all([getProduct(slug), getProducts()]);
  if (!product) notFound();
  const related = getRelated(products, product);

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="eyebrow flex flex-wrap items-center gap-2 text-[0.625rem] text-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/shop" className="hover:text-fg">Shop</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/shop?category=${product.category}`} className="hover:text-fg">{CATEGORY_LABELS[product.category]}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-fg">{product.name}</li>
          </ol>
        </nav>
        <ProductExperience product={product} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <SectionLabel index="+">Complete the uniform</SectionLabel>
            <h2 id="related-title" className="font-display-x mb-12 mt-6 text-[clamp(2.8rem,6vw,6rem)]">
              Wear it with
            </h2>
            <ProductGrid products={related} columns={4} numbered={false} />
          </div>
        </section>
      )}
    </>
  );
}
