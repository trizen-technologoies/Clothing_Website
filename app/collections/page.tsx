import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductMedia } from "@/components/products/ProductMedia";
import { btnArrow } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/Reveal";
import { getCollection, getCollections } from "@/lib/commerce";
import { pad2 } from "@/lib/format";

export const metadata: Metadata = {
  title: "Collections",
  description: "Collection 001 and the Essentials — editorial edits of the range.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();
  const full = (await Promise.all(collections.map((c) => getCollection(c.slug)))).filter((c) => c !== undefined);

  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Collections" }]} eyebrow="Edits" title="Collections" />
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-28 sm:px-6 lg:px-10">
        {full.map((c, i) => (
          <Reveal key={c.slug}>
            <Link href={`/collections/${c.slug}`} className="group grid overflow-hidden border border-line transition-colors hover:border-line-strong md:grid-cols-12">
              <div className="flex flex-col justify-between gap-10 p-6 sm:p-10 md:col-span-5">
                <div>
                  <p className="eyebrow text-muted">
                    {pad2(i + 1)} — {pad2(c.products.length)} pieces
                  </p>
                  <h2 className="font-display-x mt-6 text-[clamp(3rem,6vw,6rem)]">{c.title}</h2>
                  <p className="font-display-wide mt-4 text-xs tracking-[0.3em] text-cyan">{c.tagline}</p>
                  <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg/70">{c.description}</p>
                </div>
                <span className="group/btn eyebrow inline-flex items-center gap-2">
                  Explore {c.title} <ArrowRight className={btnArrow} />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-line md:col-span-7">
                {c.products.slice(0, 3).map((p) => (
                  <div key={p.id} className="relative aspect-[3/4] overflow-hidden bg-card md:aspect-auto md:min-h-[26rem]">
                    <ProductMedia product={p} colorHex={p.colors[0].hex} className="absolute inset-0 size-full transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]" sizes="(min-width: 768px) 20vw, 33vw" />
                  </div>
                ))}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
