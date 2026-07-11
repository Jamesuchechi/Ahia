import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewProduct from "./ReviewProduct";
import type { CatalogProduct } from "@/lib/catalog";
import { useReviews } from "@/hooks/useReviews";

const StarIcon = ({ filled, size = "sm" }: { filled: boolean; size?: "sm" | "lg" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} ${filled ? "text-foreground" : "text-muted-foreground/30"}`}
  >
    <path
      fillRule="evenodd"
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
      clipRule="evenodd"
    />
  </svg>
);

const StarRow = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((s) => (
      <StarIcon key={s} filled={s <= rating} size={size} />
    ))}
  </div>
);

const formatReviewDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

interface ProductDescriptionProps {
  product: CatalogProduct;
}

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const { reviews, isLoading, isSubmitting, hasReviewed, submitReview, averageRating } =
    useReviews(product.id);

  return (
    <div className="space-y-0 mt-8 border-t border-border">
      {/* Description */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Description</span>
          {isDescriptionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isDescriptionOpen && (
          <div className="pb-6 space-y-4">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">{product.description}</p>
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              Designed for versatile styling, this piece brings sculptural simplicity and enduring
              craftsmanship to everyday wear.
            </p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Product Details</span>
          {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isDetailsOpen && (
          <div className="pb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">SKU</span>
              <span className="text-sm font-light text-foreground">
                {product.variants[0]?.sku || "Available now"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">Collection</span>
              <span className="text-sm font-light text-foreground">
                {product.category_name || "Collection"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Care Instructions */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsCareOpen(!isCareOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Care & Cleaning</span>
          {isCareOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isCareOpen && (
          <div className="pb-6 space-y-4">
            <ul className="space-y-2">
              <li className="text-sm font-light text-muted-foreground">• Clean with a soft, dry cloth after each wear</li>
              <li className="text-sm font-light text-muted-foreground">• Avoid contact with perfumes, lotions, and cleaning products</li>
              <li className="text-sm font-light text-muted-foreground">• Store in the provided pouch when not wearing</li>
              <li className="text-sm font-light text-muted-foreground">• Remove before swimming, exercising, or showering</li>
            </ul>
          </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="border-b border-border lg:mb-16">
        <Button
          variant="ghost"
          onClick={() => setIsReviewsOpen(!isReviewsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <div className="flex items-center gap-3">
            <span>Customer Reviews</span>
            {averageRating !== null ? (
              <div className="flex items-center gap-1">
                <StarRow rating={Math.round(averageRating)} />
                <span className="text-sm font-light text-muted-foreground">{averageRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-light">No reviews yet</span>
            )}
          </div>
          {isReviewsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isReviewsOpen && (
          <div className="pb-6 space-y-6">
            {/* Write a review */}
            <ReviewProduct
              productId={product.id}
              hasReviewed={hasReviewed}
              isSubmitting={isSubmitting}
              onSubmit={submitReview}
            />

            {/* Reviews list */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="space-y-2 animate-pulse">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground">
                No reviews yet. Be the first to share your thoughts.
              </p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StarRow rating={review.rating} />
                        <span className="text-xs font-light text-muted-foreground">
                          {review.reviewer_name || "Verified buyer"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>
                    {review.body && (
                      <p className="text-sm font-light text-muted-foreground leading-relaxed">
                        "{review.body}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;