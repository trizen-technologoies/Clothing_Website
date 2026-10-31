import Link from "next/link";

import { brand } from "@/lib/brand";
import { Wordmark } from "./Wordmark";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All pieces" },
      { href: "/shop?category=outerwear", label: "Outerwear" },
      { href: "/shop?category=hoodies", label: "Hoodies" },
      { href: "/shop?category=tees", label: "T-Shirts" },
      { href: "/shop?category=bottoms", label: "Bottoms" },
    ],
  },
  {
    title: "Brand",
    links: [
      { href: "/collections/001", label: "Collection 001" },
      { href: "/collections/essentials", label: "Essentials" },
      { href: "/world", label: "Our World" },
      { href: "/account", label: "Account & wishlist" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help/shipping", label: "Shipping" },
      { href: "/help/returns", label: "Returns" },
      { href: "/help/size-guide", label: "Size guide" },
      { href: "/help/faq", label: "FAQ" },
      { href: "/help/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pb-10 pt-16 sm:px-6 lg:grid-cols-12 lg:px-10 lg:pt-24">
        <div className="lg:col-span-4">
          <p className="font-display-x text-5xl">{brand.tagline}</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{brand.description}</p>
          <p className="mt-6 text-sm text-muted">
            Support —{" "}
            <a href={`mailto:${brand.supportEmail}`} className="text-fg underline-offset-4 hover:underline">
              {brand.supportEmail}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-7 lg:col-start-6">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="eyebrow text-muted">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-fg/80 transition-colors hover:text-cyan">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Social">
            <p className="eyebrow text-muted">Follow</p>
            <ul className="mt-5 space-y-3 text-sm">
              {brand.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="text-fg/80 transition-colors hover:text-cyan">
                    {s.label} <span aria-hidden>↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div aria-hidden className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* Opacity on the whole SVG so overlapping glyph parts don't double up. */}
        <Wordmark className="h-auto w-full text-fg opacity-[0.07]" title="" />
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 border-t border-line px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p>© 2026 {brand.name}. Demo storefront — products are fictional and no orders are processed.</p>
        <div className="flex gap-6">
          <Link href="/help/privacy" className="hover:text-fg">Privacy</Link>
          <Link href="/help/terms" className="hover:text-fg">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
