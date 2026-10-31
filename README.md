# VANTA — futuristic streetwear storefront

A premium, 3D-led e-commerce front end for a fictional streetwear brand. It pairs a cinematic, scroll-driven Three.js hero with a complete demo shopping flow (catalogue, product pages, cart, simulated checkout) and an integration layer ready for Shopify.

> **Demo status.** VANTA is a fictional brand. The six products, their stock levels, policies and checkout are placeholders. No payment is taken and no order is created. Production commerce is **not** complete until a real backend is connected and tested — see [Going to production](#going-to-production).

---

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components + Partial Prefetching) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| 3D | three.js r186, React Three Fiber 9, Drei 10, @react-three/postprocessing 3 |
| Motion | GSAP 3 + ScrollTrigger (`@gsap/react`) |
| Icons | lucide-react |
| Fonts | Archivo (variable width axis), Geist, Geist Mono via `next/font` |

## Getting started

Requires Node.js 20.9+ (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with Turbopack |
| `npm run build` | Production build (type-checks and prerenders every route) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js + React Compiler rules) |
| `npx tsc --noEmit` | Type-check only |

No environment variables are needed to run the demo.

## Project structure

```
app/
  layout.tsx                 Fonts, providers, navbar, footer, cart drawer
  page.tsx                   Homepage: the scroll story + sections
  shop/                      Catalogue with URL-synced filter/sort
  collections/[slug]/        Editorial collections
  products/[slug]/           Product detail page
  world/ account/ checkout/  Brand story, wishlist, demo checkout
  help/[topic]/              Shipping, returns, size guide, FAQ, policies
  api/checkout/route.ts      Validates the cart server-side; Shopify or demo checkout
components/
  hero/                      HeroScene (3D), HeroStage (loading/fallback), HeroSection (copy + intro), HomeStory (scroll)
  three/                     Garment form, lights, particles, architecture, fabric, environment
  sections/                  Brand statement, featured collection, showcase, campaign, categories, best sellers, newsletter
  products/                  Product card/grid, gallery, 3D viewer, purchase panel, quick view, size guide, illustrations
  cart/                      Cart + wishlist state, drawer, demo checkout
  layout/                    Navbar, search, footer, wordmark, page header
  ui/                        Sheet (native <dialog>), reveal, buttons, skeletons
lib/
  brand.ts                   Brand name, copy, links — change identity here
  garments.ts                Garment silhouettes (shared by SVG flats and 3D)
  commerce/                  Types, demo catalogue, Shopify client, commerce entry point
  size-guide.ts help-content.ts color.ts format.ts hooks.ts gsap.ts local-store.ts
```

### How the visuals work

- **Garment silhouettes** live in `lib/garments.ts` as "technical flats": outline polygons with corner radii, plus seams, stitching, zips and ribs. They drive both:
  - `components/products/ProductArt.tsx` — SVG product illustrations (front, back, close-up) with rim lighting. These are clearly labelled illustrations, used wherever product photography is missing.
  - `components/three/garmentGeometry.ts` — the 3D **form study**: the outline is extruded with a deep rounded bevel, and details are painted into canvas bump/emissive/colour maps. It is a sculptural object derived from the flat, and is labelled as such — not a realistic garment model.
- **Hero** (`components/hero/`): one sticky WebGL stage spans the first three scenes. Scroll progress through the statement and featured sections (GSAP ScrollTrigger → `heroState`) blends three camera/garment poses, so the jacket turns to show its reflective back tape behind "NOT MADE TO FOLLOW." and returns front-on with spec callouts for Collection 001. Nothing is pinned; the page scrolls natively.
- **Campaign** (`components/sections/CampaignScene.tsx`): hanging silk strips whose displacement and normals are computed in the vertex shader.

### Performance and resilience

- 3D chunks load via `next/dynamic` after first paint; pages without 3D never download three.js.
- Scenes stop rendering when off-screen (IntersectionObserver → `frameloop="never"`), and when a page is hidden by Next's Activity-based navigation.
- Lower-tier devices (narrow, touch, or fewer than 4 cores) get fewer particles, fewer monoliths, no reflections and no post-processing. On other devices, `PerformanceMonitor` starts judging after a 4-second warm-up, lowers render resolution step by step if frames drop, and only removes effects if it still struggles at native resolution.
- Thin glowing lines (arch, rings, light strips) are screen-space lines with a fixed pixel width, so they never break into dashes at a distance.
- **Fallbacks:** a static illustrated composition renders under the hero and stays if WebGL is unavailable or the scene errors (error boundary). With JavaScript disabled, a `<noscript>` style reveals all intro content.
- **Smooth scrolling:** mouse-wheel scrolling glides with inertia (Lenis, `components/SmoothScroll.tsx`), driven by GSAP's ticker so ScrollTrigger stays in sync. Touch and keyboard scrolling stay native, open dialogs pause it, and it is off for reduced motion. Tune the feel with `lerp` (lower is heavier).
- **Reduced motion:** intro animations, scroll-driven camera moves, parallax and ambient motion are disabled; scenes render one static frame.
- Post-processing uses SMAA instead of a multisampled buffer — MSAA combined with mipmap bloom rendered black on an Intel/Direct3D 11 GPU during testing.

## Customising

### Brand name and logo

- Name, tagline, support email and social links: `lib/brand.ts`.
- The wordmark is drawn from polygon glyphs in `components/layout/Wordmark.tsx` (V, A drawn as Λ, N, T). If `brand.name` uses other letters it falls back to set type automatically. To use your own logo, replace the component's return value with your SVG (keep `currentColor` so it inherits nav colours).
- Favicon: `app/icon.svg`.
- Colours and type tokens: the `@theme` block in `app/globals.css`.

### Product images

Photos belong to a **colour**, so picking a colour shows its own photos. Colours without photos fall back to the illustrated flats. Add them in `lib/commerce/catalog.ts` (or let Shopify supply product-level `images`):

```ts
{
  ...color("void", "Void", "#0e0f12", SIZES, [4, 10, 13, 12, 7, 2]),
  images: [
    { src: "/products/jacket-void-front.jpg", alt: "Technical Street Jacket in black, front", width: 1200, height: 1500 },
    { src: "/products/jacket-void-worn.jpg",  alt: "Technical Street Jacket in black, worn",  width: 1200, height: 1500 },
  ],
},
```

Files go in `public/products/`. Image 0 is the main photo, 1 is shown on card hover, and every photo appears in the product gallery before the flats and the 3D view. Use a 4:5 aspect ratio (1200×1500 works well). When replacing a photo, give the file a **new name**; Next's image optimizer and browsers cache by URL. Remote images must be allowed in `next.config.ts` (`cdn.shopify.com` already is).

#### Current demo photography

The demo uses **free-licence stock photos** from Unsplash ([Unsplash License](https://unsplash.com/license)) and Pexels ([Pexels License](https://www.pexels.com/license/)). Both allow free commercial use. They show similar plain garments, not these fictional products, and the product page labels them "stock image, demo product". They were cropped to 4:5 with faces left out of frame (so no real person appears to endorse the brand), third-party logos kept out of shot, and a light shared colour grade. The Oversized Graphic Tee photo has the VANTA emblem composited onto a plain black tee. Replace them with real product photography before launch.

| File | Photographer | Source |
| --- | --- | --- |
| `oversized-graphic-tee-void-1.jpg` (emblem added) | Ryan Hoffman | [Unsplash](https://unsplash.com/photos/Cs4GVbMqKGY) |
| `essential-heavyweight-hoodie-void-1.jpg` | Monstera Production | [Pexels](https://www.pexels.com/photo/stylish-black-man-in-hoodie-6311560/) |
| `essential-heavyweight-hoodie-void-2.jpg` | Angela Roma | [Pexels](https://www.pexels.com/photo/models-and-black-and-white-hoodies-in-studio-7479825/) |
| `utility-cargo-pants-void-1.jpg`, `technical-street-jacket-void-worn.jpg` | Vitaly Gorbachev | [Pexels](https://www.pexels.com/photo/man-in-black-coat-leaning-down-towards-camera-19357727/) |
| `utility-cargo-pants-olive-night-1.jpg` | Quang Viet Nguyen | [Pexels](https://www.pexels.com/photo/photo-of-a-person-in-oversize-pants-and-trainers-11716436/) |
| `technical-street-jacket-void-hanging.jpg` | alan King | [Unsplash](https://unsplash.com/photos/mAdZ4osNFPg) |
| `essential-boxy-tee-void-1.jpg` | Md Salman | [Unsplash](https://unsplash.com/photos/iiqg2xbmvk0) |
| `essential-boxy-tee-bone-1.jpg` | Haryo Setyadi | [Unsplash](https://unsplash.com/photos/acn5ERAeSb4) |
| `essential-boxy-tee-bone-2.jpg` | Avtar Singh | [Unsplash](https://unsplash.com/photos/8ACmRoleM24) |
| `signature-zip-hoodie-void-1.jpg` | Eyüpcan Timur | [Pexels](https://www.pexels.com/photo/man-posing-in-jumper-20536778/) |

### 3D models

Set `model3d: "/models/jacket.glb"` on a product and place the file in `public/models/`. The product viewer then loads it with `useGLTF` (centred automatically) instead of the procedural form study. Recommendations: glTF binary, real-world scale around 1.5–3 units tall, Draco or Meshopt compression, textures ≤ 2K, under ~5 MB. The hero uses the procedural jacket; to put a real model there, swap `<GarmentDisplay>` in `components/hero/HeroScene.tsx`.

### Adding products

Add an entry to `demoProducts` in `lib/commerce/catalog.ts`. Prices are in cents; `stock` is per colour and size; `garment` picks a silhouette (`tee`, `tee-boxy`, `hoodie`, `zip-hoodie`, `jacket`, `cargo`). New silhouettes are added in `lib/garments.ts`.

## Environment variables

Copy `.env.example` to `.env.local`. All variables are read on the server only.

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | e.g. `your-store.myshopify.com`. Empty → demo mode |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Private Storefront API token |
| `SHOPIFY_STOREFRONT_API_VERSION` | e.g. `2026-07` (defaults to `2026-07`) |

## Connecting Shopify

The storefront switches to Shopify automatically when both the domain and token are set (`lib/commerce/index.ts → getCommerceMode()`).

1. **Create access.** In Shopify admin, install the **Headless** sales channel and create a storefront. Copy the **private** Storefront API token into `SHOPIFY_STOREFRONT_ACCESS_TOKEN`. Enable the scopes for products, product inventory (`unauthenticated_read_product_inventory`, used for stock levels) and checkouts/carts.
2. **Product catalogue.** `lib/commerce/shopify.ts` maps Shopify products to the app's `Product` type:
   - Options named **Color** and **Size** become swatches and sizes; colour swatches come from option-value swatches when set.
   - **Product type** maps to a category (`T-Shirt`, `Hoodie`, `Outerwear`/`Jacket`, `Pants`/`Bottoms`).
   - Tags: `garment:<kind>` picks the illustration/3D silhouette, `new` / `bestseller` set badges, `featured` places it in the homepage edit, `collection:<slug>` adds it to an editorial collection.
   - Product **handles** must match the `productSlugs` used in `demoCollections` (or edit the collections).
   - Results are cached with `"use cache"` + `cacheLife("hours")`. For instant updates, add `cacheTag` and a Shopify webhook that calls `revalidateTag`.
3. **Inventory.** Stock comes from `quantityAvailable` per variant. Shopify remains the source of truth: checkout re-validates availability.
4. **Checkout and payments.** The cart drawer posts lines to `/api/checkout`, which re-validates products, sizes and stock server-side, creates a Shopify cart (`cartCreate`) and redirects to Shopify's hosted checkout. Payments, taxes and fraud checks are configured in Shopify admin (Shopify Payments or another provider). The app never handles card data.
5. **Order management.** Orders, fulfilment, refunds and customer notifications are managed in Shopify admin. Customer accounts (`/account`) can be connected with the Customer Account API.
6. **Shipping.** Configure zones, rates and the free-shipping threshold in Shopify. Update `brand.freeShippingThreshold` and the copy in `lib/help-content.ts` to match.
7. **Before launch:** test checkout end to end with Shopify's test payment gateway, replace placeholder policies, add real product photography, and set up analytics/consent as required.

## Going to production

What is complete: the front end, responsive layouts, accessibility and motion handling, the cart, and the checkout hand-off code. What still needs real accounts and testing: the Shopify connection, payments, shipping rates, taxes, order flow, customer accounts, newsletter delivery (the form currently stores nothing — wire it to Shopify Customer API, Klaviyo or similar) and legal copy.

## Deployment

The app is a standard Next.js 16 project.

- **Vercel:** import the repository, add the environment variables, deploy. Prerendered pages are served from the CDN; `/api/checkout` runs as a function.
- **Self-hosting / Node:** `npm run build && npm run start` behind a reverse proxy, or build a Docker image from the official Next.js example. Persist `.next/cache` between builds for faster rebuilds.

## Notes and known limitations

- **404s on product URLs.** Product, collection and help pages stream their content inside a Suspense boundary so client navigation is instant. A non-existent slug therefore renders the 404 page with a `noindex` meta tag but an HTTP 200 status (documented Next.js streaming behaviour). For a hard 404, add a check in `proxy.ts` before rendering.
- The 3D garment is an abstract form study, and the photos are stock images of similar garments. Real product photography and GLB models are the biggest upgrades available.
- During development, Next.js keeps visited routes mounted but hidden; DOM queries in end-to-end tests can match hidden elements — scope selectors to visible content.
