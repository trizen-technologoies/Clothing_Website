"use client";

import { useInView } from "@/lib/hooks";

type Props = {
  index: string;
  children: string;
  className?: string;
};

/** "[ 02 ] ——— MANIFESTO" label whose rule draws in when it enters view. */
export function SectionLabel({ index, children, className = "" }: Props) {
  const [ref, inView] = useInView<HTMLParagraphElement>({ once: true, rootMargin: "0px 0px -10% 0px" });

  return (
    <p ref={ref} data-inview={inView} className={`group/label eyebrow flex items-center gap-3 text-muted ${className}`}>
      <span className="text-fg">[ {index} ]</span>
      <span
        aria-hidden
        className="h-px w-10 origin-left scale-x-0 bg-cyan transition-transform delay-150 duration-700 ease-out-expo group-data-[inview=true]/label:scale-x-100 motion-reduce:scale-x-100"
      />
      <span>{children}</span>
    </p>
  );
}
