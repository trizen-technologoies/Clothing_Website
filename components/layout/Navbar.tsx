"use client";

import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { Sheet } from "@/components/ui/Sheet";
import { brand } from "@/lib/brand";
import { SearchOverlay, type SearchItem } from "./SearchOverlay";
import { Wordmark } from "./Wordmark";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/world", label: "Our World" },
];

const linkUnderline =
  "relative after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-out-expo hover:after:origin-left hover:after:scale-x-100 aria-[current=page]:after:origin-left aria-[current=page]:after:scale-x-100";

export function Navbar({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();
  const menuTitleId = useId();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // "/" opens search, like most storefronts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || target.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const solid = scrolled || !isHome;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={`relative border-b transition-[background-color,border-color] duration-500 ${
            solid ? "border-line bg-ink/75 backdrop-blur-xl" : "border-transparent bg-transparent"
          }`}
        >
          {!solid && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/70 to-transparent" />}
          <nav aria-label="Primary" className="relative mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-10">
            <Link href="/" aria-label={`${brand.name} — home`} className="justify-self-start py-2">
              <Wordmark className="h-3.5 w-auto sm:h-4" />
            </Link>

            <ul className="hidden items-center gap-10 md:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`eyebrow ${linkUnderline} text-fg/85 transition-colors hover:text-fg`}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-self-end gap-1 sm:gap-2 xl:gap-6">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" aria-keyshortcuts="/" className="inline-flex h-10 items-center gap-2 px-2 text-fg/85 transition-colors hover:text-fg xl:px-0">
                <Search className="size-[1.125rem]" strokeWidth={1.5} />
                <span className={`eyebrow hidden xl:inline ${linkUnderline}`}>Search</span>
              </button>
              <Link href="/account" aria-label="Account" aria-current={isActive("/account") ? "page" : undefined} className="hidden h-10 items-center gap-2 px-2 text-fg/85 transition-colors hover:text-fg sm:inline-flex xl:px-0">
                <User className="size-[1.125rem]" strokeWidth={1.5} />
                <span className={`eyebrow hidden xl:inline ${linkUnderline}`}>Account</span>
              </Link>
              <button type="button" onClick={openCart} aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`} className="relative inline-flex h-10 items-center gap-2 px-2 text-fg/85 transition-colors hover:text-fg xl:px-0">
                <ShoppingBag className="size-[1.125rem]" strokeWidth={1.5} />
                <span className={`eyebrow hidden xl:inline ${linkUnderline}`}>Cart ({count})</span>
                {count > 0 && (
                  <span className="absolute right-0 top-1 inline-flex size-4 items-center justify-center rounded-full bg-cyan font-mono text-[0.5625rem] text-ink xl:hidden">
                    {count}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="inline-flex size-10 items-center justify-center text-fg md:hidden"
              >
                <Menu className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} items={searchItems} />

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="full" labelledBy={menuTitleId} className="flex h-dvh w-full flex-col bg-ink">
        <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6">
          <h2 id={menuTitleId} className="sr-only">
            Menu
          </h2>
          <Link href="/" onClick={() => setMenuOpen(false)} aria-label={`${brand.name} — home`}>
            <Wordmark className="h-3.5 w-auto" />
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="-mr-2 inline-flex size-10 items-center justify-center">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-between overflow-y-auto px-4 pb-8 pt-10 sm:px-6">
          <ul className="space-y-2">
            {[{ href: "/", label: "Home" }, ...NAV].map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="group flex items-baseline gap-4 py-1 aria-[current=page]:text-cyan"
                >
                  <span className="eyebrow text-muted">0{i + 1}</span>
                  <span className="font-display-x text-[clamp(3rem,15vw,5rem)] transition-colors group-hover:text-cyan">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6">
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="/account" onClick={() => setMenuOpen(false)} className="hover:text-fg">Account</Link></li>
              <li><button type="button" onClick={() => { setMenuOpen(false); setSearchOpen(true); }} className="hover:text-fg">Search</button></li>
              <li><Link href="/help/shipping" onClick={() => setMenuOpen(false)} className="hover:text-fg">Shipping</Link></li>
              <li><Link href="/help/returns" onClick={() => setMenuOpen(false)} className="hover:text-fg">Returns</Link></li>
            </ul>
            <ul className="space-y-3 text-sm text-muted">
              {brand.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-fg">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </Sheet>
    </>
  );
}
