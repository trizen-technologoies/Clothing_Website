"use client";

import { Box, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { productPhotos, type Product, type ProductImage } from "@/lib/commerce/types";
import { useWebGLSupport } from "@/lib/hooks";
import type { ArtView } from "./ProductArt";
import { ProductMedia } from "./ProductMedia";

const ProductViewer = dynamic(() => import("./ProductViewer"), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

type Item =
  | { key: string; label: string; kind: "photo"; photo: ProductImage }
  | { key: string; label: string; kind: "flat"; view: ArtView }
  | { key: string; label: string; kind: "3d" };

function ViewerLoading() {
  return (
    <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
      <Loader2 className="size-5 animate-spin" />
      <span className="eyebrow">Loading 3D view</span>
    </div>
  );
}

/**
 * Product imagery: the selected colour's photos, the illustrated technical
 * flats (front, back, close-up) and an optional interactive 3D form study.
 */
export function ProductGallery({ product, colorHex, colorName }: { product: Product; colorHex: string; colorName: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const webgl = useWebGLSupport();

  const color = product.colors.find((c) => c.hex === colorHex) ?? product.colors[0];
  const photos = productPhotos(product, color);
  const items: Item[] = [
    ...photos.map((photo, i): Item => ({ key: `photo-${i}`, label: photos.length > 1 ? `Photo ${i + 1}` : "Photo", kind: "photo", photo })),
    { key: "front", label: photos.length ? "Flat" : "Front", kind: "flat", view: "front" },
    { key: "back", label: "Back", kind: "flat", view: "back" },
    { key: "detail", label: "Detail", kind: "flat", view: "detail" },
    ...(webgl === false ? [] : [{ key: "3d", label: "3D", kind: "3d" } as Item]),
  ];
  // A colour without the selected photo (e.g. "Photo 2") falls back to its first view.
  const active = items.find((i) => i.key === selected) ?? items[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      <div
        role="group"
        aria-label="Product views"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:max-h-[min(calc(100svh-8rem),60rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={active.key === item.key}
            aria-label={`${item.label} view`}
            onClick={() => setSelected(item.key)}
            className="group relative aspect-[4/5] w-16 shrink-0 overflow-hidden border border-line bg-card transition-colors hover:border-line-strong aria-pressed:border-fg sm:w-20"
          >
            {item.kind === "3d" ? (
              <span className="flex h-full flex-col items-center justify-center gap-1.5 text-muted group-aria-pressed:text-cyan">
                <Box className="size-5" strokeWidth={1.25} />
              </span>
            ) : item.kind === "photo" ? (
              <Image src={item.photo.src} alt="" width={160} height={200} sizes="80px" className="size-full object-cover" />
            ) : (
              <ProductMedia product={product} colorHex={colorHex} colorName={colorName} view={item.view} flat className="size-full" sizes="80px" />
            )}
            <span aria-hidden className="eyebrow absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[0.5625rem] text-muted backdrop-blur-sm">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* On desktop the stage fits the viewport so it can stay pinned beside the details. */}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-card lg:aspect-auto lg:h-[min(calc(100svh-8rem),60rem)]">
        {active.kind === "3d" ? (
          viewerFailed ? (
            <div className="absolute inset-0">
              <ProductMedia product={product} colorHex={colorHex} colorName={colorName} className="absolute inset-0 size-full opacity-40" />
              <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-muted">
                The 3D view isn&apos;t available on this device. The photos and flats show every side of the piece.
              </p>
            </div>
          ) : (
            <>
              {!viewerReady && <ViewerLoading />}
              <div className={`absolute inset-0 transition-opacity duration-700 ${viewerReady ? "opacity-100" : "opacity-0"}`}>
                <CanvasErrorBoundary onError={() => setViewerFailed(true)}>
                  <ProductViewer garment={product.garment} color={colorHex} graphic={product.graphic} modelUrl={product.model3d} onReady={() => setViewerReady(true)} />
                </CanvasErrorBoundary>
              </div>
              <p className="eyebrow pointer-events-none absolute left-4 top-4 max-w-[16rem] text-[0.5625rem] leading-relaxed text-muted">
                {product.model3d ? "3D model — drag to rotate" : "Form study — a sculptural 3D form built from the flat, not a true-to-life garment model. Drag to rotate."}
              </p>
            </>
          )
        ) : active.kind === "photo" ? (
          <>
            <Image
              key={active.photo.src}
              src={active.photo.src}
              alt={active.photo.alt}
              width={active.photo.width}
              height={active.photo.height}
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority
              className="absolute inset-0 size-full animate-[fade-in_600ms_ease-out] object-cover"
            />
            {active.photo.credit && (
              <p className="absolute bottom-3 left-3 bg-ink/60 px-2 py-1 text-[0.625rem] text-fg/70 backdrop-blur-sm">
                Photo:{" "}
                <a href={active.photo.credit.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-fg hover:underline">
                  {active.photo.credit.name} / {active.photo.credit.source}
                </a>
                {product.isDemo && " — stock image, demo product"}
              </p>
            )}
          </>
        ) : (
          <>
            <ProductMedia
              key={`${active.key}-${colorHex}`}
              product={product}
              colorHex={colorHex}
              colorName={colorName}
              view={active.view}
              flat
              annotate={active.view === "front"}
              priority={!photos.length && active.view === "front"}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="absolute inset-0 size-full animate-[fade-in_600ms_ease-out]"
            />
            {/* The annotated front view already labels itself as an illustrated flat. */}
            {product.isDemo && active.view !== "front" && (
              <p className="eyebrow pointer-events-none absolute bottom-4 right-4 text-[0.5625rem] text-muted">Illustration — demo product</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
