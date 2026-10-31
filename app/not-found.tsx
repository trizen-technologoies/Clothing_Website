import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { btn, btnArrow } from "@/components/ui/buttons";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-center px-4 pt-24 sm:px-6 lg:px-10">
      <p className="eyebrow text-cyan">Error 404 — Signal lost</p>
      <h1 className="font-display-x mt-6 text-[clamp(4rem,14vw,14rem)]">Not found.</h1>
      <p className="mt-6 max-w-md text-fg/70">This page doesn&apos;t exist — or it moved. Head back to the collection.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className={btn.primary}>
          Shop all <ArrowRight className={btnArrow} />
        </Link>
        <Link href="/" className={btn.secondary}>
          Home
        </Link>
      </div>
    </div>
  );
}
