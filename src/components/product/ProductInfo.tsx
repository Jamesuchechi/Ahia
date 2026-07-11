import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Heart, Minus, Plus, AlertCircle } from "lucide-react";
import { formatPrice, type CatalogProduct } from "@/lib/catalog";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductInfoProps {
  product: CatalogProduct;
}

const getColorClasses = (colorName: string): string => {
  const name = colorName.toLowerCase().trim();
  if (name === "gold") return "bg-[#D4AF37]";
  if (name === "silver") return "bg-[#E5E5E5] border border-gray-300";
  if (name === "black") return "bg-[#1A1A1A]";
  if (name === "white") return "bg-white border border-gray-200";
  if (name === "charcoal" || name === "grey" || name === "gray") return "bg-[#4A4A4A]";
  if (name === "camel" || name === "beige" || name === "sand") return "bg-[#C19A6B]";
  if (name === "navy" || name === "blue") return "bg-[#1E3A8A]";
  if (name === "olive" || name === "green") return "bg-[#3F6212]";
  return "bg-muted"; // fallback
};

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  // Extract all unique attribute names and values
  const allAttributes = useMemo(() => {
    const attrsMap: Record<string, Set<string>> = {};
    product.variants?.forEach((v) => {
      v.attributes?.forEach((attr) => {
        if (!attrsMap[attr.name]) {
          attrsMap[attr.name] = new Set<string>();
        }
        attrsMap[attr.name].add(attr.value);
      });
    });
    
    return Object.entries(attrsMap).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [product]);

  // Initial selected options: pre-select the first available variant's options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const inStockVariant = product.variants?.find((v) => v.stock_qty > 0);
    const initialVariant = inStockVariant || product.variants?.[0];
    const initial: Record<string, string> = {};
    initialVariant?.attributes?.forEach((attr) => {
      initial[attr.name] = attr.value;
    });
    return initial;
  });

  // Check availability status of a specific option value given current selection of other options
  const checkOptionStatus = (attrName: string, val: string) => {
    const hypothetical = { ...selectedOptions, [attrName]: val };
    const matchingVariant = product.variants?.find((v) => {
      if (!v.attributes || v.attributes.length === 0) return true;
      return v.attributes.every((attr) => hypothetical[attr.name] === attr.value);
    });
    
    if (!matchingVariant) return "unavailable";
    if (matchingVariant.stock_qty <= 0) return "out-of-stock";
    return "available";
  };

  // Find currently active variant matching selected options
  const currentVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      if (!v.attributes || v.attributes.length === 0) return true;
      return v.attributes.every((attr) => selectedOptions[attr.name] === attr.value);
    }) || product.variants[0];
  }, [product, selectedOptions]);

  const activePrice = currentVariant && currentVariant.price_override !== null && currentVariant.price_override !== undefined
    ? currentVariant.price_override
    : product.base_price;

  const isOutOfStock = currentVariant ? currentVariant.stock_qty <= 0 : true;

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleAddToBag = async () => {
    if (!currentVariant) return;
    await addItem(product, quantity, currentVariant.id);
    
    const variantDesc = currentVariant.attributes && currentVariant.attributes.length > 0
      ? ` (${currentVariant.attributes.map(a => a.value).join("/")})`
      : "";
    toast.success(`${product.name}${variantDesc} added to your bag.`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb - Show only on desktop */}
      <div className="hidden lg:block">
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
                <Link to={`/category/${product.category_slug || "all"}`}>{product.category_name || "Collection"}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Product title and price */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-light text-muted-foreground mb-1">{product.category_name || "Collection"}</p>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">{product.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <p className="text-xl font-light text-foreground">{formatPrice(activePrice)}</p>
              {currentVariant && currentVariant.price_override !== null && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.base_price)}
                </span>
              )}
            </div>
            <button
              onClick={() => toggle(product.id, product.name)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="p-1 text-foreground/60 hover:text-foreground transition-colors"
            >
              <Heart
                className={`h-5 w-5 transition-all ${wishlisted ? "fill-foreground text-foreground" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Option Selectors */}
      {allAttributes.length > 0 && (
        <div className="space-y-5 py-4 border-t border-b border-border">
          {allAttributes.map((attr) => {
            const isColor = attr.name.toLowerCase() === "color";
            return (
              <div key={attr.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{attr.name}</span>
                    {attr.name.toLowerCase() === "size" && (
                      <>
                        <span className="text-muted-foreground/30 text-xs">|</span>
                        <Link 
                          to={`/about/size-guide?tab=${
                            product.category_slug?.includes("clothing") || product.category_slug?.includes("apparel")
                              ? "apparel"
                              : product.category_slug?.includes("shoes") || product.category_slug?.includes("footwear")
                              ? "footwear"
                              : "jewelry"
                          }`}
                          className="text-xs font-light text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Size Guide
                        </Link>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-foreground font-light">{selectedOptions[attr.name]}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {attr.values.map((value) => {
                    const status = checkOptionStatus(attr.name, value);
                    const isSelected = selectedOptions[attr.name] === value;
                    
                    if (isColor) {
                      const colorClass = getColorClasses(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [attr.name]: value }))}
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? "ring-2 ring-foreground ring-offset-2 scale-105 shadow-sm" : "hover:scale-105"
                          }`}
                          title={`${value} (${status})`}
                        >
                          <span className={`w-6 h-6 rounded-full ${colorClass}`} />
                          {status === "out-of-stock" && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="w-8 h-[1px] bg-foreground/60 rotate-45" />
                            </span>
                          )}
                          {status === "unavailable" && (
                            <span className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center pointer-events-none opacity-40">
                              <span className="w-8 h-[1px] bg-destructive rotate-45" />
                            </span>
                          )}
                        </button>
                      );
                    }
                    
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [attr.name]: value }))}
                        className={`px-3 py-1.5 text-xs font-light tracking-wide border transition-all ${
                          isSelected
                            ? "border-foreground bg-foreground text-background font-medium"
                            : status === "unavailable"
                            ? "border-dashed border-border text-muted-foreground/30 cursor-not-allowed line-through"
                            : status === "out-of-stock"
                            ? "border-border text-muted-foreground/50 line-through relative"
                            : "border-border hover:border-foreground/40 text-foreground"
                        }`}
                        disabled={status === "unavailable"}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product details */}
      <div className="space-y-4 py-2 border-b border-border">
        {currentVariant?.sku && (
          <div className="space-y-1">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">SKU Reference</h3>
            <p className="text-sm font-light text-foreground">{currentVariant.sku}</p>
          </div>
        )}
        
        {currentVariant && (
          <div className="space-y-1">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Availability</h3>
            {isOutOfStock ? (
              <div className="flex items-center gap-1.5 text-destructive text-sm font-light">
                <AlertCircle className="h-4 w-4" />
                <span>Out of Stock</span>
              </div>
            ) : (
              <p className="text-sm font-light text-emerald-600">
                In Stock {currentVariant.stock_qty <= 5 && `(Only ${currentVariant.stock_qty} left)`}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-1">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium font-sans">Details</h3>
          <p className="text-sm font-light text-muted-foreground">{product.description}</p>
        </div>
      </div>

      {/* Quantity and Add to Cart */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-light text-foreground">Quantity</span>
          <div className="flex items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementQuantity}
              disabled={isOutOfStock}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-l border-r border-border">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementQuantity}
              disabled={isOutOfStock}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button 
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddToBag}
          disabled={isOutOfStock || !currentVariant}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Bag"}
        </Button>
      </div>
    </div>
  );
};

export default ProductInfo;