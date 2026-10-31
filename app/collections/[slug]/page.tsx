import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/products/ProductGrid";
import { GridSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeletons";
import { getCollection, getCollections } from "@/lib/commerce";
import { pad2 } from "@/lib/format";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const collection = await getCollection((await params).slug);
  return collection ? { title: collection.title, description: collection.description } : {};
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <GridSkeleton />
        </>
      }
    >
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const collection = await getCollection((await params).slug);
  if (!collection) notFound();

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { href: "/collections", label: "Collections" }, { label: collection.title }]}
        eyebrow={collection.tagline}
        title={collection.title}
        description={collection.description}
        aside={<p className="eyebrow text-muted">{pad2(collection.products.length)} pieces</p>}
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-28 sm:px-6 lg:px-10">
        <div className="mb-10 h-px bg-line" />
        <ProductGrid products={collection.products} columns={collection.products.length >= 4 ? 4 : 3} />
      </div>
    </>
  );
}
