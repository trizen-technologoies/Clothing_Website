import { brand } from "./brand";

/*
 * Customer service copy. Placeholder policies for the demo store — replace
 * with real, reviewed policies before launch.
 */

export type HelpTopic = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

export const helpTopics: HelpTopic[] = [
  {
    slug: "shipping",
    title: "Shipping",
    intro: "How and when your order travels.",
    sections: [
      {
        heading: "Delivery options",
        body: [
          "Standard delivery: 3–5 business days, free on orders over $150, otherwise $8.",
          "Express delivery: 1–2 business days, $20.",
        ],
      },
      { heading: "Processing", body: ["Orders placed before 2pm on business days are dispatched the same day."] },
      { heading: "International", body: ["Duties and taxes are calculated at checkout where applicable."] },
    ],
  },
  {
    slug: "returns",
    title: "Returns",
    intro: "Changed your mind? Send it back within 30 days.",
    sections: [
      {
        heading: "Eligibility",
        body: ["Unworn, unwashed pieces with original tags can be returned within 30 days of delivery."],
      },
      { heading: "How to return", body: ["Start a return from your account and drop the parcel at any partner location."] },
      { heading: "Refunds", body: ["Refunds go back to the original payment method within 5–10 business days of us receiving the return."] },
    ],
  },
  {
    slug: "size-guide",
    title: "Size guide",
    intro: "Garment measurements, taken flat, in centimetres.",
    sections: [],
  },
  {
    slug: "faq",
    title: "FAQ",
    intro: "Quick answers to common questions.",
    sections: [
      { heading: "Is this a real store?", body: [`No. ${brand.name} is a demo storefront. Products are fictional and no orders are processed.`] },
      { heading: "How do the fits run?", body: ["Most tops are cut relaxed or boxy. Each product page notes the intended fit, and the size guide lists exact measurements."] },
      { heading: "Why illustrations instead of photos?", body: ["The demo uses technical flats and real-time 3D form studies in place of product photography, which would be added for a real launch."] },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    intro: "We usually reply within one business day.",
    sections: [
      { heading: "Email", body: [`${brand.supportEmail} (placeholder address)`] },
      { heading: "Hours", body: ["Monday to Friday, 9am–6pm."] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    intro: "What this demo stores, and what it doesn't.",
    sections: [
      {
        heading: "This demo",
        body: [
          "Your cart and wishlist are stored in your browser's local storage only. Nothing is sent to a server except the cart contents when you start checkout, which are validated and discarded.",
          "The newsletter form does not store or send your email address.",
        ],
      },
      { heading: "Before launch", body: ["Replace this page with a privacy policy reviewed for your jurisdiction and providers."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms",
    intro: "Placeholder terms of use.",
    sections: [{ heading: "Demo terms", body: ["This site is a demonstration. Products, prices and policies are illustrative and do not constitute an offer for sale."] }],
  },
];
