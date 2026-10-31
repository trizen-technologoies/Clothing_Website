import { HeroSection } from "@/components/hero/HeroSection";
import { HomeStory } from "@/components/hero/HomeStory";
import { BestSellers } from "@/components/sections/BestSellers";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { CategoryShowcase } from "@/components/sections/CategoryShowcase";
import { FeaturedCollection } from "@/components/sections/FeaturedCollection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { getCollection, getProducts, sortBestsellers, sortFeatured } from "@/lib/commerce";

export default async function HomePage() {
  const [products, collection] = await Promise.all([getProducts(), getCollection("001")]);
  const featured = sortFeatured(products);
  const spotlight = featured[0] ?? products[0];

  return (
    <>
      <HomeStory>
        <HeroSection spotlight={{ name: spotlight.name, slug: spotlight.slug, price: spotlight.price, currency: spotlight.currency }} />
        <BrandStatement />
        {collection && (
          <FeaturedCollection
            slug={collection.slug}
            title={collection.title}
            tagline={collection.tagline}
            description={collection.description}
            products={collection.products}
          />
        )}
      </HomeStory>
      <ProductShowcase products={featured.slice(0, 4)} />
      <CampaignSection />
      <CategoryShowcase products={products} />
      <BestSellers products={sortBestsellers(products)} />
      <NewsletterSection />
    </>
  );
}
