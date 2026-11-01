import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import type { SearchItem } from "@/components/layout/SearchOverlay";
import { Providers } from "@/components/Providers";
import { brand } from "@/lib/brand";
import { getCommerceMode, getProducts } from "@/lib/commerce";
import { productPhotos } from "@/lib/commerce/types";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Variable width axis powers both the condensed headlines and wide labels;
// the italic sets the hero headline.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s — ${brand.name}` },
  description: brand.description,
  openGraph: { title: `${brand.name} — ${brand.tagline}`, description: brand.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#04090b",
  colorScheme: "dark",
};

// Reveals intro-animated elements when JavaScript is disabled.
const NOSCRIPT_STYLES = "<style>[data-intro],[data-intro-line]{opacity:1!important;transform:none!important;animation:none!important}</style>";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const products = await getProducts();
  const searchItems: SearchItem[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    currency: p.currency,
    garment: p.garment,
    graphic: p.graphic,
    colorHex: p.colors[0].hex,
    image: productPhotos(p, p.colors[0])[0]?.src,
    colors: p.colors.map((c) => c.name),
  }));

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable}`}>
      <body>
        <Providers>
          <a
            href="#main"
            className="eyebrow fixed left-4 top-4 z-[60] -translate-y-24 bg-fg px-4 py-3 text-ink transition-transform focus:translate-y-0"
          >
            Skip to content
          </a>
          <Navbar searchItems={searchItems} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer mode={getCommerceMode()} />
        </Providers>
        <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_STYLES }} />
      </body>
    </html>
  );
}
