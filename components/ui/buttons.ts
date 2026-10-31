/** Shared button class names — used on <button> and <Link> alike. */

const base =
  "group/btn relative inline-flex items-center justify-center gap-3 whitespace-nowrap eyebrow font-medium select-none transition-[background-color,border-color,color,opacity] duration-300 ease-out-expo disabled:cursor-not-allowed disabled:opacity-40";

export const btn = {
  primary: `${base} h-12 px-7 bg-fg text-ink hover:bg-cyan`,
  secondary: `${base} h-12 px-7 border border-line-strong text-fg hover:border-fg hover:bg-white/5`,
  ghost: `${base} h-10 px-3 text-muted hover:text-fg`,
  icon: "inline-flex size-10 items-center justify-center text-fg transition-colors hover:text-cyan",
};

/** Arrow that nudges right on hover of the parent button. */
export const btnArrow = "size-4 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-1";
