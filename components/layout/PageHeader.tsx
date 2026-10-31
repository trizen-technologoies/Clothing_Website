import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { href?: string; label: string };

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  aside?: ReactNode;
};

/** Standard inner-page header; clears the fixed navigation. */
export function PageHeader({ eyebrow, title, description, crumbs, aside }: Props) {
  return (
    <header className="mx-auto max-w-[1600px] px-4 pb-10 pt-32 sm:px-6 md:pb-14 md:pt-40 lg:px-10">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="eyebrow flex flex-wrap items-center gap-2 text-[0.625rem] text-muted">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-fg">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-fg">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-4xl">
          {eyebrow && <p className="eyebrow text-cyan">{eyebrow}</p>}
          <h1 className="font-display-x mt-4 text-[clamp(3.6rem,10vw,10rem)]">{title}</h1>
          {description && <div className="mt-6 max-w-xl leading-relaxed text-fg/70">{description}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}
