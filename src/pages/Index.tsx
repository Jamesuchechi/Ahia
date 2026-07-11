import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import FiftyFiftySection from "../components/content/FiftyFiftySection";
import OneThirdTwoThirdsSection from "../components/content/OneThirdTwoThirdsSection";
import ProductCarousel from "../components/content/ProductCarousel";
import EditorialSection from "../components/content/EditorialSection";
import { Card, CardContent } from "@/components/ui/card";
import { getCatalogCategories, getFeaturedProducts, formatPrice, type CatalogCategory, type CatalogProduct } from "@/lib/catalog";

const Index = () => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    const loadContent = async () => {
      const [nextCategories, nextProducts] = await Promise.all([
        getCatalogCategories(),
        getFeaturedProducts(4),
      ]);

      setCategories(nextCategories.slice(0, 4));
      setProducts(nextProducts);
    };

    loadContent();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <section className="px-6 py-10 md:py-14">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.2em] text-muted-foreground">Featured collection</p>
              <h2 className="text-2xl font-light text-foreground">Discover curated pieces from the catalog</h2>
            </div>
            <Link to="/category/all" className="text-sm font-light text-foreground underline underline-offset-4">
              Browse all products
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`}>
                <Card className="border border-border/70 bg-background shadow-none transition-transform duration-200 hover:-translate-y-1">
                  <CardContent className="flex min-h-28 items-end justify-between p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</p>
                      <h3 className="text-lg font-light text-foreground">{category.name}</h3>
                    </div>
                    <span className="text-sm font-light text-muted-foreground">Shop</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`}>
                <Card className="border border-border/70 bg-background shadow-none transition-transform duration-200 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <img
                      src={product.images[0]?.url || ""}
                      alt={product.name}
                      className="h-56 w-full object-cover"
                    />
                    <div className="space-y-1 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category_name || "Collection"}</p>
                      <h3 className="text-lg font-light text-foreground">{product.name}</h3>
                      <p className="text-sm font-light text-foreground">{formatPrice(product.base_price)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <FiftyFiftySection />
        <ProductCarousel />
        <LargeHero />
        <OneThirdTwoThirdsSection />
        <EditorialSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
