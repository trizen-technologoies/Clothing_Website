/**
 * Brand configuration.
 *
 * The brand name, copy and outbound links live here so the identity can be
 * swapped without touching components. The logo itself is drawn in
 * `components/layout/Wordmark.tsx` — see the README for replacing it.
 */
export const brand = {
  name: "VANTA",
  tagline: "Built different.",
  description:
    "Streetwear for those who refuse to blend in. A demo storefront — products are fictional and no orders are processed.",
  season: "SS—26",
  supportEmail: "support@example.com",
  currency: "USD",
  locale: "en-US",
  /** Free shipping threshold in minor units (cents). */
  freeShippingThreshold: 15000,
  /** Placeholder social links — replace with the brand's real profiles. */
  social: [
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "TikTok", href: "https://www.tiktok.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
  ],
} as const;
