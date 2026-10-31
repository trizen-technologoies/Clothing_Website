import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageHeaderSkeleton } from "@/components/ui/Skeletons";
import { garments, type GarmentKind } from "@/lib/garments";
import { helpTopics } from "@/lib/help-content";
import { sizeGuides } from "@/lib/size-guide";

export function generateStaticParams() {
  return helpTopics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/help/[topic]">): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = helpTopics.find((t) => t.slug === slug);
  return topic ? { title: topic.title, description: topic.intro } : {};
}

function SizeTables() {
  return (
    <div className="space-y-12">
      {(Object.keys(sizeGuides) as GarmentKind[]).map((kind) => {
        const guide = sizeGuides[kind];
        return (
          <section key={kind} aria-labelledby={`size-${kind}`}>
            <h2 id={`size-${kind}`} className="eyebrow text-fg">
              {garments[kind].label}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    {guide.columns.map((c) => (
                      <th key={c} scope="col" className="py-3 pr-4 font-normal uppercase tracking-wider">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((row) => (
                    <tr key={String(row[0])} className="border-b border-line/60">
                      {row.map((cell, i) =>
                        i === 0 ? (
                          <th key={i} scope="row" className="py-3 pr-4 font-normal">
                            {cell}
                          </th>
                        ) : (
                          <td key={i} className="py-3 pr-4 text-muted">
                            {cell} cm
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">{guide.note}</p>
          </section>
        );
      })}
    </div>
  );
}

export default function HelpPage({ params }: PageProps<"/help/[topic]">) {
  return (
    <Suspense fallback={<PageHeaderSkeleton />}>
      <HelpContent params={params} />
    </Suspense>
  );
}

async function HelpContent({ params }: Pick<PageProps<"/help/[topic]">, "params">) {
  const { topic: slug } = await params;
  const topic = helpTopics.find((t) => t.slug === slug);
  if (!topic) notFound();

  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Help" }, { label: topic.title }]} eyebrow="Customer service" title={topic.title} description={topic.intro} />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-4 pb-28 sm:px-6 md:grid-cols-12 lg:px-10">
        <nav aria-label="Help topics" className="md:col-span-3">
          <ul className="space-y-1 border-l border-line">
            {helpTopics.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/help/${t.slug}`}
                  aria-current={t.slug === topic.slug ? "page" : undefined}
                  className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition-colors hover:text-fg aria-[current=page]:border-cyan aria-[current=page]:text-fg"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 max-w-2xl md:col-span-8 md:col-start-5">
          {topic.slug === "size-guide" ? (
            <SizeTables />
          ) : (
            <div className="space-y-10">
              {topic.sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="eyebrow text-fg">{s.heading}</h2>
                  {s.body.map((p) => (
                    <p key={p} className="mt-3 leading-relaxed text-fg/75">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          )}
          <p className="mt-14 border-t border-line pt-6 text-xs text-muted">Demo store — placeholder policy text, not legal advice.</p>
        </div>
      </div>
    </>
  );
}
