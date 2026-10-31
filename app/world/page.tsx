import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductArt } from "@/components/products/ProductArt";
import { btn, btnArrow } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Our World",
  description: `The ideas behind ${brand.name}: form, function and identity.`,
};

const PRINCIPLES = [
  {
    title: "Form",
    body: "Silhouettes are drawn as architecture first — boxy volumes, dropped shoulders, deliberate proportion. A garment should hold its shape on the hanger and on the street.",
  },
  {
    title: "Function",
    body: "Pockets you can reach, hems you can adjust, fabrics that handle weather. Every detail earns its place by doing something.",
  },
  {
    title: "Identity",
    body: "No loud logos. The signal is in the cut and the construction — clothing for people who already know who they are.",
  },
];

export default function WorldPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Our World" }]}
        eyebrow="Independent fashion / Future culture"
        title={
          <>
            Our
            <br />
            world
          </>
        }
        description={`${brand.name} makes modern streetwear for people who build their own identity. We design in small, considered collections — each one a study of how clothing can feel engineered without losing its edge.`}
      />

      <section aria-labelledby="principles-title" className="border-t border-line">
        <h2 id="principles-title" className="sr-only">
          Principles
        </h2>
        <ol className="mx-auto grid max-w-[1600px] md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} className="min-w-0 border-b border-line px-4 py-14 sm:px-6 md:border-b-0 md:border-r md:last:border-r-0 lg:px-10 lg:py-20">
              <Reveal delay={i * 100}>
                <p className="eyebrow text-muted">0{i + 1}</p>
                <p className="font-display-x mt-6 text-6xl md:text-5xl lg:text-7xl">{p.title}</p>
                <p className="mt-6 max-w-sm leading-relaxed text-fg/70">{p.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="studio-title" className="border-t border-line py-24 md:py-32">
        <div className="mx-auto grid max-w-[1600px] items-center gap-14 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
          <Reveal className="md:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-card">
              <ProductArt garment="jacket" color="#2a2048" view="back" label="Technical Street Jacket, back view, showing the reflective signal tape — illustration" className="absolute inset-0 size-full" />
              <p className="eyebrow absolute bottom-4 left-4 text-[0.625rem] text-muted">Fig. — Signal tape, back yoke</p>
            </div>
          </Reveal>
          <div className="md:col-span-5 md:col-start-8">
            <SectionLabel index="02">Studio notes</SectionLabel>
            <h2 id="studio-title" className="font-display-x mt-6 text-[clamp(3rem,6vw,6rem)]">
              Drawn like architecture.
            </h2>
            <div className="mt-8 space-y-5 leading-relaxed text-fg/70">
              <p>
                Every piece starts as a technical flat — the same drawings you see across this store. We refine proportion on paper
                before a single sample is cut, then strip away anything that doesn&apos;t serve the wearer.
              </p>
              <p>
                Colour is restrained on purpose. Black, bone, graphite — with a single line of reflective signal tape that only
                reveals itself when light hits it.
              </p>
            </div>
            <Link href="/collections/001" className={`${btn.primary} mt-10`}>
              See Collection 001 <ArrowRight className={btnArrow} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line px-4 py-16 sm:px-6 lg:px-10">
        <p className="mx-auto max-w-[1600px] text-sm text-muted">
          {brand.name} is a fictional brand created to demonstrate this storefront. The products, policies and copy are placeholders.
        </p>
      </section>
    </>
  );
}
