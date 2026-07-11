import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Pagination from "./Pagination";
import organicEarring from "@/assets/organic-earring.png";
import linkBracelet from "@/assets/link-bracelet.png";
import type { CatalogProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

interface ProductGridProps {
  products: CatalogProduct[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductGrid = ({ products, loading, page, totalPages, onPageChange }: ProductGridProps) => {
  return (
    <section className="w-full px-6 mb-16">
      {loading ? (
        <div className="py-12 text-center text-sm font-light text-muted-foreground">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-sm font-light text-muted-foreground">No products match the current filters.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`}>
              <Card className="border-none shadow-none bg-transparent group cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-square mb-3 overflow-hidden bg-muted/10 relative">
                    <img
                      src={product.images[0]?.url || (product.category_name === "Earrings" ? organicEarring : linkBracelet)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:opacity-0"
                    />
                    <img
                      src={product.category_name === "Earrings" ? organicEarring : linkBracelet}
                      alt={`${product.name} lifestyle`}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 opacity-0 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/[0.03]"></div>
                    {product.created_at && new Date(product.created_at) > new Date("2026-06-01") && (
                      <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-black">NEW</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-light text-foreground">{product.category_name || "Collection"}</p>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                      <p className="text-sm font-light text-foreground">{formatPrice(product.base_price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  );
};

export default ProductGrid;