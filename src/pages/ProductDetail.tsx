import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import ProductCarousel from "../components/content/ProductCarousel";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { 
  getCatalogProductByIdentifier, 
  getRelatedProducts, 
  getCompleteTheLookProducts, 
  type CatalogProduct 
} from "@/lib/catalog";

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [completeLookProducts, setCompleteLookProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      const nextProduct = await getCatalogProductByIdentifier(productId);
      setProduct(nextProduct);
      
      if (nextProduct) {
        const [related, completeLook] = await Promise.all([
          getRelatedProducts(nextProduct, 8),
          getCompleteTheLookProducts(nextProduct, 4),
        ]);
        setRelatedProducts(related);
        setCompleteLookProducts(completeLook);
      }
      
      setLoading(false);
    };

    loadProduct();
  }, [productId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <section className="w-full px-6">
          {/* Breadcrumb - Show above image on smaller screens */}
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${product?.category_slug || "all"}`}>{product?.category_name || "Collection"}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product?.name || "Product"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <ProductImageGallery images={product?.images || []} />
            
            <div className="lg:pl-12 mt-8 lg:mt-0 lg:sticky lg:top-6 lg:h-fit">
              {loading ? (
                <div className="py-12 text-sm font-light text-muted-foreground">Loading product…</div>
              ) : product ? (
                <>
                  <ProductInfo product={product} />
                  <ProductDescription product={product} />
                </>
              ) : (
                <div className="py-12 text-sm font-light text-muted-foreground">This product could not be found.</div>
              )}
            </div>
          </div>
        </section>
        
        {completeLookProducts.length > 0 && (
          <section className="w-full mt-16 lg:mt-24">
            <div className="mb-4 px-6">
              <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground block mb-1">Editorial Recommendation</span>
              <h2 className="text-sm font-light text-foreground">Complete the Look</h2>
            </div>
            <ProductCarousel products={completeLookProducts} />
          </section>
        )}
        
        {relatedProducts.length > 0 && (
          <section className="w-full mt-8">
            <div className="mb-4 px-6">
              <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground block mb-1">Matching items</span>
              <h2 className="text-sm font-light text-foreground">
                {product?.category_name ? `More from ${product.category_name}` : "You might also like"}
              </h2>
            </div>
            <ProductCarousel products={relatedProducts} />
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;