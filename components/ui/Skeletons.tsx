/** Loading placeholders shown while route params resolve during client navigation. */

const block = "animate-pulse bg-card";

export function PageHeaderSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-[1600px] px-4 pb-14 pt-32 sm:px-6 md:pt-40 lg:px-10">
      <div className={`${block} h-3 w-40`} />
      <div className={`${block} mt-8 h-24 w-3/4 max-w-2xl md:h-36`} />
      <div className={`${block} mt-6 h-4 w-full max-w-md`} />
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="mx-auto grid max-w-[1600px] grid-cols-2 gap-x-3 gap-y-12 px-4 pb-28 sm:gap-x-5 sm:px-6 lg:grid-cols-4 lg:px-10">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className={`${block} aspect-[4/5]`} />
          <div className={`${block} mt-4 h-3 w-2/3`} />
        </div>
      ))}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="mx-auto grid max-w-[1600px] gap-10 px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:grid-cols-12 lg:gap-14 lg:px-10">
      <div className={`${block} aspect-[4/5] lg:col-span-7`} />
      <div className="lg:col-span-5">
        <div className={`${block} h-3 w-24`} />
        <div className={`${block} mt-6 h-20 w-4/5`} />
        <div className={`${block} mt-4 h-5 w-20`} />
        <div className={`${block} mt-10 h-40 w-full`} />
      </div>
    </div>
  );
}
