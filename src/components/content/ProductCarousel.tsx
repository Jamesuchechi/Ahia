import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import organicEarring from "@/assets/organic-earring.png";
import linkBracelet from "@/assets/link-bracelet.png";
import { getFeaturedProducts, formatPrice, type CatalogProduct } from "@/lib/catalog";

interface ProductCarouselProps {
  products?: CatalogProduct[];
}

const ProductCarousel = ({ products: initialProducts }: ProductCarouselProps) => {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts || []);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      return;
    }

    const loadProducts = async () => {
      const featured = await getFeaturedProducts(8);
      setProducts(featured);
    };

    loadProducts();
  }, [initialProducts]);

  return (
    <section className="w-full mb-16 px-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="">
          {products.map((product) => {
            const firstImg = product.images[0]?.url || (product.category_name === "Earrings" ? organicEarring : linkBracelet);
            const hoverImg = product.images[1]?.url || firstImg;

            return (
              <CarouselItem
                key={product.id}
                className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-2 md:pr-4"
              >
                <Link to={`/product/${product.slug}`}>
                  <Card className="border-none shadow-none bg-transparent group">
                    <CardContent className="p-0">
                      <div className="aspect-[4/5] mb-3 overflow-hidden bg-muted/10 relative">
                        <img
                          src={firstImg}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                        {hoverImg !== firstImg && (
                          <img
                            src={hoverImg}
                            alt={`${product.name} alternate view`}
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/[0.02]"></div>
                        {product.created_at && new Date(product.created_at) > new Date("2026-06-01") && (
                          <div className="absolute top-2 left-2 bg-background/95 border border-border px-2 py-0.5 text-[10px] tracking-wider uppercase font-medium text-foreground">
                            NEW
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider font-light text-muted-foreground">
                          {product.category_name || "Collection"}
                        </p>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-light text-foreground line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice(product.base_price)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;